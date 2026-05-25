import { IconClock } from './Icons'

export default function HistoryPanel({ history, onClose, onSelect }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99,
      background: 'rgba(80,50,0,0.3)', backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top: 0, right: 0,
        height: '100vh', width: '360px',
        background: 'rgba(255,253,230,0.98)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1.5px solid rgba(220,180,50,0.3)',
        boxShadow: '-12px 0 40px rgba(140,100,10,0.15)',
        padding: '1.75rem 1.25rem',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '0.85rem',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <IconClock color="rgba(130,90,10,0.5)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(130,90,10,0.5)' }}>
              Recent — {history.length} / 5
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(160,110,20,0.1)', border: '1px solid rgba(200,155,30,0.3)',
            borderRadius: '100px', padding: '0.2rem 0.7rem',
            color: '#7a5210', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
          }}>✕</button>
        </div>

        {history.map((item, idx) => (
          <div key={item.id} onClick={() => onSelect(item)} style={{
            display: 'flex', alignItems: 'center', gap: '0.9rem',
            padding: '0.9rem 1rem', borderRadius: '14px', cursor: 'pointer',
            background: idx === 0 ? 'rgba(255,253,230,0.95)' : 'rgba(255,252,220,0.6)',
            border: `1.5px solid ${idx === 0 ? 'rgba(232,163,32,0.38)' : 'rgba(215,185,60,0.2)'}`,
            boxShadow: idx === 0 ? '0 4px 12px rgba(180,130,20,0.1)' : 'none',
            transition: 'all 0.2s',
          }}>
            <img src={item.thumbnail} alt={item.filename} style={{
              width: '54px', height: '54px', borderRadius: '10px',
              objectFit: 'cover', flexShrink: 0,
              border: '1.5px solid rgba(220,180,50,0.3)',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(120,84,10,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                  {item.filename}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(140,100,10,0.4)', flexShrink: 0 }}>
                  {item.time}
                </span>
              </div>
              <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '0.85rem', fontStyle: 'italic', color: '#5a3a06', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{item.caption}"
              </p>
            </div>
            {idx === 0 && (
              <div style={{ flexShrink: 0, alignSelf: 'flex-start', padding: '0.15rem 0.45rem', borderRadius: '100px', background: 'linear-gradient(135deg, #f5c842, #e8a320)', fontSize: '0.55rem', fontWeight: '800', color: '#5a3a06', textTransform: 'uppercase' }}>
                NEW
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}