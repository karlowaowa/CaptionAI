import { useRef } from 'react'

export function getImageDimensions(file) {
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

export default function DropZone({ status, preview, drag, setDrag, handleFile }) {
  const inputRef = useRef(null)

  return (
    <div
      onClick={() => (status !== 'success' && status !== 'blurry') && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); if (status !== 'success') setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (status !== 'success') handleFile(e.dataTransfer.files[0])
      }}
      style={{
        borderRadius: '16px', overflow: 'hidden',
        marginTop: preview ? '2.5rem' : '2.5rem',
        marginBottom: preview ? '1.25rem' : '1.25rem',
        cursor: (status === 'success' || status === 'blurry') ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        ...(preview ? {
          boxShadow: '0 6px 24px rgba(180,130,20,0.2)',
          border: '2px solid rgba(240,200,80,0.5)',
        } : {
          border: `2px dashed ${drag ? '#c98a10' : '#d4a843'}`,
          background: drag
            ? 'linear-gradient(135deg, rgba(253,230,100,0.4), rgba(255,210,80,0.3))'
            : 'linear-gradient(135deg, #fffbf0, #fff8e1)',
          padding: '3rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 2px 8px rgba(200,150,20,0.08)',
        }),
      }}
    >
      <input ref={inputRef} type="file" accept="*/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])} />

      {preview ? (
        <img src={preview} alt="Preview"
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '14px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #f5c842, #e8a320)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.25rem', boxShadow: '0 6px 20px rgba(232,163,32,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ color: '#5a3a06', fontWeight: '700', marginBottom: '0.25rem', fontSize: '1rem' }}>
              Drop your image here
            </p>
            <p style={{ color: '#8a6020', fontSize: '0.82rem' }}>
              or{' '}
              <span style={{ color: '#c98a10', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                browse files
              </span>
            </p>
          </div>
          <p style={{ color: '#b08030', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.25rem', fontWeight: '600' }}>
            JPG · PNG · WEBP
          </p>
        </div>
      )}
    </div>
  )
}