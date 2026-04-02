import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'

// ── Login ──────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(credentials)
      const data = res.data

      // ── Backend access_token ya access dono handle karo ───────────
      const accessToken  = data.access_token  || data.access
      const refreshToken = data.refresh_token || data.refresh
      const user         = data.user          || data

      if (!accessToken) throw new Error('No token received')

      localStorage.setItem('accessToken',  accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      return {
        id:        user.id        || '',
        email:     user.email     || credentials.email,
        full_name: user.full_name || user.name || '',
        phone:     user.phone     || '',
      }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Login failed'
      )
    }
  }
)

// ── Register ───────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data)
      const resData = res.data

      const accessToken  = resData.access_token  || resData.access
      const refreshToken = resData.refresh_token || resData.refresh
      const user         = resData.user          || resData

      if (accessToken) {
        localStorage.setItem('accessToken',  accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      }

      return {
        id:        user.id        || '',
        email:     user.email     || data.email,
        full_name: user.full_name || data.full_name || '',
        phone:     user.phone     || data.phone || '',
      }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        'Registration failed'
      )
    }
  }
)

// ── Logout ─────────────────────────────────────────────────────────────────
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refresh = localStorage.getItem('refreshToken')
      if (refresh) {
        await authAPI.logout({ refresh_token: refresh })
      }
    } catch {}
    finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
)

// ── Slice ──────────────────────────────────────────────────────────────────
const token = localStorage.getItem('accessToken')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoggedIn: !!token,
    user:       null,
    loading:    false,
    error:      null,
  },
  reducers: {
    clearError: state => { state.error = null },
    setUser:    (state, action) => { state.user = action.payload },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginUser.pending, state => {
        state.loading = true
        state.error   = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading   = false
        state.isLoggedIn = true
        state.user      = action.payload
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // Register
    builder
      .addCase(registerUser.pending, state => {
        state.loading = true
        state.error   = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading    = false
        state.isLoggedIn = true
        state.user       = action.payload
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, state => {
        state.isLoggedIn = false
        state.user       = null
        state.loading    = false
      })
  },
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer