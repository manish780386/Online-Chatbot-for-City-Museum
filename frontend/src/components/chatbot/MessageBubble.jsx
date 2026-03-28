export default function MessageBubble({ message }) {
  const isBot = message.sender === 'bot'

  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1"
          style={{ background: 'rgba(99,102,241,0.2)' }}
        >
          🏛️
        </div>
      )}
      <div
        className="max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={isBot ? {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottomLeftRadius: '4px',
          color: '#cbd5e1',
        } : {
          background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
          borderBottomRightRadius: '4px',
          color: 'white',
        }}
      >
        {message.text.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < message.text.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}