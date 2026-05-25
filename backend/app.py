"""
app.py – Flask backend using EfficientNetB0 + Transformer captioning model.
"""

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  
import re
import pickle
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import tensorflow as tf
import keras
from keras import layers
from keras.applications import efficientnet
from keras.layers import TextVectorization
import numpy as np
import cv2


# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR  = os.path.join(BASE_DIR, "..", "frontend")
PARTS_DIR     = os.path.join(BASE_DIR, "caption_model_parts")
VOCAB_PATH    = os.path.join(BASE_DIR, "vocab.pkl")

# ── Config ───────────────────────────────────────────────S─────────────────────
IMAGE_SIZE    = (299, 299)
SEQ_LENGTH    = 25
VOCAB_SIZE    = 10000
EMBED_DIM     = 512
FF_DIM        = 512
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

# ── Model Classes ─────────────────────────────────────────────────────────────
strip_chars = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".replace("<","").replace(">","")



def custom_standardization(input_string):
    lowercase = tf.strings.lower(input_string)
    return tf.strings.regex_replace(lowercase, "[%s]" % re.escape(strip_chars), "")

class TransformerEncoderBlock(layers.Layer):
    def __init__(self, embed_dim, dense_dim, num_heads, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim   = embed_dim
        self.dense_dim   = dense_dim
        self.num_heads   = num_heads
        self.attention   = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim, dropout=0.0)
        self.layernorm_1 = layers.LayerNormalization()
        self.layernorm_2 = layers.LayerNormalization()
        self.dense       = layers.Dense(embed_dim, activation="relu")

    def call(self, inputs, training, mask=None):
        inputs = self.layernorm_1(inputs)
        inputs = self.dense(inputs)
        out    = self.attention(query=inputs, value=inputs, key=inputs, training=training)
        return self.layernorm_2(inputs + out)

    def get_config(self):
        config = super().get_config()
        config.update({"embed_dim": self.embed_dim, "dense_dim": self.dense_dim, "num_heads": self.num_heads})
        return config

class PositionalEmbedding(layers.Layer):
    def __init__(self, sequence_length, vocab_size, embed_dim, **kwargs):
        super().__init__(**kwargs)
        self.sequence_length     = sequence_length
        self.vocab_size          = vocab_size
        self.embed_dim           = embed_dim
        self.token_embeddings    = layers.Embedding(input_dim=vocab_size, output_dim=embed_dim)
        self.position_embeddings = layers.Embedding(input_dim=sequence_length, output_dim=embed_dim)
        self.embed_scale         = tf.math.sqrt(tf.cast(embed_dim, tf.float32))

    def call(self, inputs):
        length    = tf.shape(inputs)[-1]
        positions = tf.range(start=0, limit=length, delta=1)
        return self.token_embeddings(inputs) * self.embed_scale + self.position_embeddings(positions)

    def compute_mask(self, inputs, mask=None):
        return tf.math.not_equal(inputs, 0)

    def get_config(self):
        config = super().get_config()
        config.update({"sequence_length": self.sequence_length, "vocab_size": self.vocab_size, "embed_dim": self.embed_dim})
        return config

class TransformerDecoderBlock(layers.Layer):
    def __init__(self, embed_dim, ff_dim, num_heads, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim   = embed_dim
        self.ff_dim      = ff_dim
        self.num_heads   = num_heads
        self.attention_1 = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim, dropout=0.1)
        self.attention_2 = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim, dropout=0.1)
        self.ffn_layer_1 = layers.Dense(ff_dim, activation="relu")
        self.ffn_layer_2 = layers.Dense(embed_dim)
        self.layernorm_1 = layers.LayerNormalization()
        self.layernorm_2 = layers.LayerNormalization()
        self.layernorm_3 = layers.LayerNormalization()
        self.embedding   = PositionalEmbedding(SEQ_LENGTH, VOCAB_SIZE, embed_dim)
        self.out         = layers.Dense(VOCAB_SIZE, activation="softmax")
        self.dropout_1   = layers.Dropout(0.3)
        self.dropout_2   = layers.Dropout(0.5)
        self.supports_masking = True

    def call(self, inputs, encoder_outputs, training, mask=None):
        inputs      = self.embedding(inputs)
        causal_mask = self.get_causal_attention_mask(inputs)
        if mask is not None:
            padding_mask  = tf.cast(mask[:, :, tf.newaxis], dtype=tf.int32)
            combined_mask = tf.minimum(
                tf.cast(mask[:, tf.newaxis, :], dtype=tf.int32), causal_mask)
        else:
            padding_mask  = None
            combined_mask = causal_mask
        out1    = self.layernorm_1(inputs + self.attention_1(
            query=inputs, value=inputs, key=inputs,
            attention_mask=combined_mask, training=training))
        out2    = self.layernorm_2(out1 + self.attention_2(
            query=out1, value=encoder_outputs, key=encoder_outputs,
            attention_mask=padding_mask, training=training))
        ffn_out = self.dropout_1(self.ffn_layer_1(out2), training=training)
        ffn_out = self.layernorm_3(self.ffn_layer_2(ffn_out) + out2, training=training)
        return self.out(self.dropout_2(ffn_out, training=training))

    def get_causal_attention_mask(self, inputs):
        input_shape     = tf.shape(inputs)
        batch_size, seq = input_shape[0], input_shape[1]
        mask = tf.cast(tf.range(seq)[:, tf.newaxis] >= tf.range(seq), dtype="int32")
        mask = tf.reshape(mask, (1, seq, seq))
        return tf.tile(mask, tf.concat([tf.expand_dims(batch_size, -1),
                                        tf.constant([1, 1], dtype=tf.int32)], axis=0))

    def get_config(self):
        config = super().get_config()
        config.update({"embed_dim": self.embed_dim, "ff_dim": self.ff_dim, "num_heads": self.num_heads})
        return config


