import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MessageBubble from './MessageBubble.jsx'
import QuickReplies from './QuickReplies.jsx'
import { showsAPI } from '../../services/api'

const WELCOME = {
  id: 1,
  text: 'Namaste! 🙏 Welcome to City Museum.\n\nI can help you:\n• 🎫 Book tickets\n• 🕐 Check show timings\n• 📋 View your booking\n• ❌ Cancel booking\n\nType or choose below!',
  sender: 'bot',
}

const getTodayMin = () => new Date().toISOString().split('T')[0]

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
}

const getDateFromText = (text) => {
  const t = text.toLowerCase()
  const today = new Date()
  if (t.includes('today')) return formatDateDisplay(today.toISOString().split('T')[0])
  if (t.includes('tomorrow')) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    return formatDateDisplay(d.toISOString().split('T')[0])
  }
  if (t.includes('weekend')) {
    const day = today.getDay()
    const diff = day === 0 ? 6 : 6 - day
    const d = new Date(today); d.setDate(d.getDate() + diff)
    return formatDateDisplay(d.toISOString().split('T')[0])
  }
  if (t.includes('next week')) {
    const d = new Date(today); d.setDate(d.getDate() + 7)
    return formatDateDisplay(d.toISOString().split('T')[0])
  }
  return text
}

