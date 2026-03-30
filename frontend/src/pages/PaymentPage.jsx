import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Lock, CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { useEffect } from 'react'



const AMOUNT = 375

const METHODS = [
  {
    id:    'upi',
    icon:  Smartphone,
    label: 'UPI',
    desc:  'GPay, PhonePe, Paytm, BHIM',
    color: 'rgba(16,185,129,0.15)',
    border:'rgba(16,185,129,0.3)',
  },
  {
    id:    'card',
    icon:  CreditCard,
    label: 'Credit / Debit Card',
    desc:  'Visa, Mastercard, RuPay',
    color: 'rgba(99,102,241,0.15)',
    border:'rgba(99,102,241,0.3)',
  },
  {
    id:    'netbanking',
    icon:  Building2,
    label: 'Net Banking',
    desc:  'SBI, HDFC, ICICI, Axis & more',
    color: 'rgba(245,158,11,0.15)',
    border:'rgba(245,158,11,0.3)',
  },
]

export default function PaymentPage() {

  
 
  const [selected, setSelected] = useState('upi')
  const [upiId, setUpiId]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [paid, setPaid]         = useState(false)
  const navigate                = useNavigate()
  // PaymentPage.jsx — Ab redirect page hai



  
  useEffect(() => { navigate('/booking/summary') }, [])
 

  

  const handlePay = () => {
    setLoading(true)
    // Real Razorpay call backend se hoga
    setTimeout(() => {
      setLoading(false)
      setPaid(true)
      setTimeout(() => navigate('/ticket/BKG-20250322-00041'), 2000)
    }, 2000)
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="fixed inset-0 bg-hero-gradient opacity-60" />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center">
              <CheckCircle size={44} className="text-green-400" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Payment Successful!</h2>
          <p className="text-dark-400">Redirecting to your ticket...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="fixed inset-0 bg-hero-gradient opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-glow-blue opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-28 pb-16">

        <Link
          to="/booking/summary"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Summary
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Step 3 of 3
          </p>
          <h1 className="text-4xl font-black text-white">Payment</h1>
          <p className="text-dark-400 mt-1">Choose your payment method</p>
        </motion.div>

        {/* Amount Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="glass rounded-3xl border border-white/8 p-5 mb-6 flex items-center justify-between"
        >
          <div>
            <p className="text-dark-400 text-sm">Amount to Pay</p>
            <p className="text-white font-black text-3xl">₹{AMOUNT}</p>
          </div>
          <div className="text-right">
            <p className="text-dark-400 text-xs mb-1">Booking Ref</p>
            <p className="text-brand-400 font-mono text-xs font-bold">BKG-20250322-00041</p>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="space-y-3 mb-6"
        >
          {METHODS.map(method => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className="w-full glass rounded-2xl p-4 border text-left transition-all duration-300"
              style={{
                borderColor: selected === method.id ? method.border : 'rgba(255,255,255,0.06)',
                background:  selected === method.id ? method.color  : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: method.color, border: `1px solid ${method.border}` }}
                >
                  <method.icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{method.label}</p>
                  <p className="text-dark-400 text-xs">{method.desc}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: selected === method.id ? '#6366f1' : 'rgba(255,255,255,0.2)',
                    background:  selected === method.id ? '#6366f1'  : 'transparent',
                  }}
                >
                  {selected === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        {/* UPI Input */}
        {selected === 'upi' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass rounded-2xl border border-white/8 p-5 mb-6"
          >
            <p className="text-white font-bold text-sm mb-3">Enter UPI ID</p>
            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-2xl text-sm"
            />
            <p className="text-dark-500 text-xs mt-2">
              e.g. name@okaxis, name@ybl, 9876543210@upi
            </p>
          </motion.div>
        )}

        {/* Pay Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <button
            onClick={handlePay}
            disabled={loading}
            className="btn-primary w-full text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-lg disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock size={20} />
                Pay ₹{AMOUNT} Securely
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield size={14} className="text-green-400" />
            <p className="text-dark-500 text-xs">
              256-bit SSL encrypted • Powered by Razorpay
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}