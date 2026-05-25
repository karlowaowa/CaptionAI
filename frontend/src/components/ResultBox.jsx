import { IconCopy, IconCheck, IconDownload } from './Icons'

export default function ResultBox({ status, caption, copied, onCopy, onDownload }) {
  return (
    <div style={{
      borderRadius: '16px', padding: '1rem 1.25rem',
      transition: 'all 0.4s ease', border: '1.5px solid',
      background: status === 'success' ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
        : status === 'blurry'  ? 'linear-gradient(135deg, #fff7ed, #ffedd5)'
        : status === 'error'   ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)'
        : status === 'loading' ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
        : 'linear-gradient(135deg, #f5f0e8, #ede8d8)',
      borderColor: status === 'success' ? 'rgba(74,180,100,0.4)'
        : status === 'blurry'  ? 'rgba(230,140,30,0.4)'
        : status === 'error'   ? 'rgba(220,60,60,0.35)'
        : status === 'loading' ? 'rgba(217,165,32,0.4)'
        : 'rgba(180,145,80,0.3)',
    }}>
      {/* Status dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: caption ? '0.75rem' : '0' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
          background: status === 'success' ? '#4caf50' : status === 'blurry' ? '#f08c00'
            : status === 'error' ? '#e53935' : status === 'loading' ? '#e8a320' : 'rgba(160,110,20,0.15)',
          boxShadow: status === 'loading' ? '0 0 8px rgba(232,163,32,0.8)' : 'none',
          animation: status === 'loading' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: status === 'success' ? '#166534' : status === 'blurry' ? '#9a4e00'
            : status === 'error' ? '#b91c1c' : status === 'loading' ? '#92600a' : 'rgba(120,84,10,0.35)',
        }}>
          {status === 'idle' ? 'Awaiting image' : status === 'loading' ? 'Analyzing image…'
            : status === 'success' ? 'Caption ready' : status === 'blurry' ? 'Attention' : 'Error'}
        </span>
      </div>

      {caption && (
        <p style={{
          margin: 0, lineHeight: '1.6',
          ...(status === 'success' ? { fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontStyle: 'italic', color: '#4a3008' }
            : status === 'blurry' ? { fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontStyle: 'italic', color: '#c07000' }
            : { fontSize: '0.875rem', color: '#c03030' }),
        }}>
          {(status === 'success' || status === 'blurry') ? `"${caption}"` : caption}
        </p>
      )}

      {status === 'success' && caption && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(74,180,100,0.2)' }}>
          <button onClick={onCopy} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.35rem 0.8rem', borderRadius: '100px',
            background: copied ? 'rgba(74,180,100,0.18)' : 'rgba(74,180,100,0.08)',
            border: `1px solid ${copied ? 'rgba(74,180,100,0.5)' : 'rgba(74,180,100,0.25)'}`,
            color: copied ? '#166534' : '#2d6a4f',
            fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? <IconCheck /> : <IconCopy />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button onClick={onDownload} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.35rem 0.8rem', borderRadius: '100px',
            background: 'rgba(232,163,32,0.08)', border: '1px solid rgba(232,163,32,0.28)',
            color: '#7a5210', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <IconDownload />
            <span>Download .txt</span>
          </button>
        </div>
      )}

      {status === 'loading' && !caption && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[80, 60, 40].map((w, i) => (
            <div key={i} style={{
              height: '10px', borderRadius: '6px', width: `${w}%`,
              background: 'linear-gradient(90deg, rgba(232,163,32,0.1) 25%, rgba(232,163,32,0.3) 50%, rgba(232,163,32,0.1) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}