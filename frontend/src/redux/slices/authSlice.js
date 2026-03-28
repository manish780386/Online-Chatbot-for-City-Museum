import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'

// ── Async Thunks ──────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data)
      return res.data
    } catch (err) {
      const errors = err.response?.data
      const msg    = typeof errors === 'object'
        ? Object.values(errors).flat().join(', ')
        : 'Registration failed'
      return rejectWithValue(msg)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const refresh = localStorage.getItem('refreshToken')
      await authAPI.logout({ refresh_token: refresh })
    } catch { }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
)

// ── Slice ─────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    accessToken: localStorage.getItem('accessToken')  || null,
    isLoggedIn:  !!localStorage.getItem('accessToken'),
    loading:     false,
    error:       null,
  },
  reducers: {
    clearError: state => { state.error = null },
    setCredentials: (state, { payload }) => {
      state.user        = payload.user
      state.accessToken = payload.access_token
      state.isLoggedIn  = true
      localStorage.setItem('accessToken',  payload.access_token)
      localStorage.setItem('refreshToken', payload.refresh_token)
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginUser.pending,    state => { state.loading = true;  state.error = null })
      .addCase(loginUser.fulfilled,  (state, { payload }) => {
        state.loading    = false
        state.user       = payload.user
        state.accessToken = payload.access_token
        state.isLoggedIn = true
        localStorage.setItem('accessToken',  payload.access_token)
        localStorage.setItem('refreshToken', payload.refresh_token)
      })
      .addCase(loginUser.rejected,   (state, { payload }) => {
        state.loading = false
        state.error   = payload
      })

    // Register
    builder
      .addCase(registerUser.pending,   state => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading    = false
        state.user       = payload.user
        state.accessToken = payload.access_token
        state.isLoggedIn = true
        localStorage.setItem('accessToken',  payload.access_token)
        localStorage.setItem('refreshToken', payload.refresh_token)
      })
      .addCase(registerUser.rejected,  (state, { payload }) => {
        state.loading = false
        state.error   = payload
      })

    // Logout
    builder.addCase(logoutUser.fulfilled, state => {
      state.user        = null
      state.accessToken = null
      state.isLoggedIn  = false
    })
  },
})

export const { clearError, setCredentials } = authSlice.actions
export default authSlice.reducer