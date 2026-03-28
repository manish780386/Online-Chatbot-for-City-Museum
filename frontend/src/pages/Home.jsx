import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Star, Users, Zap, ChevronDown, Ticket } from 'lucide-react'
import Navbar from '../components/common/Navbar.jsx'
import ChatbotWidget from '../components/chatbot/ChatbotWidget.jsx'
import { showsAPI } from '../services/api'

// Fallback data — backend nahi chale toh yeh use hoga
const STATIC_SHOWS = [
  {
    id: 1, emoji: '🏺', title: 'Ancient India',
    category: 'General Entry', price: 150,
    timing: '10:00 AM – 6:00 PM', seats: 120,
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.15)',
    tag: 'Most Popular', tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 2, emoji: '🎨', title: 'Modern Art',
    category: 'Exhibition', price: 200,
    timing: '11:00 AM – 7:00 PM', seats: 80,
    gradient: 'from-purple-500/20 to-pink-500/10',
    border: 'border-purple-500/20', glow: 'rgba(139,92,246,0.15)',
    tag: 'New', tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 3, emoji: '🌙', title: 'Night Gala',
    category: 'Night Show', price: 350,
    timing: '7:00 PM – 10:00 PM', seats: 50,
    gradient: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/20', glow: 'rgba(99,102,241,0.15)',
    tag: 'Premium', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 4, emoji: '🦕', title: 'Dinosaur World',
    category: 'Special Show', price: 250,
    timing: '9:00 AM – 5:00 PM', seats: 100,
    gradient: 'from-green-500/20 to-teal-500/10',
    border: 'border-green-500/20', glow: 'rgba(16,185,129,0.15)',
    tag: 'Kids Fav', tagColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
]

// Backend data ko STATIC_SHOWS format mein convert karo
const formatShow = (show, i) => {
  const styles = STATIC_SHOWS[i % 4]
  return {
    id:       show.id,
    emoji:    styles.emoji,
    title:    show.name,
    category: show.get_category_display || show.category,
    price:    Number(show.price_adult),
    timing:   `${show.start_time?.slice(0,5)} – ${show.end_time?.slice(0,5)}`,
    seats:    show.available_seats,
    gradient: styles.gradient,
    border:   styles.border,
    glow:     styles.glow,
    tag:      styles.tag,
    tagColor: styles.tagColor,
  }
}

const STATS = [
  { value: '50K+',   label: 'Monthly Visitors', icon: Users },
  { value: '4.9★',   label: 'Average Rating',   icon: Star  },
  { value: '< 2min', label: 'Booking Time',      icon: Zap   },
  { value: '24/7',   label: 'Always Open',       icon: Clock },
]

