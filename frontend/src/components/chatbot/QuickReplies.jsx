export default function QuickReplies({ replies, onSelect }) {
  return (
    <div
      className="px-3 py-2 flex flex-wrap gap-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0f172a' }}
    >
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(99,102,241,0.3)'
            e.target.style.color = 'white'
          }}
          onMouseLeave={e => {
            e.target.style.background = 'rgba(99,102,241,0.15)'
            e.target.style.color = '#a5b4fc'
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  )
}