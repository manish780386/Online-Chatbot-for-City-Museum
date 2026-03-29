import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Users, MapPin, Shield, Tag, ChevronRight, Loader } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { bookingsAPI, paymentAPI, showsAPI } from '../services/api'
import { openRazorpayCheckout } from '../services/razorpay'
import toast from 'react-hot-toast'

export default function BookingSummary() {
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [showId, setShowId] = useState(null)

  const navigate = useNavigate()

  // ── Load booking from localStorage ─────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('pendingBooking')

    if (saved) {
      setBookingInfo(JSON.parse(saved))
    } else {
      toast.error('No booking found.')
      navigate('/')
    }
  }, [])

  // ── Fetch showId from backend ──────────────────────────
  useEffect(() => {
    if (!bookingInfo?.categoryKey) return

    showsAPI.getAll({ category: bookingInfo.categoryKey })
      .then(res => {
        const shows = res.data.results || res.data

        if (shows.length > 0) {
          setShowId(shows[0].id)
        } else {
          toast.error('No show available.')
        }
      })
      .catch(() => toast.error('Show fetch failed'))
  }, [bookingInfo])

  // ── Calculation (FIXED) ────────────────────────────────
  const baseTotal = bookingInfo?.total || 0
  const tax = Math.round(baseTotal * 0.05)
  const total = baseTotal + tax - discount

  // ── Coupon logic ──────────────────────────────────────
  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'MUSEUM10') {
      const disc = Math.round(baseTotal * 0.1)
      setDiscount(disc)
      toast.success('10% discount applied 🎉')
    } else {
      toast.error('Invalid coupon')
    }
  }

  // ── Payment Handler (FIXED) ───────────────────────────
  const handlePayment = async () => {
    if (!showId) {
      toast.error('Wait, loading show...')
      return
    }

    if (!bookingInfo) {
      toast.error('Booking missing')
      navigate('/')
      return
    }

    setLoading(true)

    try {
      // ✅ Create booking
      const bookingRes = await bookingsAPI.create({
        show: showId,
        visitor_name: bookingInfo.visitor_name || 'Guest',
        visitor_email: bookingInfo.visitor_email || 'guest@museum.com',
        visitor_phone: bookingInfo.visitor_phone || '9999999999',
        quantity_adult: bookingInfo.qty || 1,
        quantity_child: 0,
      })

      const {
        booking,
        razorpay_order_id,
        razorpay_key_id,
        amount, // 🔥 IMPORTANT
      } = bookingRes.data

      // ✅ Open Razorpay
      await openRazorpayCheckout({
        orderId: razorpay_order_id,
        amount: amount, // ✅ backend amount
        keyId: razorpay_key_id,
        bookingRef: booking.booking_ref,
        visitorName: bookingInfo.visitor_name,
        visitorEmail: bookingInfo.visitor_email || 'guest@museum.com',
        visitorPhone: bookingInfo.visitor_phone,

        onSuccess: async (res) => {
          try {
            await paymentAPI.verify({
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
            })

            localStorage.removeItem('pendingBooking')
            toast.success('Payment successful 🎉')
            navigate(`/ticket/${booking.booking_ref}`)

          } catch {
            toast.error('Verification failed')
          } finally {
            setLoading(false)
          }
        },

        onFailure: (msg) => {
          toast.error(msg || 'Payment failed')
          setLoading(false)
        }
      })

    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Booking failed')
      setLoading(false)
    }
  }

  // ── Loading Screen ────────────────────────────────────
  if (!bookingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <Loader className="animate-spin text-white" />
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="fixed inset-0 bg-hero-gradient opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-glow-blue opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-16">

        <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Shows
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">Step 2 of 3</p>
          <h1 className="text-4xl font-black text-white">Booking Summary</h1>
          <p className="text-dark-400 mt-1">Review your booking before payment</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-4">

            {/* Show Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="glass rounded-3xl border border-white/8 p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  🏛️
                </div>
                <div>
                  <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    {bookingInfo.category}
                  </p>
                  <h2 className="text-white font-black text-xl">{bookingInfo.category}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: 'Date', value: bookingInfo.date },
                  { icon: Clock, label: 'Time', value: '10:00 AM' },
                  { icon: MapPin, label: 'Venue', value: 'Main Gallery' },
                  { icon: Users, label: 'Visitors', value: `${bookingInfo.qty} ticket${bookingInfo.qty > 1 ? 's' : ''}` },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <item.icon size={14} className="text-brand-400 mb-2" />
                    <p className="text-dark-500 text-xs mb-0.5">{item.label}</p>
                    <p className="text-white font-semibold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="glass rounded-3xl border border-white/8 p-6"
            >
              <h3 className="text-white font-bold mb-4">Price Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-white text-sm font-medium">Tickets</p>
                    <p className="text-dark-500 text-xs">{bookingInfo.qty} × ₹{bookingInfo.total / bookingInfo.qty}</p>
                  </div>
                  <p className="text-white font-bold">₹{bookingInfo.total}</p>
                </div>
                <div className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-dark-400 text-sm">GST (5%)</p>
                  <p className="text-dark-400 font-medium">₹{tax}</p>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-green-400 text-sm">Coupon Discount</p>
                    <p className="text-green-400 font-bold">-₹{discount}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Coupon */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="glass rounded-3xl border border-white/8 p-6"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Tag size={16} className="text-brand-400" /> Apply Coupon
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter coupon code (try MUSEUM10)"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                  className="input-dark flex-1 px-4 py-3 rounded-2xl text-sm"
                />
                <button onClick={applyCoupon} className="btn-primary text-white font-bold px-6 py-3 rounded-2xl text-sm">
                  Apply
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right — Pay Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
              className="glass rounded-3xl border border-white/8 p-6 sticky top-28 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.1), transparent 70%)' }}
              />
              <div className="relative">
                <h3 className="text-white font-bold text-lg mb-6">Order Total</h3>

                <div
                  className="rounded-2xl p-5 text-center mb-6"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <p className="text-dark-400 text-sm mb-1">Total Amount</p>
                  <p className="text-white font-black text-5xl">₹{total}</p>
                  <p className="text-dark-500 text-xs mt-2">Including all taxes</p>
                </div>

                {/* Visitor Info */}
                {/* Visitor Info */}
                <div
                  className="rounded-2xl p-4 mb-5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-dark-400 text-xs mb-2 font-semibold uppercase tracking-wider">Visitor Details</p>
                  <p className="text-white text-sm font-bold">{bookingInfo.visitor_name}</p>
                  <p className="text-dark-400 text-xs">{bookingInfo.visitor_phone}</p>
                  {bookingInfo.visitor_email && bookingInfo.visitor_email !== 'guest@museum.com' && (
                    <p className="text-dark-400 text-xs">{bookingInfo.visitor_email}</p>
                  )}
                </div>

                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Accepted Payments
                </p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['UPI', 'Card', 'Net Banking'].map(m => (
                    <div
                      key={m}
                      className="rounded-xl py-2 text-center text-xs font-bold text-dark-300"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {m}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading || !showId}
                  className="btn-primary w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : !showId ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Loading show...
                    </>
                  ) : (
                    <>
                      Pay ₹{total}
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <Shield size={13} className="text-green-400" />
                  <p className="text-dark-500 text-xs">100% Secure • Powered by Razorpay</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}