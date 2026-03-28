import { useState } from 'react'
import ChatWindow from './ChatWindow.jsx'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      {/* Notification dot */}
      {!isOpen && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-10 animate-pulse">
          <span className="text-white text-xs font-black">1</span>
        </div>
      )}

      <button
        id="chatbot-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl text-2xl transition-all duration-300 text-white"
        style={{
          background: isOpen
            ? '#1e293b'
            : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  )
}