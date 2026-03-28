import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MessageBubble from './MessageBubble.jsx'
import QuickReplies from './QuickReplies.jsx'

const WELCOME = {
  id: 1,
  text: 'Namaste! 🙏 Welcome to City Museum.\n\nI can help you:\n• Book tickets\n• Check show timings\n• View your booking\n\nType or choose below!',
  sender: 'bot',
}

export default function ChatWindow({ onClose }) {
  const [messages,     setMessages]     = useState([WELCOME])
  const [input,        setInput]        = useState('')
  const [isTyping,     setIsTyping]     = useState(false)
  const [quickReplies, setQuickReplies] = useState(['Book Tickets', 'Show Timings', 'My Booking'])
  const [bookingData,  setBookingData]  = useState({})
  const bottomRef                       = useRef(null)
  const stepRef                         = useRef('idle')
  const bookingRef                      = useRef({})
  const navigate                        = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const setStep = (val) => { stepRef.current = val }

  const addBot = (text, replies = []) => {
    setIsTyping(false)
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot' }])
    setQuickReplies(replies)
  }

  const handleFlow = (text) => {
    const t    = text.toLowerCase()
    const step = stepRef.current

    // ── idle ──────────────────────────────────────────────────────────
    if (step === 'idle') {
      if (t.includes('book') || t.includes('ticket') || t.includes('book tickets')) {
        setStep('ask_category')
        addBot('Which show would you like? 🎭', [
          'General Entry ₹150',
          'Art Exhibition ₹200',
          'Night Show ₹350',
          'Dinosaur World ₹250',
        ])
        return
      }
      if (t.includes('timing') || t.includes('time') || t.includes('show timings')) {
        addBot(
          `🕐 Today's Timings:\n\n` +
          `🏺 General Entry  — 10AM–6PM  — ₹150\n` +
          `🎨 Art Exhibition — 11AM–7PM  — ₹200\n` +
          `🌙 Night Show     — 7PM–10PM  — ₹350\n` +
          `🦕 Dinosaur World — 9AM–5PM   — ₹250`,
          ['Book a Show', 'Main Menu']
        )
        return
      }
      if (t.includes('my booking') || t.includes('status') || t.includes('booking')) {
        addBot('Enter your Booking ID (e.g. BKG-20250322-00041)\nor visit My Bookings page.', [
          'Go to My Bookings', 'Main Menu',
        ])
        return
      }
      if (t.includes('go to my bookings')) {
        onClose()
        navigate('/my-bookings')
        return
      }
      if (t.includes('menu') || t.includes('main') || t.includes('main menu') || t.includes('help')) {
        addBot('How can I help you? 😊', ['Book Tickets', 'Show Timings', 'My Booking'])
        return
      }
      if (t.includes('book a show')) {
        setStep('ask_category')
        addBot('Which show would you like? 🎭', [
          'General Entry ₹150',
          'Art Exhibition ₹200',
          'Night Show ₹350',
          'Dinosaur World ₹250',
        ])
        return
      }
      addBot("Sorry, I didn't get that. 😅\n\nI can help you with:", [
        'Book Tickets', 'Show Timings', 'My Booking',
      ])
      return
    }

    // ── ask_category ──────────────────────────────────────────────────
    if (step === 'ask_category') {
      let category    = 'General Entry'
      let price       = 150
      let categoryKey = 'general'

      if (t.includes('art') || t.includes('exhibition')) {
        category = 'Art Exhibition'; price = 200; categoryKey = 'exhibition'
      }
      if (t.includes('night') || t.includes('gala')) {
        category = 'Night Show'; price = 350; categoryKey = 'night_show'
      }
      if (t.includes('dinosaur') || t.includes('dino')) {
        category = 'Dinosaur World'; price = 250; categoryKey = 'special'
      }

      // useRef mein bhi save karo — async issue avoid karne ke liye
      bookingRef.current = { category, price, categoryKey }
      setBookingData({ category, price, categoryKey })
      setStep('ask_date')
      addBot(
        `Great! ${category} selected ✅\n\nWhich date would you like to visit?`,
        ['Today', 'Tomorrow', 'This Weekend', 'Next Week']
      )
      return
    }

    // ── ask_date ──────────────────────────────────────────────────────
    if (step === 'ask_date') {
      bookingRef.current = { ...bookingRef.current, date: text }
      setBookingData(prev => ({ ...prev, date: text }))
      setStep('ask_qty')
      addBot('How many tickets do you need?', [
        '1 Ticket', '2 Tickets', '3 Tickets', '4 Tickets',
      ])
      return
    }

    // ── ask_qty ───────────────────────────────────────────────────────
    if (step === 'ask_qty') {
      const qty   = parseInt(text) || 1
      const price = bookingRef.current.price || 150
      const total = qty * price

      bookingRef.current = { ...bookingRef.current, qty, total }
      setBookingData(prev => ({ ...prev, qty, total }))
      setStep('ask_name')
      addBot(
        `${qty} ticket${qty > 1 ? 's' : ''} selected.\nTotal: ₹${total} 💰\n\nPlease enter your full name:`,
        []
      )
      return
    }

    // ── ask_name ──────────────────────────────────────────────────────
    if (step === 'ask_name') {
      bookingRef.current = { ...bookingRef.current, name: text }
      setBookingData(prev => ({ ...prev, name: text }))
      setStep('ask_phone')
      addBot(`Got it, ${text}! 👋\n\nEnter your mobile number:`, [])
      return
    }

    // ── ask_phone ─────────────────────────────────────────────────────
    if (step === 'ask_phone') {
      bookingRef.current = { ...bookingRef.current, phone: text }
      const d = bookingRef.current

      setStep('confirm')
      addBot(
        `📋 Booking Summary:\n\n` +
        `🎭 Show    : ${d.category}\n` +
        `📅 Date    : ${d.date}\n` +
        `🎫 Tickets : ${d.qty}\n` +
        `👤 Name    : ${d.name}\n` +
        `📱 Phone   : ${text}\n` +
        `💰 Total   : ₹${d.total}\n\n` +
        `Confirm booking?`,
        ['Yes, Confirm! ✅', 'Cancel ❌']
      )
      return
    }

    // ── confirm ───────────────────────────────────────────────────────
    if (step === 'confirm') {
      if (t.includes('yes') || t.includes('confirm')) {
        const d = bookingRef.current

        // localStorage mein save karo — BookingSummary page use karega
        localStorage.setItem('pendingBooking', JSON.stringify({
          category:      d.category,
          categoryKey:   d.categoryKey,
          date:          d.date,
          qty:           d.qty,
          total:         d.total,
          visitor_name:  d.name,
          visitor_phone: d.phone,
          visitor_email: 'guest@museum.com',
        }))

        setStep('idle')
        bookingRef.current = {}
        setBookingData({})

        addBot('🎉 Great! Redirecting to payment page...', [])
        setTimeout(() => {
          onClose()
          navigate('/booking/summary')
        }, 1200)

      } else {
        setStep('idle')
        bookingRef.current = {}
        setBookingData({})
        addBot('Booking cancelled. No worries! 😊\n\nHow can I help you?', [
          'Book Tickets', 'Show Timings',
        ])
      }
      return
    }
  }

  const sendMessage = (text) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }])
    setInput('')
    setQuickReplies([])
    setIsTyping(true)
    setTimeout(() => handleFlow(text), 900)
  }

  return (
    <div
      className="absolute bottom-20 right-0 flex flex-col overflow-hidden animate-fade-in"
      style={{
        width: '340px',
        height: '520px',
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)',
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '14px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              🏛️
            </div>
            <div>
              <p className="text-white font-bold text-sm">Museum Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <p className="text-purple-200 text-xs">Online • AI Powered</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ background: '#0f172a' }}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)' }}
            >
              🏛️
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#818cf8', animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <QuickReplies replies={quickReplies} onSelect={sendMessage} />
      )}

      {/* Input */}
      <div
        className="px-3 py-3 flex gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0f172a' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type a message..."
          className="flex-1 text-sm rounded-full px-4 py-2.5 outline-none text-white placeholder-slate-600"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-white disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}