export default function ChatWindow({ onClose }) {
  const [messages,       setMessages]       = useState([WELCOME])
  const [input,          setInput]          = useState('')
  const [isTyping,       setIsTyping]       = useState(false)
  const [quickReplies,   setQuickReplies]   = useState(['Book Tickets', 'Show Timings', 'My Booking'])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [liveShows,      setLiveShows]      = useState([])
  const bottomRef                           = useRef(null)
  const stepRef                             = useRef('idle')
  const bookingRef                          = useRef({})
  const navigate                            = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, showDatePicker])

  // Fetch real shows on mount
  useEffect(() => {
    showsAPI.getAll()
      .then(res => {
        const data = res.data.results || res.data
        setLiveShows(data || [])
      })
      .catch(() => {})
  }, [])

  const setStep = (val) => { stepRef.current = val }

  const addBot = (text, replies = [], showPicker = false) => {
    setIsTyping(false)
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot' }])
    setQuickReplies(replies)
    setShowDatePicker(showPicker)
  }

  // Build show quick replies from real data
  const getShowReplies = () => {
    if (liveShows.length > 0) {
      return liveShows.map(s => `${s.name} ₹${s.price_adult}`)
    }
    return [
      'General Entry ₹150',
      'Art Exhibition ₹200',
      'Night Show ₹350',
      'Dinosaur World ₹250',
    ]
  }

  // Build timings text from real data
  const getTimingsText = () => {
    if (liveShows.length > 0) {
      const lines = liveShows.map(s =>
        `${s.name} — ${s.start_time?.slice(0,5)}–${s.end_time?.slice(0,5)} — ₹${s.price_adult}`
      )
      return `🕐 Today's Shows:\n\n${lines.join('\n')}`
    }
    return (
      `🕐 Today's Timings:\n\n` +
      `🏺 General Entry  — 10AM–6PM  — ₹150\n` +
      `🎨 Art Exhibition — 11AM–7PM  — ₹200\n` +
      `🌙 Night Show     — 7PM–10PM  — ₹350\n` +
      `🦕 Dinosaur World — 9AM–5PM   — ₹250`
    )
  }

  const matchShow = (text) => {
    const t = text.toLowerCase()
    // Try to match from real shows first
    if (liveShows.length > 0) {
      const match = liveShows.find(s => t.includes(s.name.toLowerCase().split(' ')[0]))
      if (match) {
        return {
          category:    match.name,
          price:       Number(match.price_adult),
          categoryKey: match.category,
          showId:      match.id,
        }
      }
    }
    // Fallback
    if (t.includes('art') || t.includes('exhibition')) return { category: 'Art Exhibition', price: 200, categoryKey: 'exhibition' }
    if (t.includes('night') || t.includes('gala'))     return { category: 'Night Show',     price: 350, categoryKey: 'night_show' }
    if (t.includes('dinosaur') || t.includes('dino'))  return { category: 'Dinosaur World', price: 250, categoryKey: 'special'    }
    return { category: 'General Entry', price: 150, categoryKey: 'general' }
  }

  const handleFlow = (text) => {
    const t    = text.toLowerCase()
    const step = stepRef.current

    // ── idle ──────────────────────────────────────────────────────────
    if (step === 'idle') {
      if (t.includes('book') || t.includes('ticket') || t.includes('book a show')) {
        setStep('ask_category')
        addBot('Which show would you like? 🎭\n\nAvailable shows:', getShowReplies())
        return
      }
      if (t.includes('timing') || t.includes('time') || t.includes('show timings')) {
        addBot(getTimingsText(), ['Book a Show', 'Main Menu'])
        return
      }
      if (t.includes('my booking') || t.includes('status')) {
        addBot('Enter your Booking ID (e.g. BKG-20260323-00041)\nor visit My Bookings page.', [
          'Go to My Bookings', 'Main Menu',
        ])
        return
      }
      if (t.includes('go to my bookings')) { onClose(); navigate('/my-bookings'); return }
      if (t.includes('cancel')) {
        addBot('To cancel a booking:\n\n1. Go to My Bookings page\n2. Click Cancel button\n\nOr enter your Booking ID here:', [
          'Go to My Bookings', 'Main Menu'
        ])
        return
      }
      if (t.includes('menu') || t.includes('main') || t.includes('help')) {
        addBot('How can I help you? 😊', ['Book Tickets', 'Show Timings', 'My Booking', 'Cancel Booking'])
        return
      }
      if (t.includes('book a show')) {
        setStep('ask_category')
        addBot('Which show would you like? 🎭', getShowReplies())
        return
      }
      addBot("Sorry, I didn't get that. 😅\n\nI can help you with:", [
        'Book Tickets', 'Show Timings', 'My Booking',
      ])
      return
    }

    // ── ask_category ──────────────────────────────────────────────────
    if (step === 'ask_category') {
      const showInfo = matchShow(text)
      bookingRef.current = { ...showInfo }
      setStep('ask_date')
      addBot(
        `Great! ${showInfo.category} selected ✅\n💰 Price: ₹${showInfo.price} per ticket\n\nWhich date would you like to visit?\n📅 Pick from calendar or choose below:`,
        ['Today', 'Tomorrow', 'This Weekend', 'Next Week'],
        true
      )
      return
    }

    // ── ask_date ──────────────────────────────────────────────────────
    if (step === 'ask_date') {
      const dateDisplay = getDateFromText(text)
      bookingRef.current = { ...bookingRef.current, date: dateDisplay }
      setShowDatePicker(false)
      setStep('ask_qty')
      addBot(
        `📅 ${dateDisplay} selected!\n\nHow many tickets do you need?\n(Max 10 tickets per booking)`,
        ['1 Ticket', '2 Tickets', '3 Tickets', '4 Tickets', '5 Tickets']
      )
      return
    }

    // ── ask_qty ───────────────────────────────────────────────────────
    if (step === 'ask_qty') {
      const qty = parseInt(text) || 1
      if (qty < 1 || qty > 10) {
        addBot('⚠️ Please enter a number between 1 and 10 tickets.', [
          '1 Ticket', '2 Tickets', '3 Tickets', '4 Tickets'
        ])
        return
      }
      const price = bookingRef.current.price || 150
      const total = qty * price
      bookingRef.current = { ...bookingRef.current, qty, total }
      setStep('ask_name')
      addBot(
        `🎫 ${qty} ticket${qty > 1 ? 's' : ''} selected!\n` +
        `💰 Subtotal: ₹${total} (+ 5% GST)\n\nPlease enter your full name:`,
        []
      )
      return
    }

    // ── ask_name ──────────────────────────────────────────────────────
    if (step === 'ask_name') {
      const name = text.trim()
      if (name.length < 2) {
        addBot('⚠️ Please enter your full name (minimum 2 characters):', [])
        return
      }
      if (/\d/.test(name)) {
        addBot('⚠️ Name cannot contain numbers. Please enter your full name:', [])
        return
      }
      if (name.split(' ').length < 2) {
        addBot(`Hi ${name}! Please enter your full name (First + Last name):`, [])
        return
      }
      bookingRef.current = { ...bookingRef.current, name }
      setStep('ask_phone')
      addBot(`Got it, ${name.split(' ')[0]}! 👋\n\nEnter your 10-digit mobile number:`, [])
      return
    }

    // ── ask_phone ─────────────────────────────────────────────────────
    if (step === 'ask_phone') {
      const phone = text.replace(/[\s\-]/g, '').replace(/^(\+91|91)/, '')
      if (!/^[6-9]\d{9}$/.test(phone)) {
        addBot(
          '❌ Invalid mobile number!\n\nPlease enter a valid 10-digit Indian number\n(starting with 6, 7, 8, or 9):',
          []
        )
        return
      }
      bookingRef.current = { ...bookingRef.current, phone }
      setStep('ask_email')
      addBot(
        `📱 Perfect!\n\nEnter your email for ticket confirmation:\n(Optional — press Skip to continue)`,
        ['Skip Email']
      )
      return
    }

    // ── ask_email (OPTIONAL) ──────────────────────────────────────────
    if (step === 'ask_email') {
      let email = 'guest@museum.com'

      if (t !== 'skip email' && t !== 'skip') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(text)) {
          addBot(
            '❌ Invalid email!\n\nEnter a valid email (e.g. name@gmail.com)\nor skip:',
            ['Skip Email']
          )
          return
        }
        email = text.trim()
      }

      bookingRef.current = { ...bookingRef.current, email }
      const d = bookingRef.current
      const tax = Math.round(d.total * 0.05)
      const grandTotal = d.total + tax

      setStep('confirm')
      addBot(
        `📋 Booking Summary:\n\n` +
        `🎭 Show    : ${d.category}\n` +
        `📅 Date    : ${d.date}\n` +
        `🎫 Tickets : ${d.qty}\n` +
        `👤 Name    : ${d.name}\n` +
        `📱 Phone   : ${d.phone}\n` +
        `📧 Email   : ${email === 'guest@museum.com' ? 'Not provided' : email}\n\n` +
        `💰 Subtotal : ₹${d.total}\n` +
        `🧾 GST (5%) : ₹${tax}\n` +
        `💵 Total    : ₹${grandTotal}\n\n` +
        `Confirm booking?`,
        ['✅ Yes, Confirm!', '❌ Cancel', '✏️ Edit Details']
      )
      return
    }

    // ── confirm ───────────────────────────────────────────────────────
    if (step === 'confirm') {
      if (t.includes('edit')) {
        setStep('ask_name')
        bookingRef.current = { ...bookingRef.current }
        addBot('No problem! Let\'s update your details.\n\nEnter your full name:', [])
        return
      }

      if (t.includes('yes') || t.includes('confirm')) {
        const d = bookingRef.current

        localStorage.setItem('pendingBooking', JSON.stringify({
          category:      d.category,
          categoryKey:   d.categoryKey,
          showId:        d.showId || null,
          date:          d.date,
          qty:           d.qty,
          total:         d.total,
          visitor_name:  d.name,
          visitor_phone: d.phone,
          visitor_email: d.email || 'guest@museum.com',
        }))

        setStep('idle')
        bookingRef.current = {}
        setShowDatePicker(false)
        addBot('🎉 Redirecting to payment page...', [])
        setTimeout(() => { onClose(); navigate('/booking/summary') }, 1200)
      } else {
        setStep('idle')
        bookingRef.current = {}
        setShowDatePicker(false)
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

  const handleCalendarDate = (dateStr) => {
    const display = formatDateDisplay(dateStr)
    setShowDatePicker(false)
    setMessages(prev => [...prev, { id: Date.now(), text: display, sender: 'user' }])
    setQuickReplies([])
    setIsTyping(true)
    bookingRef.current = { ...bookingRef.current, date: display }
    setStep('ask_qty')
    setTimeout(() => {
      addBot(
        `📅 ${display} selected!\n\nHow many tickets do you need?`,
        ['1 Ticket', '2 Tickets', '3 Tickets', '4 Tickets', '5 Tickets']
      )
    }, 900)
  }

  return (
    <div
      className="absolute bottom-20 right-0 flex flex-col overflow-hidden animate-fade-in"
      style={{
        width: '340px', height: '580px',
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(255,255,255,0.15)' }}>🏛️</div>
            <div>
              <p className="text-white font-bold text-sm">Museum Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <p className="text-purple-200 text-xs">Online • AI Powered</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors text-lg">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ background: '#0f172a' }}>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)' }}>🏛️</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1 items-center">
                {[0,150,300].map(d => (
                  <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#818cf8', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Picker */}
        {showDatePicker && (
          <div className="mx-1 mt-2">
            <div className="rounded-2xl p-3 border"
              style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)' }}>
              <p className="text-purple-300 text-xs font-semibold mb-2 text-center">📅 Select Visit Date</p>
              <input
                type="date"
                min={getTodayMin()}
                onChange={e => e.target.value && handleCalendarDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.3)', colorScheme: 'dark' }}
              />
              <p className="text-dark-500 text-xs text-center mt-2">Or choose quick option below ↓</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {quickReplies.length > 0 && <QuickReplies replies={quickReplies} onSelect={sendMessage} />}

      {/* Input */}
      <div className="px-3 py-3 flex gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0f172a' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type a message..."
          className="flex-1 text-sm rounded-full px-4 py-2.5 outline-none text-white placeholder-slate-600"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-white disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >➤</button>
      </div>
    </div>
  )
}