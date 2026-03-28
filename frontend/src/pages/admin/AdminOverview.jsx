import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Ticket, IndianRupee, Users, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { analyticsAPI, bookingsAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const STATIC_REVENUE = [
  { day: 'Mon', revenue: 4200, bookings: 28 },
  { day: 'Tue', revenue: 3800, bookings: 24 },
  { day: 'Wed', revenue: 5100, bookings: 34 },
  { day: 'Thu', revenue: 4700, bookings: 31 },
  { day: 'Fri', revenue: 6200, bookings: 41 },
  { day: 'Sat', revenue: 8900, bookings: 59 },
  { day: 'Sun', revenue: 9100, bookings: 61 },
]

const PIE_DATA = [
  { name: 'General Entry',  value: 40, color: '#f59e0b' },
  { name: 'Exhibition',     value: 30, color: '#8b5cf6' },
  { name: 'Night Show',     value: 20, color: '#3b82f6' },
  { name: 'Dinosaur World', value: 10, color: '#10b981' },
]

const STATUS = {
  confirmed: { pill: 'bg-green-500/15 text-green-400 border border-green-500/20',    icon: CheckCircle, label: 'Confirmed' },
  pending:   { pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20', icon: Clock,       label: 'Pending'   },
  cancelled: { pill: 'bg-red-500/15 text-red-400 border border-red-500/20',           icon: XCircle,     label: 'Cancelled' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl border border-white/10 px-4 py-3 text-xs shadow-card">
      <p className="text-dark-300 mb-1 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} bookings`}
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, color, loading }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8 ${color}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
          <Icon size={18} className="text-white" />
        </div>
        {change && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            change.startsWith('+') ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}>{change}</span>
        )}
      </div>
      {loading
        ? <div className="h-8 shimmer-bg rounded-full w-1/2 mb-2 animate-pulse" />
        : <p className="text-3xl font-black text-white mb-1">{value}</p>
      }
      <p className="text-dark-400 text-sm">{label}</p>
    </div>
  )
}

export default function AdminOverview() {
  const [analytics,    setAnalytics]    = useState(null)
  const [revenueData,  setRevenueData]  = useState(STATIC_REVENUE)
  const [bookings,     setBookings]     = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoadingStats(true)
    setLoadingTable(true)

    analyticsAPI.get()
      .then(res => {
        setAnalytics(res.data)
        if (res.data.weekly?.length > 0) {
          setRevenueData(res.data.weekly.map(w => ({
            day: w.day, revenue: w.revenue, bookings: w.bookings
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false))

    bookingsAPI.getMyAll()
      .then(res => {
        const data = res.data.results || res.data
        setBookings(data.map(b => ({
          ref:    b.booking_ref,
          name:   b.visitor_name,
          show:   b.show?.name || '—',
          amount: Number(b.total_amount),
          status: b.status,
        })))
      })
      .catch(() => {})
      .finally(() => setLoadingTable(false))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket}      label="Total Bookings"  value={analytics?.total_bookings ?? '—'} change="+12%" color="bg-brand-600"  loading={loadingStats} />
        <StatCard icon={IndianRupee} label="Revenue Today"   value={analytics ? `₹${Number(analytics.today_revenue).toLocaleString()}` : '—'} change="+18%" color="bg-green-600"  loading={loadingStats} />
        <StatCard icon={Users}       label="Today Bookings"  value={analytics?.today_bookings ?? '—'} change="+8%"  color="bg-purple-600" loading={loadingStats} />
        <StatCard icon={Clock}       label="Pending"         value={bookings.filter(b => b.status === 'pending').length} change="-5%" color="bg-orange-600" loading={loadingStats} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold text-lg">Weekly Revenue</h3>
              <p className="text-dark-500 text-xs mt-0.5">Last 7 days</p>
            </div>
            <span className="text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">+18% ↑</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" name="revenue" radius={[8,8,0,0]} fill="url(#barGrad)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-6 border border-white/5">
          <h3 className="text-white font-bold text-lg mb-1">Category Split</h3>
          <p className="text-dark-500 text-xs mb-4">Bookings by type</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {PIE_DATA.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-dark-400">{d.name}</span>
                </div>
                <span className="text-white font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <h3 className="text-white font-bold text-lg mb-6">Daily Bookings Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={revenueData}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="bookings" name="bookings" stroke="#8b5cf6" strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 0 }} activeDot={{ r: 7, fill: '#a78bfa' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-bold">Recent Bookings</h3>
          <button onClick={() => navigate('/admin/bookings')} className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
            View all →
          </button>
        </div>
        {loadingTable ? (
          <div className="space-y-3 p-6">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 shimmer-bg rounded-full w-24" />
                <div className="h-4 shimmer-bg rounded-full w-32" />
                <div className="h-4 shimmer-bg rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Ref','Visitor','Show','Amount','Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-dark-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map(b => {
                  const s = STATUS[b.status] || STATUS.pending
                  return (
                    <tr key={b.ref} className="hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-6 py-4 font-mono text-dark-400 text-xs">{b.ref}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center text-white text-xs font-black">{b.name?.[0]?.toUpperCase()}</div>
                          <span className="text-white text-sm font-semibold">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-dark-300 text-sm">{b.show}</td>
                      <td className="px-6 py-4 text-white font-bold text-sm">₹{b.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit ${s.pill}`}>
                          <s.icon size={11} />{s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}