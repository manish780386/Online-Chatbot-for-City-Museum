import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, ArrowLeft, CheckCircle, Calendar, Clock, Users, MapPin, Copy, Share2 } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { bookingsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function TicketPage() {
  const { bookingRef }        = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsAPI.getByRef(bookingRef)
      .then(res => setBooking(res.data))
      .catch(() => toast.error('Booking not found'))
      .finally(() => setLoading(false))
  }, [bookingRef])

  // ── WhatsApp Share ─────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!booking) return
    const msg = encodeURIComponent(
      `🏛️ *City Museum Ticket*\n\n` +
      `📋 Ref: ${booking.booking_ref}\n` +
      `🎭 Show: ${booking.show?.name}\n` +
      `📅 Date: ${booking.show?.date}\n` +
      `⏰ Time: ${booking.show?.start_time}\n` +
      `🎫 Tickets: ${booking.total_tickets}\n` +
      `💰 Amount: ₹${booking.total_amount}\n\n` +
      `🔗 View Ticket: ${window.location.href}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  // ── Copy Link ──────────────────────────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Ticket link copied! 📋')
  }

  // ── Download PDF ───────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!booking) return

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket - ${booking.booking_ref}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:#f0f0f0; padding:20px; }
    .ticket { max-width:500px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15); }
    .header { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:24px; text-align:center; color:white; }
    .header h1 { font-size:22px; font-weight:900; margin-bottom:4px; }
    .header p { font-size:13px; opacity:0.8; }
    .divider { border-top:2px dashed #e0e0e0; margin:0 16px; }
    .body { padding:24px; }
    .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .row:last-child { border-bottom:none; }
    .label { color:#888; font-size:13px; }
    .value { color:#111; font-weight:bold; font-size:13px; }
    .ref { text-align:center; margin-bottom:16px; }
    .ref span { background:#f0f0ff; color:#4f46e5; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:bold; font-family:monospace; }
    .qr-section { text-align:center; padding:16px 0; }
    .qr-section img { width:140px; height:140px; border-radius:8px; }
    .qr-placeholder { width:140px; height:140px; margin:0 auto; border:2px dashed #4f46e5; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#4f46e5; font-size:12px; font-weight:bold; }
    .amount { text-align:center; font-size:32px; font-weight:900; color:#4f46e5; padding:16px 0; }
    .footer { background:#f8f8f8; padding:16px; text-align:center; color:#888; font-size:12px; }
    .badge { display:inline-block; background:#dcfce7; color:#16a34a; padding:4px 14px; border-radius:20px; font-weight:bold; font-size:12px; margin-bottom:12px; }
    @media print { body{background:white;padding:0;} .ticket{box-shadow:none;} }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>🏛️ City Museum</h1>
      <p>Official Entry Ticket</p>
    </div>
    <div class="body">
      <div class="ref"><span>${booking.booking_ref}</span></div>
      <span class="badge">✓ Booking Confirmed</span>
      <div class="row"><span class="label">Show</span><span class="value">${booking.show?.name || 'Museum Entry'}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${booking.show?.date || ''}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${booking.show?.start_time || '10:00 AM'}</span></div>
      <div class="row"><span class="label">Visitor</span><span class="value">${booking.visitor_name || ''}</span></div>
      <div class="row"><span class="label">Tickets</span><span class="value">${booking.total_tickets}</span></div>
      <div class="amount">₹${booking.total_amount}</div>
      <div class="qr-section">
        ${booking.qr_code
          ? `<img src="http://localhost:8000${booking.qr_code}" alt="QR Code" />`
          : `<div class="qr-placeholder">QR Code</div>`
        }
        <p style="color:#888;font-size:12px;margin-top:8px;">Show at museum entry gate</p>
      </div>
    </div>
    <div class="divider"></div>
    <div class="footer">City Museum • AI-Powered Ticketing • support@museum.com</div>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=600,height=800')
    if (!w) { toast.error('Popup blocked! Please allow popups.'); return }
    w.document.write(html)
    w.document.close()
    toast.success('Print dialog opening — Save as PDF!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400 text-sm">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🎫</p>
          <p className="text-white font-bold text-xl">Booking not found</p>
          <Link to="/my-bookings" className="text-brand-400 text-sm mt-4 block">
            Go to My Bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="fixed inset-0 bg-hero-gradient opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-28 pb-16">
        <Link to="/my-bookings"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Bookings
        </Link>

        {/* Success Header */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h1>
          <p className="text-dark-400 text-sm">Show QR code at museum entry gate</p>
        </motion.div>

        {/* Ticket Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="relative">
          <div className="absolute inset-0 bg-brand-600/20 rounded-3xl blur-xl" />
          <div className="relative glass rounded-3xl border border-white/10 overflow-hidden shadow-card">
            <div className="h-2 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />

            {/* Header */}
            <div className="px-6 py-5"
              style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(139,92,246,0.2))' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 btn-primary rounded-2xl flex items-center justify-center text-2xl shadow-glow-sm">
                    🏛️
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">City Museum</p>
                    <p className="text-brand-300 text-xs">Official Entry Ticket</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-xs mb-1">Booking Ref</p>
                  <p className="text-white font-mono text-xs font-bold">{booking.booking_ref}</p>
                </div>
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="flex items-center px-0">
              <div className="w-5 h-5 bg-dark-950 rounded-full -ml-2.5 flex-shrink-0 border border-white/10" />
              <div className="flex-1 border-t-2 border-dashed border-white/10 mx-1" />
              <div className="w-5 h-5 bg-dark-950 rounded-full -mr-2.5 flex-shrink-0 border border-white/10" />
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <h2 className="text-white font-black text-2xl mb-1">{booking.show?.name}</h2>
              <p className="text-brand-400 text-sm font-semibold mb-6 capitalize">{booking.show?.category}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Calendar, label: 'Date',    value: booking.show?.date              },
                  { icon: Clock,    label: 'Time',    value: booking.show?.start_time         },
                  { icon: Users,    label: 'Tickets', value: `${booking.total_tickets} total` },
                  { icon: MapPin,   label: 'Amount',  value: `₹${booking.total_amount}`       },
                ].map(item => (
                  <div key={item.label} className="glass-light rounded-2xl p-3 border border-white/5">
                    <item.icon size={14} className="text-brand-400 mb-1" />
                    <p className="text-dark-500 text-xs mb-0.5">{item.label}</p>
                    <p className="text-white font-bold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center py-6 glass-light rounded-2xl border border-white/5">
                {booking.qr_code ? (
                  <img src={`http://localhost:8000${booking.qr_code}`} alt="QR Code"
                    className="w-40 h-40 rounded-xl" />
                ) : (
                  <div className="w-40 h-40 rounded-xl border-2 border-dashed border-brand-500/30 flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.05)' }}>
                    <p className="text-brand-400 text-xs font-bold text-center">QR Code<br />Generating...</p>
                  </div>
                )}
                <p className="text-dark-400 text-xs mt-3">Scan at museum entry gate</p>
                <p className="text-dark-600 font-mono text-xs mt-1">{booking.booking_ref}</p>
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="flex items-center px-0">
              <div className="w-5 h-5 bg-dark-950 rounded-full -ml-2.5 flex-shrink-0 border border-white/10" />
              <div className="flex-1 border-t-2 border-dashed border-white/10 mx-1" />
              <div className="w-5 h-5 bg-dark-950 rounded-full -mr-2.5 flex-shrink-0 border border-white/10" />
            </div>

            {/* ── Actions ── */}
            <div className="px-6 py-5 space-y-3">

              {/* Row 1 — Download + WhatsApp */}
              <div className="flex gap-3">
                <button onClick={handleDownload}
                  className="flex-1 btn-primary text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Download size={15} /> Download PDF
                </button>

                {/* WhatsApp */}
                <button onClick={handleWhatsApp}
                  className="flex-1 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              </div>

              {/* Row 2 — Copy Link */}
              <button onClick={handleCopyLink}
                className="w-full glass-light border border-white/10 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-white/10 transition-all">
                <Copy size={14} /> Copy Ticket Link
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}