import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Ticket, Theater,
  IndianRupee, LogOut, RefreshCw
} from 'lucide-react'
import { logoutUser } from '../../redux/slices/authSlice'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/admin',          icon: LayoutDashboard, label: 'Overview'  },
  { path: '/admin/bookings', icon: Ticket,          label: 'Bookings'  },
  { path: '/admin/shows',    icon: Theater,         label: 'Shows'     },
  { path: '/admin/revenue',  icon: IndianRupee,     label: 'Revenue'   },
]

export default function AdminLayout() {
  const navigate             = useNavigate()
  const location             = useLocation()
  const dispatch             = useDispatch()
  const { isLoggedIn, user } = useSelector(s => s.auth)

  useEffect(() => {
    if (!isLoggedIn) navigate('/login')
  }, [isLoggedIn])

  const handleLogout = async () => {
    await dispatch(logoutUser())
    toast.success('Logged out!')
    navigate('/')
  }

  const currentLabel = NAV.find(n => n.path === location.pathname)?.label || 'Admin'

  return (
    <div className="min-h-screen bg-dark-950 flex">

      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{
          background:  'linear-gradient(180deg, #0f172a 0%, #0d1117 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center shadow-glow-sm">
              <Ticket size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">CITY MUSEUM</p>
              <p className="text-dark-500 text-xs">Admin Panel</p>
            </div>
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

        {/* User + Logout */}
        <div className="px-4 pb-6">
          <div className="glass rounded-2xl p-4 border border-white/5 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 btn-primary rounded-xl flex items-center justify-center font-black text-white text-sm">
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-white text-sm font-bold">
                  {user?.full_name?.split(' ')[0] || 'Admin'}
                </p>
                <p className="text-dark-500 text-xs">{user?.email || 'admin@museum.com'}</p>
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
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div
          className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between"
          style={{
            background:     'rgba(2,6,23,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom:   '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div>
            <h1 className="text-xl font-black text-white">{currentLabel}</h1>
            <p className="text-dark-500 text-xs">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-dark-400 text-sm">Live</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}