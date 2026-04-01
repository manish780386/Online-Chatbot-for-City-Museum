import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, Ticket, IndianRupee, Edit2, Save, X } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { profileAPI, bookingsAPI } from '../services/api'
import { useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const [profile,  setProfile]  = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [newName,  setNewName]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const { isLoggedIn } = useSelector(s => s.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    fetchProfile()
    fetchBookings()
  }, [isLoggedIn])

  const fetchProfile = () => {
    profileAPI.get()
      .then(res => { setProfile(res.data); setNewName(res.data.full_name) })
      .catch(() => toast.error('Profile load nahi hua'))
      .finally(() => setLoading(false))
  }

  const fetchBookings = () => {
    bookingsAPI.getMyAll()
      .then(res => setBookings(res.data.results || res.data))
      .catch(() => {})
  }

  const handleSave = async () => {
    if (!newName.trim()) { toast.error('Name required hai!'); return }
    setSaving(true)
    try {
      await profileAPI.update({ full_name: newName })
      toast.success('Profile update ho gaya! ✅')
      setEditing(false)
      fetchProfile()
    } catch {
      toast.error('Update nahi hua')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const recentBookings = bookings.slice(0, 3)

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="fixed inset-0 bg-hero-gradient opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">Your Account</p>
          <h1 className="text-4xl font-black text-white">My Profile</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="lg:col-span-1">
            <div className="glass rounded-3xl border border-white/8 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 rounded-t-3xl" />

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6 mt-2">
                <div className="w-20 h-20 btn-primary rounded-full flex items-center justify-center text-white font-black text-3xl mb-3 shadow-glow-sm">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                {editing ? (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="input-dark w-full px-4 py-2.5 rounded-xl text-sm text-center"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)}
                        className="flex-1 glass-light border border-white/10 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1">
                        <X size={12} /> Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 btn-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60">
                        {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={12} /> Save</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-white font-black text-xl">{profile?.full_name}</h2>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-brand-400 text-xs font-semibold mt-1 hover:text-brand-300 transition-colors">
                      <Edit2 size={11} /> Edit Name
                    </button>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="space-y-3">
                {[
                  { icon: Mail,     label: 'Email',    value: profile?.email       },
                  { icon: Calendar, label: 'Joined',   value: profile?.date_joined },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 glass-light rounded-xl px-4 py-3 border border-white/5">
                    <item.icon size={14} className="text-brand-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-dark-500 text-xs">{item.label}</p>
                      <p className="text-white text-sm font-semibold truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats + Bookings */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Ticket,      label: 'Total Bookings',     value: profile?.total_bookings    || 0,  color: 'text-brand-400'  },
                  { icon: Ticket,      label: 'Confirmed',          value: profile?.confirmed_bookings || 0, color: 'text-green-400'  },
                  { icon: IndianRupee, label: 'Total Spent',        value: `₹${profile?.total_spent || 0}`, color: 'text-purple-400' },
                ].map((s, i) => (
                  <div key={i} className="glass rounded-2xl p-5 border border-white/5 text-center">
                    <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-dark-400 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Bookings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="glass rounded-3xl border border-white/8 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">Recent Bookings</h3>
                <Link to="/my-bookings" className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
                  View All →
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🎫</p>
                  <p className="text-dark-400 text-sm">No bookings yet</p>
                  <button onClick={() => navigate('/')}
                    className="btn-primary text-white text-xs font-bold px-5 py-2 rounded-xl mt-4">
                    Book a Show
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map(b => (
                    <Link key={b.booking_ref} to={`/ticket/${b.booking_ref}`}
                      className="flex items-center gap-4 glass-light rounded-2xl p-4 border border-white/5 hover:border-brand-500/20 transition-all group">
                      <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        🏛️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{b.show?.name}</p>
                        <p className="text-dark-500 text-xs">{b.show?.date} • {b.total_tickets} tickets</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-bold text-sm">₹{b.total_amount}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'confirmed' ? 'text-green-400 bg-green-500/10' :
                          b.status === 'cancelled' ? 'text-red-400 bg-red-500/10' :
                          'text-yellow-400 bg-yellow-500/10'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Feedback shortcut */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}>
              <button onClick={() => navigate('/#feedback')}
                className="w-full glass rounded-2xl border border-brand-500/20 p-4 text-left hover:border-brand-500/40 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center text-xl">⭐</div>
                  <div>
                    <p className="text-white font-bold text-sm">Give Feedback</p>
                    <p className="text-dark-400 text-xs">Share your museum experience</p>
                  </div>
                  <span className="ml-auto text-brand-400 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}