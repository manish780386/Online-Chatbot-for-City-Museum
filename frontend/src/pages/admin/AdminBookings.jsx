import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { bookingsAPI } from '../../services/api'
import toast from 'react-hot-toast'

const STATUS = {
  confirmed: { pill: 'bg-green-500/15 text-green-400 border border-green-500/20',    icon: CheckCircle, label: 'Confirmed' },
  pending:   { pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20', icon: Clock,       label: 'Pending'   },
  cancelled: { pill: 'bg-red-500/15 text-red-400 border border-red-500/20',          icon: XCircle,     label: 'Cancelled' },
  refunded:  { pill: 'bg-purple-500/15 text-purple-400 border border-purple-500/20', icon: RefreshCw,   label: 'Refunded'  },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = () => {
    setLoading(true)
    bookingsAPI.getMyAll()
      .then(res => {
        const data = res.data.results || res.data
        setBookings(data.map(b => ({
          ref:     b.booking_ref,
          name:    b.visitor_name,
          email:   b.visitor_email,
          phone:   b.visitor_phone,
          show:    b.show?.name    || '—',
          date:    b.show?.date    || '—',
          amount:  Number(b.total_amount),
          tickets: b.total_tickets,
          status:  b.status,
          time:    new Date(b.created_at).toLocaleString('en-IN'),
        })))
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }

  // ── Export Excel (CSV) ─────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filtered.length === 0) { toast.error('No bookings to export!'); return }

    const headers = [
      'Booking Ref', 'Visitor Name', 'Phone', 'Email',
      'Show', 'Date', 'Tickets', 'Amount (₹)', 'Status', 'Booked At'
    ]

    const rows = filtered.map(b => [
      b.ref,
      b.name,
      b.phone,
      b.email,
      b.show,
      b.date,
      b.tickets,
      b.amount,
      b.status,
      b.time,
    ])

    const escape = val =>
      typeof val === 'string' && (val.includes(',') || val.includes('"'))
        ? `"${val.replace(/"/g, '""')}"`
        : val

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escape).join(','))
    ].join('\n')

    // BOM — Excel mein Hindi/special chars sahi dikhenge
    const BOM     = '\uFEFF'
    const blob    = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const link    = document.createElement('a')
    const today   = new Date().toISOString().split('T')[0]
    link.href     = url
    link.download = `museum_bookings_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length} bookings exported! 📊`)
  }

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.ref?.toLowerCase().includes(search.toLowerCase())  ||
      b.show?.toLowerCase().includes(search.toLowerCase())
    )

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.amount, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h2 className="text-white font-black text-2xl">All Bookings</h2>
          <p className="text-dark-400 text-sm mt-1">{bookings.length} total bookings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchBookings}
            className="glass-light border border-white/10 text-dark-300 hover:text-white p-3 rounded-2xl transition-all">
            <RefreshCw size={16} />
          </button>
          {/* Export Excel */}
          <button onClick={handleExportExcel}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: bookings.length,                                       color: 'text-white'      },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-green-400'  },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-400'    },
          { label: 'Revenue',   value: `₹${totalRevenue}`,                                    color: 'text-brand-400'  },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-dark-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
          <input type="text" placeholder="Search by name, ref, or show..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-dark w-full pl-11 pr-4 py-3 rounded-2xl text-sm" />
        </div>
        <div className="flex glass rounded-2xl p-1 border border-white/5 gap-1">
          {['all','confirmed','pending','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all
                ${filter === f ? 'btn-primary text-white' : 'text-dark-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-bold">Bookings</h3>
          <span className="text-dark-400 text-sm">{filtered.length} results</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 shimmer-bg rounded-full w-24" />
                <div className="h-4 shimmer-bg rounded-full w-32" />
                <div className="h-4 shimmer-bg rounded-full w-28" />
                <div className="h-4 shimmer-bg rounded-full w-16" />
                <div className="h-6 shimmer-bg rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Ref', 'Visitor', 'Show', 'Date', 'Tickets', 'Amount', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-dark-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-dark-500 text-sm">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map(b => {
                    const s = STATUS[b.status] || STATUS.pending
                    return (
                      <tr key={b.ref} className="hover:bg-white/2 transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td className="px-6 py-4 font-mono text-brand-400 text-xs font-bold">{b.ref}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                              {b.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">{b.name}</p>
                              <p className="text-dark-500 text-xs">{b.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-dark-300 text-sm">{b.show}</td>
                        <td className="px-6 py-4 text-dark-400 text-xs">{b.date}</td>
                        <td className="px-6 py-4 text-white text-sm text-center">{b.tickets}</td>
                        <td className="px-6 py-4 text-white font-bold text-sm">₹{b.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit ${s.pill}`}>
                            <s.icon size={11} /> {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-dark-500 text-xs">{b.time}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}