# ── Load Vocab ────────────────────────────────────────────────────────────────
print("[INFO] Loading vocabulary ...")
with open(VOCAB_PATH, "rb") as f:
    vocab = pickle.load(f)

index_to_word = dict(zip(range(len(vocab)), vocab))

vectorization = TextVectorization(
    max_tokens=VOCAB_SIZE,
    output_mode="int",
    output_sequence_length=SEQ_LENGTH,
    standardize=custom_standardization,
)
vectorization.set_vocabulary(vocab)

# ── Rebuild CNN Model (no download needed) ────────────────────────────────────
print("[INFO] Building CNN model ...")
base_model = efficientnet.EfficientNetB0(
    input_shape=(*IMAGE_SIZE, 3), include_top=False, weights="imagenet")
base_model.trainable = False
out = layers.Reshape((-1, base_model.output.shape[-1]))(base_model.output)
cnn_model = keras.models.Model(base_model.input, out)
print("[INFO] CNN model ready ✅")

# ── Rebuild and Load Encoder ──────────────────────────────────────────────────
print("[INFO] Loading encoder ...")
encoder = TransformerEncoderBlock(embed_dim=EMBED_DIM, dense_dim=FF_DIM, num_heads=1)

# Build encoder with dummy data
dummy_img   = tf.zeros((1, 100, 1280))
encoder(dummy_img, training=False)
encoder_weights = np.load(
    os.path.join(PARTS_DIR, "encoder_weights.npy"), allow_pickle=True)
encoder.set_weights(list(encoder_weights))

# ── Rebuild and Load Decoder ──────────────────────────────────────────────────
print("[INFO] Loading decoder ...")
decoder = TransformerDecoderBlock(embed_dim=EMBED_DIM, ff_dim=FF_DIM, num_heads=2)

# Build decoder with dummy data
dummy_seq = tf.zeros((1, SEQ_LENGTH), dtype=tf.int32)
dummy_enc = tf.zeros((1, 100, EMBED_DIM))
decoder(dummy_seq, dummy_enc, training=False)
decoder_weights = np.load(
    os.path.join(PARTS_DIR, "decoder_weights.npy"), allow_pickle=True)
decoder.set_weights(list(decoder_weights))

print("[INFO] All models loaded successfully!")


# ── Inference ─────────────────────────────────────────────────────────────────
def preprocess_image(file_obj):
    img = Image.open(file_obj).convert("RGB").resize(IMAGE_SIZE)
    arr = np.array(img, dtype=np.float32)
    return tf.image.convert_image_dtype(tf.expand_dims(arr, 0), tf.float32)

def is_blurry(file_obj, threshold=150):
    file_obj.seek(0)
    img_bytes = np.frombuffer(file_obj.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_GRAYSCALE)
    laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()
    print(f"[BLUR SCORE] {laplacian_var:.2f} | Threshold: {threshold} | Blurry: {laplacian_var < threshold}")
    file_obj.seek(0)
    return laplacian_var < threshold

def generate_caption(file_obj):
    if is_blurry(file_obj):
        return "Image is too blurry to generate an accurate caption."

    img         = preprocess_image(file_obj)
    img_embed   = cnn_model(img)
    encoded_img = encoder(img_embed, training=False)

    decoded_caption = "<start>"

    for i in range(SEQ_LENGTH - 1):
        tokenized        = vectorization([decoded_caption])[:, :-1]
        preds            = decoder(tokenized, encoded_img, training=False)
        sampled_token    = np.argmax(preds[0, i, :])
        sampled_word     = index_to_word.get(sampled_token, None)

        if sampled_word is None or sampled_word == "<end>":
            break

        decoded_caption += " " + sampled_word

    caption = decoded_caption.replace("<start>", "").strip()

    words  = caption.split()
    result = [words[0]] if words else []
    for word in words[1:]:
        if word != result[-1]:
            result.append(word)
    return " ".join(result)

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400
    f = request.files["image"]
    if f.filename == "":
        return jsonify({"error": "No file selected."}), 400
    if f.mimetype not in ALLOWED_TYPES:
        return jsonify({"error": f"Unsupported type '{f.mimetype}'."}), 415
    try:
        caption = generate_caption(f)
        if not caption:
            return jsonify({"error": "Caption generation failed."}), 500
        return jsonify({"caption": caption}), 200
    except Exception as exc:
        app.logger.error(f"Error: {exc}")
        return jsonify({"error": "Internal server error."}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)