const STEPS = [
  { n: '01', icon: '💬', title: 'Open Chatbot',  desc: 'Click the floating chat button on the bottom right.' },
  { n: '02', icon: '🎫', title: 'Choose Show',   desc: 'Tell the bot which show, date, and how many tickets.' },
  { n: '03', icon: '💳', title: 'Pay Securely',  desc: 'Pay via UPI, card or netbanking — powered by Razorpay.' },
  { n: '04', icon: '📱', title: 'Get QR Ticket', desc: 'Instant QR ticket on your email and phone.' },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

export default function Home() {
  const [hovered,      setHovered]      = useState(null)
  const [shows,        setShows]        = useState(STATIC_SHOWS)
  const [loadingShows, setLoadingShows] = useState(true)

  useEffect(() => {
    showsAPI.getAll()
      .then(res => {
        const data = res.data.results || res.data
        if (data?.length > 0) {
          setShows(data.map(formatShow))
        }
      })
      .catch(() => {
        // Backend nahi chala — static data use hoga
        setShows(STATIC_SHOWS)
      })
      .finally(() => setLoadingShows(false))
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-glow-blue opacity-60" />
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', animationDelay: '3s' }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24"
          initial="hidden" animate="visible" variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 glass-light text-brand-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-brand-500/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              AI-Powered Ticketing System
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-white">Explore History,</span>
            <br />
            <span className="text-gradient">Book Instantly.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-dark-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Skip the queues forever. Our AI chatbot books your museum tickets
            in under 2 minutes — available 24/7 in Hindi &amp; English.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('shows')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-base"
            >
              Explore Shows <ArrowRight size={18} />
            </button>
            <button
              onClick={() => document.getElementById('chatbot-btn')?.click()}
              className="glass-light text-white font-semibold px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-base flex items-center justify-center gap-2"
            >
              Book via Chatbot 💬
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {STATS.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-4 border border-white/5">
                <s.icon size={20} className="text-brand-400 mx-auto mb-2" />
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-dark-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-dark-500" />
        </div>
      </section>

      {/* ── SHOWS ── */}
      <section id="shows" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }} variants={stagger}
          className="text-center mb-14"
        >
          <motion.p variants={fadeUp} className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Current Shows
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-4">
            Choose Your Experience
          </motion.h2>
          <motion.p variants={fadeUp} className="text-dark-400 text-lg max-w-xl mx-auto">
            Unique exhibitions. Book through chatbot in minutes.
          </motion.p>
        </motion.div>

        {/* Shows Grid */}
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {loadingShows
            ? [1,2,3,4].map(i => (
                <div key={i} className="glass rounded-3xl p-6 border border-white/5 animate-pulse">
                  <div className="w-12 h-12 shimmer-bg rounded-2xl mb-5" />
                  <div className="h-3 shimmer-bg rounded-full w-1/3 mb-2" />
                  <div className="h-5 shimmer-bg rounded-full w-2/3 mb-2" />
                  <div className="h-3 shimmer-bg rounded-full w-1/2 mb-6" />
                  <div className="h-10 shimmer-bg rounded-xl" />
                </div>
              ))
            : shows.map(show => (
                <motion.div
                  key={show.id}
                  variants={fadeUp}
                  onMouseEnter={() => setHovered(show.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative glass rounded-3xl p-6 border ${show.border} cursor-pointer transition-all duration-500
                    ${hovered === show.id ? 'scale-105 shadow-card' : 'scale-100'}`}
                  style={{
                    background: hovered === show.id
                      ? `linear-gradient(145deg, ${show.glow}, rgba(255,255,255,0.02))`
                      : undefined,
                  }}
                >
                  <span className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full border ${show.tagColor}`}>
                    {show.tag}
                  </span>

                  <div className="text-5xl mb-5 animate-float" style={{ animationDelay: `${show.id * 0.5}s` }}>
                    {show.emoji}
                  </div>

                  <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    {show.category}
                  </p>
                  <h3 className="text-white font-bold text-xl mb-1">{show.title}</h3>
                  <p className="text-dark-500 text-xs mb-5 flex items-center gap-1">
                    <Clock size={11} /> {show.timing}
                  </p>

                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="text-3xl font-black text-white">₹{show.price}</p>
                      <p className="text-dark-500 text-xs">per ticket</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-bold">{show.seats}</p>
                      <p className="text-dark-500 text-xs">seats left</p>
                    </div>
                  </div>

                  <button
                    onClick={() => document.getElementById('chatbot-btn')?.click()}
                    className="w-full btn-primary text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    Book Now <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))
          }
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-dark-900/50" />
        <div className="absolute inset-0 bg-glow-purple opacity-30" />

        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }} variants={stagger}
          className="relative max-w-7xl mx-auto px-6"
        >
          <div className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Simple Process
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white">
              How It Works
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-brand-600/50 to-transparent" />
                )}
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-3xl mx-auto border border-white/10 shadow-glow-sm">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 btn-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-button">
                    {s.n}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 btn-primary rounded-xl flex items-center justify-center">
              <Ticket size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">City Museum</p>
              <p className="text-dark-500 text-xs">AI-Powered Ticketing</p>
            </div>
          </div>
          <p className="text-dark-500 text-sm">
            © 2025 City Museum • Built with React + Django + Dialogflow
          </p>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  )
}