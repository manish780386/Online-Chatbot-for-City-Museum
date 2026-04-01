import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Theater,
  IndianRupee, LogOut, Menu, X
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/admin',          icon: LayoutDashboard, label: 'Overview'  },
  { path: '/admin/bookings', icon: Ticket,          label: 'Bookings'  },
  { path: '/admin/shows',    icon: Theater,         label: 'Shows'     },
  { path: '/admin/revenue',  icon: IndianRupee,     label: 'Revenue'   },
]

// ── Admin auth helpers ─────────────────────────────────────────────────────
const getAdminToken = ()     => localStorage.getItem('adminToken')
const getAdminEmail = ()     => localStorage.getItem('adminEmail') || 'admin@museum.com'
const getAdminName  = ()     => localStorage.getItem('adminName')  || 'Admin'
const isAdminLoggedIn = ()   => localStorage.getItem('isAdminLoggedIn') === 'true'

const clearAdminSession = () => {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminRefresh')
  localStorage.removeItem('adminEmail')
  localStorage.removeItem('adminName')
  localStorage.removeItem('isAdminLoggedIn')
}

export default function AdminLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminName,   setAdminName]   = useState('')
  const [adminEmail,  setAdminEmail]  = useState('')

  useEffect(() => {
    // ── Check admin session ────────────────────────────────────────────
    if (!isAdminLoggedIn() || !getAdminToken()) {
      navigate('/admin/login')
      return
    }
    setAdminName(getAdminName())
    setAdminEmail(getAdminEmail())
  }, [])

  const handleLogout = () => {
    clearAdminSession()
    toast.success('Admin logged out!')
    navigate('/admin/login')
  }

  const currentLabel = NAV.find(n => n.path === location.pathname)?.label || 'Admin'

  // ── Not authenticated ──────────────────────────────────────────────────
  if (!isAdminLoggedIn()) return null

  // ── Sidebar Content ────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center shadow-glow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">CITY MUSEUM</p>
              <p className="text-dark-500 text-xs">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${active
                  ? 'btn-primary text-white shadow-button'
                  : 'text-dark-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Admin Info + Logout */}
      <div className="px-4 pb-6">
        <div className="glass rounded-2xl p-4 border border-brand-500/20 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
              Admin Access
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 btn-primary rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0">
              {adminName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">
                {adminName?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-dark-500 text-xs truncate">{adminEmail}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-dark-950 flex">

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-64 flex-shrink-0 flex-col"
        style={{
          background:  'linear-gradient(180deg, #0f172a 0%, #0d1117 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col lg:hidden"
        style={{
          background:  'linear-gradient(180deg, #0f172a 0%, #0d1117 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow:   '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">

        {/* Top Bar */}
        <div
          className="sticky top-0 z-20 px-4 lg:px-8 py-4 flex items-center justify-between gap-4"
          style={{
            background:     'rgba(2,6,23,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom:   '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-dark-400 hover:text-white transition-colors p-1"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-white">{currentLabel}</h1>
              <p className="text-dark-500 text-xs hidden sm:block">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-dark-400 text-sm hidden sm:block">Live</span>
            <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center font-black text-white text-xs lg:hidden">
              {adminName?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-4 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}