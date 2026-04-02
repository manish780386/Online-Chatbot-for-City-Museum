import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — token attach karo ────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ── Response interceptor — 401 pe token refresh karo ──────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken
        })

        const newAccess = res.data.access
        localStorage.setItem('accessToken', newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)

      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  register: data => api.post('/auth/register/', data),
  login:    data => api.post('/auth/login/',    data),
  logout:   data => api.post('/auth/logout/',   data),
  profile:  ()   => api.get('/auth/profile/'),
  analytics:()   => api.get('/auth/analytics/'),
}

// ── Shows API ──────────────────────────────────────────────────────────────
export const showsAPI = {
  getAll:  params     => api.get('/shows/',         { params }),
  getById: id         => api.get(`/shows/${id}/`),
  create:  data       => api.post('/shows/create/', data),
  update:  (id, data) => api.patch(`/shows/${id}/`, data),
  delete:  id         => api.delete(`/shows/${id}/`),
}

// ── Bookings API ───────────────────────────────────────────────────────────
export const bookingsAPI = {
  create:   data => api.post('/bookings/',          data),
  getMyAll: ()   => api.get('/bookings/my/'),
  getByRef: ref  => api.get(`/bookings/${ref}/`),
  cancel:   ref  => api.delete(`/bookings/${ref}/cancel/`),
}

// ── Payment API ────────────────────────────────────────────────────────────
export const paymentAPI = {
  verify:  data => api.post('/payments/verify/',  data),
  webhook: data => api.post('/payments/webhook/', data),
  refund:  data => api.post('/payments/refund/',  data),
}

// ── Feedback API ───────────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: data => api.post('/auth/feedback/',      data),
  getAll: ()   => api.get('/auth/feedback/list/'),
}

// ── Profile API ────────────────────────────────────────────────────────────
export const profileAPI = {
  get:    ()   => api.get('/auth/profile/'),
  update: data => api.patch('/auth/profile/', data),
}
// ── Analytics API ─────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: () => api.get('/auth/analytics/'),
}