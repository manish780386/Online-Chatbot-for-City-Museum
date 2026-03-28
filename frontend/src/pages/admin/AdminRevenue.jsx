import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { analyticsAPI } from '../../services/api'

const STATIC = [
  { day: 'Mon', revenue: 4200, bookings: 28 },
  { day: 'Tue', revenue: 3800, bookings: 24 },
  { day: 'Wed', revenue: 5100, bookings: 34 },
  { day: 'Thu', revenue: 4700, bookings: 31 },
  { day: 'Fri', revenue: 6200, bookings: 41 },
  { day: 'Sat', revenue: 8900, bookings: 59 },
  { day: 'Sun', revenue: 9100, bookings: 61 },
]

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

export default function AdminRevenue() {
  const [analytics,   setAnalytics]   = useState(null)
  const [revenueData, setRevenueData] = useState(STATIC)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
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
      .finally(() => setLoading(false))
  }

  const totalWeekly = revenueData.reduce((a, d) => a + d.revenue, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Weekly Revenue',  value: `₹${totalWeekly.toLocaleString()}`, sub: 'Last 7 days',        color: 'from-brand-600/30 to-purple-600/20' },
          { label: 'Total Bookings',  value: analytics?.total_bookings ?? '—',   sub: 'All time confirmed',  color: 'from-green-600/30 to-teal-600/20'   },
          { label: 'Today Revenue',   value: analytics ? `₹${Number(analytics.today_revenue).toLocaleString()}` : '—', sub: 'Today', color: 'from-orange-600/30 to-amber-600/20' },
        ].map((c, i) => (
          <div key={i} className={`glass rounded-3xl p-6 border border-white/5 bg-gradient-to-br ${c.color}`}>
            <p className="text-dark-300 text-sm mb-3">{c.label}</p>
            {loading
              ? <div className="h-10 shimmer-bg rounded-full w-1/2 mb-2 animate-pulse" />
              : <p className="text-white font-black text-4xl mb-1">{c.value}</p>
            }
            <p className="text-dark-400 text-xs">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Bar */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Daily Revenue</h3>
            <p className="text-dark-500 text-xs mt-0.5">This week breakdown</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="glass-light border border-white/10 text-dark-300 hover:text-white p-2 rounded-xl transition-all">
              <RefreshCw size={14} />
            </button>
            <button className="glass-light border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all">
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData} barSize={32}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#475569' }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity={1}   />
                <stop offset="100%" stopColor="#4338ca" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <Bar dataKey="revenue" name="revenue" radius={[8,8,0,0]} fill="url(#revGrad2)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <h3 className="text-white font-bold text-lg mb-6">Bookings vs Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="bookings" name="bookings" stroke="#8b5cf6" strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#a78bfa' }} />
            <Line type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2}
              strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Table */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-bold">Daily Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Day','Revenue','Bookings','Avg per Booking'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-dark-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenueData.map((d, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="px-6 py-4 text-white font-semibold text-sm">{d.day}</td>
                  <td className="px-6 py-4 text-green-400 font-bold text-sm">₹{d.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-dark-300 text-sm">{d.bookings}</td>
                  <td className="px-6 py-4 text-dark-400 text-sm">
                    ₹{d.bookings > 0 ? Math.round(d.revenue / d.bookings).toLocaleString() : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}