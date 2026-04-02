import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Ticket, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

// ── Admin credentials — yahan apna email aur password daalo ───────────────
const ADMIN_CREDENTIALS = [
  { email: 'admin335@gmail.com',   password: 'Admin@1234'  },
 
]

export default function AdminLogin() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email aur password dono required hain')
      return
    }

    setLoading(true)

    try {
      // ── Step 1: Check admin credentials locally ────────────────────
      const adminMatch = ADMIN_CREDENTIALS.find(
        a => a.email.toLowerCase() === email.toLowerCase() &&
             a.password === password
      )

      if (!adminMatch) {
        setError('Invalid admin email or password')
        setLoading(false)
        return
      }

      // ── Step 2: Backend se login karo JWT token lene ke liye ──────
      const res = await api.post('/auth/login/', {
        email:    email,
        password: password,
      })

      const { access, refresh } = res.data

      // ── Step 3: Admin token alag localStorage mein save karo ──────
      localStorage.setItem('adminToken',   access)
      localStorage.setItem('adminRefresh', refresh)
      localStorage.setItem('adminEmail',   email)
      localStorage.setItem('adminName',    res.data.user?.full_name || 'Admin')
      localStorage.setItem('isAdminLoggedIn', 'true')

      toast.success('Admin login successful! 🎉')
      navigate('/admin')

    } catch (err) {
      console.error('Admin login error:', err.response?.data)
      setError(err.response?.data?.error || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-glow-blue opacity-30" />
      <div
        className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full opacity-15 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full opacity-10 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', animationDelay: '2s' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-3xl border border-white/8 overflow-hidden shadow-card">
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 btn-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                <Ticket size={28} className="text-white" />
              </div>
              <h1 className="text-white font-black text-2xl mb-1">Admin Panel</h1>
              <p className="text-dark-400 text-sm">City Museum — Staff Only</p>
              <div className="inline-flex items-center gap-2 mt-3 glass-light px-4 py-1.5 rounded-full border border-brand-500/20">
                <ShieldCheck size={13} className="text-brand-400" />
                <span className="text-brand-400 text-xs font-semibold">Authorized Access Only</span>
              </div>
            </div>

            {/* Error Box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3 mb-5"
              >
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type="email"
                    placeholder="admin@museum.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    className="input-dark w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    className="input-dark w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Login to Admin Panel
                  </>
                )}
              </button>
            </form>

            {/* Back */}
            <div className="text-center mt-6">
              <a href="/" className="text-dark-500 hover:text-dark-300 text-xs transition-colors">
                ← Back to City Museum
              </a>
            </div>
          </div>
        </div>

        <p className="text-dark-600 text-xs text-center mt-4">
          🔒 Secure admin access • Unauthorized attempts are logged
        </p>
      </motion.div>
    </div>
  )
}