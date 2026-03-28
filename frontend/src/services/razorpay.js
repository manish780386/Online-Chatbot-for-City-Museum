export const loadRazorpay = () => {
  return new Promise(resolve => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export const openRazorpayCheckout = async ({
  orderId,
  amount,
  keyId,
  bookingRef,
  visitorName,
  visitorEmail,
  visitorPhone,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpay()
  if (!loaded) {
    alert('Razorpay failed to load. Check internet connection.')
    return
  }

  const options = {
    key:         keyId,
    amount:      amount,
    currency:    'INR',
    name:        'City Museum',
    description: `Booking ${bookingRef}`,
    order_id:    orderId,
    prefill: {
      name:    visitorName,
      email:   visitorEmail,
      contact: visitorPhone,
    },
    theme: {
      color: '#6366f1',
    },
    modal: {
      ondismiss: () => {
        if (onFailure) onFailure('Payment cancelled by user')
      }
    },
    handler: async (response) => {
      // Payment successful — verify karo backend se
      if (onSuccess) onSuccess(response)
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (response) => {
    if (onFailure) onFailure(response.error.description)
  })
  rzp.open()
}