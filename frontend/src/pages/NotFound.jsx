import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center relative overflow-hidden px-6">

      <div className="fixed inset-0 bg-hero-gradient opacity-60" />
      <div className="fixed inset-0 bg-glow-blue opacity-30" />
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* 404 Big Text */}
        <div className="relative mb-6">
          <p
            className="text-[10rem] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.1))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-6xl animate-float">🏛️</p>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-dark-400 text-base mb-10 leading-relaxed">
          Looks like this exhibit has been moved or doesn't exist.
          Let's get you back to the museum.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="glass-light border border-white/10 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}