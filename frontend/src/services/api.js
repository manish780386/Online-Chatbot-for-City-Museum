import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})


// ── Request interceptor — JWT token add karo ──────────────────────────
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// ── Response interceptor — 401 pe auto logout ─────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config

    // Access token expire — refresh karo
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refreshToken')
        if (refresh) {
          const res = await axios.post(
            'http://localhost:8000/api/v1/auth/refresh/',
            { refresh }
          )
          const newToken = res.data.access
          localStorage.setItem('accessToken', newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        }
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth APIs ─────────────────────────────────────────────────────────
export const authAPI = {
  register: data  => api.post('/auth/register/', data),
  login:    data  => api.post('/auth/login/',    data),
  logout:   data  => api.post('/auth/logout/',   data),
  profile:  ()    => api.get('/auth/profile/'),
}

// ── Shows APIs ────────────────────────────────────────────────────────
export const showsAPI = {
  getAll:  params     => api.get('/shows/',         { params }),
  getById: id         => api.get(`/shows/${id}/`),
  create:  data       => api.post('/shows/create/', data),
  update:  (id, data) => api.patch(`/shows/${id}/`, data),
  delete:  id         => api.delete(`/shows/${id}/`),
}

// ── Bookings APIs ─────────────────────────────────────────────────────
export const bookingsAPI = {
  create:   data => api.post('/bookings/',              data),
  getMyAll: ()   => api.get('/bookings/my/'),
  getByRef: ref  => api.get(`/bookings/${ref}/`),
  cancel:   ref  => api.delete(`/bookings/${ref}/cancel/`),
}

// ── Payment APIs ──────────────────────────────────────────────────────
export const paymentAPI = {
  verify: data => api.post('/payments/verify/', data),
  refund: data => api.post('/payments/refund/', data),
}

// ── Analytics API ─────────────────────────────────────────────────────
export const analyticsAPI = {
  get: () => api.get('/auth/analytics/'),
}

export default api