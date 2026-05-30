import { useState, useRef, useCallback } from 'react'
import { IconCopy, IconCheck, IconDownload, IconClock } from './components/Icons'
import DropZone from './components/DropZone'
import ImageInfoPanel from './components/ImageInfoPanel'
import ResultBox from './components/ResultBox'
import HistoryPanel from './components/HistoryPanel'
import DetailModal from './components/DetailModal'

const API = 'http://localhost:5000/predict'
const MAX_HISTORY = 5

// ── Helper Functions ──────────────────────────────────────────────────────────
function getImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => resolve({ width: null, height: null })
    img.src = url
  })
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [status, setStatus]       = useState('idle')
  const [caption, setCaption]     = useState('')
  const [drag, setDrag]           = useState(false)
  const [imageInfo, setImageInfo] = useState(null)
  const [history, setHistory]     = useState([])
  const [copied, setCopied]       = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showHistory, setShowHistory]   = useState(false)

  const inputRef = useRef(null)

  // ── Reset ──────────────────
  const onReset = () => {
    setFile(null)
    setPreview(null)
    setStatus('idle')
    setCaption('')
    setImageInfo(null)
    setCopied(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── File handler ───────────
  const handleFile = useCallback(async (f) => {
    if (!f) return
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)) {
      setFile(null)
      setPreview(null)
      setCaption('Unsupported file format. Please upload image files only (JPG, PNG, WEBP).')
      setStatus('error')
      setImageInfo(null)
      return
    }
    setFile(f)
    const objectUrl = URL.createObjectURL(f)
    setPreview(objectUrl)
    setStatus('idle')
    setCaption('')
    setCopied(false)
    const dims = await getImageDimensions(f)
    setImageInfo({ name: f.name, size: f.size, width: dims.width, height: dims.height })
  }, [])

  // ── Copy ──────────────
  const onCopy = () => {
    if (!caption) return
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Download ─────────
  const onDownload = () => {
    if (!caption) return
    const blob = new Blob([caption], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `caption_${(file?.name || 'image').replace(/\.[^/.]+$/, '')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Submit ──────────
  const onSubmit = async () => {
    if (!file) return
    setStatus('loading')
    const form = new FormData()
    form.append('image', file)
    try {
      const res  = await fetch(API, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || data.error) {
        setCaption(data.error || 'Error')
        setStatus('error')
      } else if (data.caption.startsWith('Image is too blurry')) {
        setCaption(data.caption)
        setStatus('blurry')
      } else {
        setCaption(data.caption)
        setStatus('success')
        setHistory(prev => {
          const entry = {
            id:        Date.now(),
            caption:   data.caption,
            filename:  file.name,
            thumbnail: preview,
            time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          return [entry, ...prev].slice(0, MAX_HISTORY)
        })
      }
    } catch {
      setCaption('Cannot reach server. Is Flask running?')
      setStatus('error')
    }
  }

  // ── Render ─────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fef9e7 0%, #fdf3c0 40%, #fde9a2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '2rem',
      paddingTop: '3rem',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Background blobs ── */}
      <div style={{ position: 'fixed', top: '-8%', left: '-8%', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,220,100,0.35) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(252,196,80,0.25) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', right: '5%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,235,150,0.4) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Content wrapper ── */}
      <div style={{ width: '100%', maxWidth: '620px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f5c842, #e8a320)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(232,163,32,0.45)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: '700', color: '#5a3e10', letterSpacing: '-0.03em', fontFamily: "'Playfair Display', serif" }}>
              CaptionAI
            </span>
          </div>
          <p style={{ color: '#b08530', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
            Describe the world with Artificial Intelligence
          </p>
        </div>

        {/* ── Main Card  ── */}
        <div style={{
          position: 'relative',
          background: 'rgba(255, 253, 235, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(240,200,80,0.45)',
          borderRadius: '24px',
          overflow: 'visible',
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(180,130,20,0.18), 0 4px 16px rgba(180,130,20,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>

          {/* ── Recent Captions Button ──  */}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              style={{
              position: 'absolute', top: '1rem', right: '1rem',
              padding: '0.35rem 0.75rem', borderRadius: '100px',
              width: 'auto', height: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,253,230,0.95)',
              border: '1.5px solid rgba(232,163,32,0.4)',
              cursor: 'pointer', zIndex: 2,
            }}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9a6810"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="12 8 12 12 14 14"/>
                  <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '-5px', right: '-5px',
                  width: '14px', height: '14px',
                  borderRadius: '50%',
                  background: '#e8a320',
                  border: '2px solid rgba(255,253,230,0.98)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', fontWeight: '800', color: '#5a3a06',
                }}>
                  {history.length}
                </div>
              </div>
            </button>
          )}

          {/* ── Drop Zone ── */}
          <DropZone
            status={status}
            preview={preview}
            drag={drag}
            setDrag={setDrag}
            handleFile={handleFile}
          />

          {/* ── Image Info Panel ── */}
          <ImageInfoPanel imageInfo={imageInfo} />

          {/* ── Action Button Row ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            {status === 'success' || status === 'blurry' ? (
              <button onClick={onReset} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '100px',
                background: 'rgba(160,110,20,0.1)', border: '1.5px solid rgba(200,155,30,0.35)',
                color: '#7a5210', fontSize: '0.85rem', fontWeight: '500',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                <span>Upload Again</span><span>↺</span>
              </button>
            ) : (
              <button onClick={onSubmit} disabled={!file || status === 'loading'} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.4rem', borderRadius: '100px',
                background: (!file || status === 'loading') ? 'rgba(160,110,20,0.12)' : 'linear-gradient(135deg, #f5c842, #e8a320)',
                border: 'none',
                color: (!file || status === 'loading') ? 'rgba(120,80,10,0.4)' : '#5a3a06',
                fontSize: '0.85rem', fontWeight: '700',
                cursor: (!file || status === 'loading') ? 'not-allowed' : 'pointer',
                boxShadow: (!file || status === 'loading') ? 'none' : '0 4px 18px rgba(232,163,32,0.5)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                <span>{status === 'loading' ? 'Analyzing…' : 'Generate Caption'}</span>
                {status !== 'loading' && <span>→</span>}
                {status === 'loading' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(120,80,10,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="#7a5210" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* ── Result Box ── */}
          <ResultBox
            status={status}
            caption={caption}
            copied={copied}
            onCopy={onCopy}
            onDownload={onDownload}
          />
        </div>
          
        {/* ── Footer ── */}
        <p style={{ textAlign: 'center', color: 'rgba(130,90,10,0.4)', fontSize: '0.75rem', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          &copy; 2026 CaptionAI. All rights reserved.
        </p>
      </div>

      {/* ── History Slide-in Panel ── */}
      {showHistory && (
        <HistoryPanel
          history={history}
          onClose={() => setShowHistory(false)}
          onSelect={(item) => { setSelectedItem(item); setShowHistory(false) }}
        />
      )}

      {/* ── Detail Modal ── */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
       
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        button:hover  { opacity: 0.88; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>
    </div>
  )
}