function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ImageInfoPanel({ imageInfo }) {
  if (!imageInfo) return null
  const items = [
    { label: 'File', value: imageInfo.name.length > 16 ? imageInfo.name.slice(0, 14) + '…' : imageInfo.name },
    { label: 'Size', value: formatBytes(imageInfo.size) },
    { label: 'Dimensions', value: imageInfo.width ? `${imageInfo.width} × ${imageInfo.height}` : '—' },
  ]
  return (
    <div style={{
      margin: '0.55rem 0 1.25rem', padding: '0.65rem 1rem',
      borderRadius: '12px', background: 'rgba(255,250,215,0.75)',
      border: '1px solid rgba(215,175,45,0.28)',
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      justifyItems: 'center', width: '100%',
    }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', textAlign: 'center' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(140,100,10,0.5)' }}>
            {label}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#5a3a06', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}