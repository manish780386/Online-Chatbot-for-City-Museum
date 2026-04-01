import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Ticket, BookOpen, LogIn, LogOut, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

// ── Admin emails — AdminLayout se same rakhna ──────────────────────────────
const ADMIN_EMAILS = [
  'admin@museum.com',
  'mdangmuseum@gmail.com',   // ← Apna email daalo
  'superadmin@museum.com',
]

// ── Public nav links — Dashboard NAHI hai ─────────────────────────────────
const PUBLIC_LINKS = [
  { to: '/',            label: 'Home',      icon: null     },
  { to: '/my-bookings', label: 'Bookings',  icon: BookOpen },
]

export default function Navbar() {
  const [open, setOpen]      = useState(false)
  const { pathname }         = useLocation()
  const navigate             = useNavigate()
  const dispatch             = useDispatch()
  const { isLoggedIn, user } = useSelector(s => s.auth)

  // Check if current user is admin
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase())
    .includes(user?.email?.toLowerCase())

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Logged out successfully!')
    navigate('/')
  }

  // Nav links — admin ko extra link dikhao
  const navLinks = [
    ...PUBLIC_LINKS,
    ...(isLoggedIn && isAdmin
      ? [{ to: '/admin', label: 'Admin Panel', icon: null }]
      : []
    ),
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-xl border-b border-white/5" />

      <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center shadow-glow-sm">
            <Ticket size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-wide">CITY MUSEUM</p>
            <p className="text-dark-400 text-xs leading-tight">AI Ticketing</p>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${pathname === link.to || pathname.startsWith(link.to + '/') && link.to !== '/'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
            >
              {link.icon && <link.icon size={15} />}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Profile Link */}
              <Link
                to="/profile"
                className={`flex items-center gap-2 glass-light px-3 py-2 rounded-xl border transition-all hover:border-brand-500/30 ${
                  pathname === '/profile'
                    ? 'border-brand-500/30 bg-brand-500/10'
                    : 'border-white/8'
                }`}
              >
                <div className="w-7 h-7 btn-primary rounded-lg flex items-center justify-center text-white text-xs font-black">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-white text-sm font-medium">
                  {user?.full_name?.split(' ')[0] || 'User'}
                </span>
                <User size={13} className="text-dark-400" />
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="glass-light border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              <LogIn size={15} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-dark-300 hover:text-white transition-colors"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="relative md:hidden glass border-b border-white/5 px-6 py-4 flex flex-col gap-2 animate-fade-in">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all
                ${pathname === link.to
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
            >
              {link.icon && <link.icon size={16} />}
              {link.label}
            </Link>
          ))}

          {/* Mobile Profile + Logout */}
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  pathname === '/profile'
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User size={16} />
                My Profile
              </Link>
              <button
                onClick={() => { handleLogout(); setOpen(false) }}
                className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 text-brand-400 hover:bg-brand-500/10 transition-all"
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}