export default function DetailModal({ item, onClose }) {
  if (!item) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(80,50,0,0.45)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(255,253,235,0.97)',
        borderRadius: '20px', padding: '1.75rem',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 24px 60px rgba(140,100,10,0.25)',
        border: '1.5px solid rgba(220,180,50,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(130,90,10,0.5)' }}>
            {item.filename}
          </span>
          <button onClick={onClose} style={{
            background: 'rgba(160,110,20,0.1)', border: '1px solid rgba(200,155,30,0.3)',
            borderRadius: '100px', padding: '0.25rem 0.75rem',
            color: '#7a5210', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
          }}>✕ Close</button>
        </div>
        <img src={item.thumbnail} alt={item.filename} style={{
          width: '100%', borderRadius: '14px', marginBottom: '1rem',
          objectFit: 'cover', maxHeight: '320px',
        }} />
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.05rem', fontStyle: 'italic',
          color: '#4a3008', lineHeight: '1.6', margin: 0,
          padding: '0.85rem 1rem',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: '12px', border: '1px solid rgba(74,180,100,0.3)',
        }}>
          "{item.caption}"
        </p>
        <p style={{ textAlign: 'right', fontSize: '0.68rem', color: 'rgba(140,100,10,0.4)', marginTop: '0.6rem' }}>
          Generated at {item.time}
        </p>
      </div>
    </div>
  )
}