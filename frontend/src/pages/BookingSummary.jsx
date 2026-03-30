import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Users, MapPin, Shield, Tag, ChevronRight, Loader, CheckCircle } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { bookingsAPI, paymentAPI, showsAPI } from '../services/api'
import { openRazorpayCheckout } from '../services/razorpay'
import toast from 'react-hot-toast'

const CATEGORY_EMOJI = {
  general:    '🏺',
  exhibition: '🎨',
  night_show: '🌙',
  special:    '🦕',
}

export default function BookingSummary() {
  const [loading,     setLoading]     = useState(false)
  const [coupon,      setCoupon]      = useState('')
  const [discount,    setDiscount]    = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [showData,    setShowData]    = useState(null)
  const [showId,      setShowId]      = useState(null)
  const navigate                      = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('pendingBooking')
    if (saved) {
      const data = JSON.parse(saved)
      setBookingInfo(data)
      // If showId already saved from chatbot
      if (data.showId) setShowId(data.showId)
    } else {
      toast.error('No booking found. Please start from chatbot.')
      navigate('/')
    }
  }, [])

  useEffect(() => {
    if (!bookingInfo?.categoryKey) return
    showsAPI.getAll({ category: bookingInfo.categoryKey })
      .then(res => {
        const shows = res.data.results || res.data
        if (shows.length > 0) {
          setShowId(shows[0].id)
          setShowData(shows[0])
        } else {
          toast.error('Show not available for this date. Please try another show.')
        }
      })
      .catch(() => toast.error('Could not fetch show details.'))
  }, [bookingInfo])

  const baseTotal   = bookingInfo?.total || 0
  const pricePerTicket = bookingInfo?.qty > 0 ? baseTotal / bookingInfo.qty : 0
  const tax         = Math.round(baseTotal * 0.05)
  const total       = baseTotal + tax - discount

  const applyCoupon = () => {
    if (couponApplied) { toast.error('Coupon already applied!'); return }
    const code = coupon.toUpperCase()
    if (code === 'MUSEUM10') {
      setDiscount(Math.round(baseTotal * 0.1))
      setCouponApplied(true)
      toast.success('10% discount applied! 🎉')
    } else if (code === 'WELCOME20') {
      setDiscount(Math.round(baseTotal * 0.2))
      setCouponApplied(true)
      toast.success('20% discount applied! 🎉')
    } else if (code === 'STUDENT15') {
      setDiscount(Math.round(baseTotal * 0.15))
      setCouponApplied(true)
      toast.success('15% student discount applied! 🎉')
    } else {
      toast.error('Invalid coupon code. Try MUSEUM10, WELCOME20, or STUDENT15')
    }
  }

  const handlePayment = async () => {
  if (!showId) { toast.error('Show not loaded. Please wait.'); return }
  if (!bookingInfo) { navigate('/'); return }
  setLoading(true)

  try {
    const bookingRes = await bookingsAPI.create({
      show:            showId,
      visitor_name:    bookingInfo.visitor_name  || 'Guest',
      visitor_email:   bookingInfo.visitor_email || 'guest@museum.com',
      visitor_phone:   bookingInfo.visitor_phone || '9999999999',
      quantity_adult:  bookingInfo.qty           || 1,
      quantity_child:  0,
      coupon_code:     couponApplied ? coupon : '',   // ← Coupon backend ko bhejo
    })

    const { booking, razorpay_order_id, razorpay_key_id, amount } = bookingRes.data

    // amount backend se aata hai — GST + discount already included
    console.log(`✅ Frontend: Razorpay amount = ₹${amount / 100}`)

    await openRazorpayCheckout({
      orderId:      razorpay_order_id,
      amount:       amount,     // ← Backend ka real amount with GST
      keyId:        razorpay_key_id,
      bookingRef:   booking.booking_ref,
      visitorName:  bookingInfo.visitor_name,
      visitorEmail: bookingInfo.visitor_email || 'guest@museum.com',
      visitorPhone: bookingInfo.visitor_phone,

      onSuccess: async (res) => {
        try {
          await paymentAPI.verify({
            razorpay_order_id:   res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature:  res.razorpay_signature,
          })
          localStorage.removeItem('pendingBooking')
          toast.success('Payment successful! 🎉')
          navigate(`/ticket/${booking.booking_ref}`)
        } catch {
          toast.error('Payment verification failed. Contact support.')
        } finally {
          setLoading(false)
        }
      },

      onFailure: (msg) => {
        toast.error(msg || 'Payment failed. Please try again.')
        setLoading(false)
      },
    })

  } catch (err) {
    console.error('Booking error:', err.response?.data)
    toast.error(err.response?.data?.error || 'Booking failed. Please try again.')
    setLoading(false)
  }
}

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const emoji = CATEGORY_EMOJI[bookingInfo.categoryKey] || '🏛️'

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
          <div className="lg:col-span-2 space-y-4">

            {/* Show Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="glass rounded-3xl border border-white/8 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {emoji}
                </div>
                <div>
                  <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">{bookingInfo.categoryKey?.replace('_',' ')}</p>
                  <h2 className="text-white font-black text-xl">{bookingInfo.category}</h2>
                  {showData && (
                    <p className="text-dark-400 text-xs mt-1">
                      ⏰ {showData.start_time?.slice(0,5)} – {showData.end_time?.slice(0,5)} &nbsp;•&nbsp; 🏛️ Main Gallery
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: 'Visit Date', value: bookingInfo.date },
                  { icon: Clock,    label: 'Show Time',  value: showData?.start_time?.slice(0,5) || '10:00' },
                  { icon: MapPin,   label: 'Venue',      value: 'City Museum, Main Hall' },
                  { icon: Users,    label: 'Visitors',   value: `${bookingInfo.qty} Adult${bookingInfo.qty > 1 ? 's' : ''}` },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <item.icon size={14} className="text-brand-400 mb-2" />
                    <p className="text-dark-500 text-xs mb-0.5">{item.label}</p>
                    <p className="text-white font-semibold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Price Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              className="glass rounded-3xl border border-white/8 p-6">
              <h3 className="text-white font-bold mb-4">Price Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-white text-sm font-medium">Adult Tickets</p>
                    <p className="text-dark-500 text-xs">₹{pricePerTicket} × {bookingInfo.qty} ticket{bookingInfo.qty > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-white font-bold">₹{baseTotal}</p>
                </div>
                <div className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-dark-400 text-sm">GST (5%)</p>
                    <p className="text-dark-500 text-xs">Government tax</p>
                  </div>
                  <p className="text-dark-400 font-medium">₹{tax}</p>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" />
                      <p className="text-green-400 text-sm">Coupon Discount</p>
                    </div>
                    <p className="text-green-400 font-bold">-₹{discount}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3">
                  <p className="text-white font-black text-lg">Grand Total</p>
                  <p className="text-brand-400 font-black text-2xl">₹{total}</p>
                </div>
              </div>
            </motion.div>

            {/* Coupon */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="glass rounded-3xl border border-white/8 p-6">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <Tag size={16} className="text-brand-400" /> Apply Coupon
              </h3>
              <p className="text-dark-500 text-xs mb-4">Available: MUSEUM10, WELCOME20, STUDENT15</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  disabled={couponApplied}
                  className="input-dark flex-1 px-4 py-3 rounded-2xl text-sm disabled:opacity-50"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponApplied || !coupon}
                  className="btn-primary text-white font-bold px-6 py-3 rounded-2xl text-sm disabled:opacity-50"
                >
                  {couponApplied ? '✓ Applied' : 'Apply'}
                </button>
              </div>
            </motion.div>

            {/* Visitor Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
              className="glass rounded-3xl border border-white/8 p-6">
              <h3 className="text-white font-bold mb-4">Visitor Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name',   value: bookingInfo.visitor_name  },
                  { label: 'Phone',       value: bookingInfo.visitor_phone },
                  { label: 'Email',       value: bookingInfo.visitor_email !== 'guest@museum.com' ? bookingInfo.visitor_email : 'Not provided' },
                  { label: 'Tickets',     value: `${bookingInfo.qty} Adult${bookingInfo.qty > 1 ? 's' : ''}` },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-dark-500 text-xs mb-1">{item.label}</p>
                    <p className="text-white font-semibold text-sm truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Pay Card */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
              className="glass rounded-3xl border border-white/8 p-6 sticky top-28 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.1), transparent 70%)' }} />
              <div className="relative">
                <h3 className="text-white font-bold text-lg mb-4">Order Total</h3>

                <div className="rounded-2xl p-5 text-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-dark-400 text-sm mb-1">Total Amount</p>
                  <p className="text-white font-black text-5xl">₹{total}</p>
                  <p className="text-dark-500 text-xs mt-2">Including GST • {bookingInfo.qty} ticket{bookingInfo.qty > 1 ? 's' : ''}</p>
                </div>

                {/* Show info mini */}
                <div className="rounded-2xl p-3 mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="text-white text-sm font-bold">{bookingInfo.category}</p>
                      <p className="text-dark-400 text-xs">{bookingInfo.date}</p>
                    </div>
                  </div>
                </div>

                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-3">Accepted Payments</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['UPI', 'Card', 'Net Banking'].map(m => (
                    <div key={m} className="rounded-xl py-2 text-center text-xs font-bold text-dark-300"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                    <><Loader size={18} className="animate-spin" /> Processing...</>
                  ) : !showId ? (
                    <><Loader size={18} className="animate-spin" /> Loading show...</>
                  ) : (
                    <>Pay ₹{total} <ChevronRight size={18} /></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <Shield size={13} className="text-green-400" />
                  <p className="text-dark-500 text-xs">100% Secure • Powered by Razorpay</p>
                </div>

                <p className="text-dark-600 text-xs text-center mt-3">
                  By proceeding you agree to our cancellation policy
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}