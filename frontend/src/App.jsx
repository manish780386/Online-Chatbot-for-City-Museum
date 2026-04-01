import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home           from './pages/Home.jsx'
import Login          from './pages/Login.jsx'
import MyBookings     from './pages/MyBookings.jsx'
import TicketPage     from './pages/TicketPage.jsx'
import BookingSummary from './pages/BookingSummary.jsx'
import PaymentPage    from './pages/PaymentPage.jsx'
import NotFound       from './pages/NotFound.jsx'
import Profile        from './pages/Profile.jsx'

import AdminLogin    from './pages/admin/AdminLogin.jsx'
import AdminLayout   from './pages/admin/AdminLayout.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminBookings from './pages/admin/AdminBookings.jsx'
import AdminShows    from './pages/admin/AdminShows.jsx'
import AdminRevenue  from './pages/admin/AdminRevenue.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   '#1e293b',
            color:        '#f1f5f9',
            border:       '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize:     '14px',
          },
          success: { iconTheme: { primary: '#818cf8', secondary: '#0f172a' } },
        }}
      />
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/"                   element={<Home />}          />
        <Route path="/login"              element={<Login />}         />
        <Route path="/profile"            element={<Profile />}       />
        <Route path="/my-bookings"        element={<MyBookings />}    />
        <Route path="/ticket/:bookingRef" element={<TicketPage />}    />
        <Route path="/booking/summary"    element={<BookingSummary />}/>
        <Route path="/payment"            element={<PaymentPage />}   />

        {/* ── Admin Login — AdminLayout se pehle ── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin Panel ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index           element={<AdminOverview />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="shows"    element={<AdminShows />}    />
          <Route path="revenue"  element={<AdminRevenue />}  />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}