import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ticket, Calendar, Users, IndianRupee, Eye, X, Search, Download } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { bookingsAPI } from '../services/api'
import { BookingRowSkeleton } from '../components/common/Skeleton'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const STATUS_STYLE = {
  confirmed: { pill: 'bg-green-500/15 text-green-400 border border-green-500/30',    dot: 'bg-green-400',  label: 'Confirmed' },
  cancelled: { pill: 'bg-red-500/15 text-red-400 border border-red-500/30',          dot: 'bg-red-400',    label: 'Cancelled' },
  pending:   { pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-400', label: 'Pending'   },
  refunded:  { pill: 'bg-purple-500/15 text-purple-400 border border-purple-500/30', dot: 'bg-purple-400', label: 'Refunded'  },
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const { isLoggedIn }          = useSelector(s => s.auth)
  const navigate                = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    fetchBookings()
  }, [isLoggedIn])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await bookingsAPI.getMyAll()
      setBookings(res.data.results || res.data)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (ref) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await bookingsAPI.cancel(ref)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed')
    }
  }

  // ── Download Booking History PDF ───────────────────────────────────────
  const handleDownloadHistory = () => {
    if (bookings.length === 0) { toast.error('No bookings to download!'); return }

    const totalSpent = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + Number(b.total_amount), 0)

    const rows = bookings.map(b => `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px;font-family:monospace;color:#4f46e5;font-size:11px;">${b.booking_ref}</td>
        <td style="padding:10px;font-size:13px;font-weight:bold;">${b.show?.name || 'N/A'}</td>
        <td style="padding:10px;font-size:12px;color:#666;">${b.show?.date || '—'}</td>
        <td style="padding:10px;font-size:13px;text-align:center;">${b.total_tickets}</td>
        <td style="padding:10px;font-weight:bold;font-size:13px;color:#4f46e5;">₹${b.total_amount}</td>
        <td style="padding:10px;">
          <span style="
            background:${b.status === 'confirmed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef9c3'};
            color:${b.status === 'confirmed' ? '#16a34a' : b.status === 'cancelled' ? '#dc2626' : '#ca8a04'};
            padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:capitalize;">
            ${b.status}
          </span>
        </td>
      </tr>
    `).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Booking History — City Museum</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:#f8f8f8; padding:30px; }
    .container { max-width:800px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
    .header { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:28px 30px; color:white; }
    .header h1 { font-size:20px; font-weight:900; margin-bottom:4px; }
    .header p { opacity:0.75; font-size:12px; }
    .summary { display:flex; gap:0; border-bottom:1px solid #e8e8e8; }
    .stat { flex:1; text-align:center; padding:16px; border-right:1px solid #e8e8e8; }
    .stat:last-child { border-right:none; }
    .stat .val { font-size:22px; font-weight:900; color:#4f46e5; }
    .stat .lbl { font-size:11px; color:#888; margin-top:2px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f5f5ff; color:#4f46e5; padding:10px; text-align:left; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; }
    .footer { padding:16px; text-align:center; color:#aaa; font-size:11px; background:#f8f8f8; border-top:1px solid #eee; }
    @media print { body{padding:0;background:white;} .container{box-shadow:none;} }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏛️ City Museum — My Booking History</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
  </div>
  <div class="summary">
    <div class="stat"><div class="val">${bookings.length}</div><div class="lbl">Total Bookings</div></div>
    <div class="stat"><div class="val">${bookings.filter(b=>b.status==='confirmed').length}</div><div class="lbl">Confirmed</div></div>
    <div class="stat"><div class="val">${bookings.filter(b=>b.status==='cancelled').length}</div><div class="lbl">Cancelled</div></div>
    <div class="stat"><div class="val">₹${totalSpent}</div><div class="lbl">Total Spent</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Booking Ref</th><th>Show</th><th>Date</th>
        <th style="text-align:center;">Tickets</th><th>Amount</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">City Museum • AI-Powered Ticketing • support@museum.com</div>
</div>
<script>window.onload = () => window.print()</script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) { toast.error('Popup blocked! Allow popups.'); return }
    w.document.write(html)
    w.document.close()
    toast.success('History PDF download ho raha hai! 📄')
  }

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b =>
      b.show?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="fixed inset-0 bg-hero-gradient opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-16">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">Your History</p>
              <h1 className="text-4xl font-black text-white mb-2">My Bookings</h1>
              <p className="text-dark-400">All your museum ticket bookings</p>
            </div>
            {/* Download History Button */}
            {!loading && bookings.length > 0 && (
              <button
                onClick={handleDownloadHistory}
                className="flex-shrink-0 flex items-center gap-2 glass-light border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 font-bold px-5 py-3 rounded-2xl text-sm transition-all mt-2"
              >
                <Download size={15} />
                Download History
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Bookings', value: bookings.length,                                                                                        icon: Ticket       },
              { label: 'Confirmed',      value: bookings.filter(b => b.status === 'confirmed').length,                                                  icon: Calendar     },
              { label: 'Total Spent',    value: `₹${bookings.filter(b => b.status === 'confirmed').reduce((a, b) => a + Number(b.total_amount), 0)}`,   icon: IndianRupee  },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5 text-center">
                <s.icon size={20} className="text-brand-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-dark-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
            <input type="text" placeholder="Search bookings..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark w-full pl-11 pr-4 py-3 rounded-2xl text-sm" />
          </div>
          <div className="flex glass rounded-2xl p-1 border border-white/5 gap-1">
            {['all', 'confirmed', 'cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all
                  ${filter === f ? 'btn-primary text-white' : 'text-dark-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {loading ? (
            [1,2,3].map(i => <BookingRowSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border border-white/5">
              <p className="text-5xl mb-4">🎫</p>
              <p className="text-white font-bold text-lg mb-1">No bookings found</p>
              <p className="text-dark-500 text-sm">
                {bookings.length === 0 ? 'Book your first ticket via chatbot!' : 'Try different filter'}
              </p>
            </div>
          ) : (
            filtered.map((b, i) => {
              const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending
              return (
                <motion.div key={b.booking_ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                  className="glass rounded-3xl border border-white/5 p-6 hover:border-brand-500/20 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="w-14 h-14 glass-light rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                      🏛️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className="text-dark-500 text-xs font-mono">{b.booking_ref}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg truncate">{b.show?.name}</h3>
                      <p className="text-brand-400 text-xs font-medium mb-3">{b.show?.category}</p>
                      <div className="flex flex-wrap gap-4 text-dark-400 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-dark-500" />{b.show?.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={13} className="text-dark-500" />{b.total_tickets} ticket{b.total_tickets > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <IndianRupee size={13} className="text-dark-500" />{b.total_amount}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      {b.status === 'confirmed' && (
                        <>
                          <Link to={`/ticket/${b.booking_ref}`}
                            className="btn-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                            <Eye size={14} /> View Ticket
                          </Link>
                          <button onClick={() => handleCancel(b.booking_ref)}
                            className="glass-light border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all">
                            <X size={14} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}