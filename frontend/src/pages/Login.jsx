import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Ticket } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, registerUser, clearError } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

export default function Login() {
  const [isLogin, setIsLogin]   = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]         = useState({ email: '', password: '', full_name: '', phone: '', password2: '' })

  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { loading, error, isLoggedIn } = useSelector(s => s.auth)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    if (isLoggedIn) navigate('/')
  }, [isLoggedIn])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error])

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (isLogin) {
    const res = await dispatch(loginUser({
      email:    form.email,
      password: form.password
    }))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back! 👋')
      navigate('/')
    }
  } else {
    // password2 add karo
    const registerData = {
      email:     form.email,
      full_name: form.full_name,
      phone:     form.phone,
      password:  form.password,
      password2: form.password,  // ← yeh missing tha
    }

    console.log('Sending:', registerData) // debug ke liye

    const res = await dispatch(registerUser(registerData))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Account created! 🎉')
      navigate('/')
    }
  }
}
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-glow-blue opacity-40" />
      <div
        className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl border border-white/8 overflow-hidden shadow-card">
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />

          <div className="p-8">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 btn-primary rounded-2xl flex items-center justify-center shadow-glow-sm">
                  <Ticket size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-black text-lg leading-tight">CITY MUSEUM</p>
                  <p className="text-dark-400 text-xs">AI Ticketing System</p>
                </div>
              </Link>
              <h1 className="text-2xl font-black text-white mb-1">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-dark-400 text-sm">
                {isLogin ? 'Login to view your bookings' : 'Register to track your tickets'}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-dark-900 rounded-2xl p-1 mb-8 border border-white/5">
              {['Login', 'Register'].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${(isLogin ? i === 0 : i === 1)
                      ? 'btn-primary text-white shadow-button'
                      : 'text-dark-400 hover:text-dark-200'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      type="text"
                      placeholder="Ravi Sharma"
                      value={form.full_name}
                      onChange={e => set('full_name', e.target.value)}
                      className="input-dark w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type="email"
                    placeholder="ravi@example.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className="input-dark w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      className="input-dark w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-dark-300 text-xs font-semibold mb-2 block uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="input-dark w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm"
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : (
                  <>
                    {isLogin ? 'Login' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-dark-500 text-sm mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}