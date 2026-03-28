import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, X, Save } from 'lucide-react'
import { showsAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminShows() {
  const [shows,        setShows]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [editShow,     setEditShow]     = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding,       setAdding]       = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // show jo delete hoga
  const [newShow,      setNewShow]      = useState({
    name:           '',
    category:       'general',
    date:           '',
    start_time:     '',
    end_time:       '',
    price_adult:    150,
    price_child:    75,
    total_capacity: 100,
    description:    '',
    is_active:      true,
  })

  useEffect(() => { fetchShows() }, [])

  const fetchShows = () => {
    setLoading(true)
    showsAPI.getAll()
      .then(res => {
        const data = res.data.results || res.data
        setShows(data.map((s, i) => ({
          id:          s.id,
          emoji:       ['🏺','🎨','🌙','🦕'][i % 4],
          name:        s.name,
          category:    s.category,
          date:        s.date,
          start_time:  s.start_time,
          end_time:    s.end_time,
          price_adult: Number(s.price_adult),
          price_child: Number(s.price_child),
          capacity:    s.total_capacity,
          booked:      s.booked_count,
          is_active:   s.is_active,
          status:      s.is_active ? 'active' : 'inactive',
        })))
      })
      .catch(() => toast.error('Failed to load shows'))
      .finally(() => setLoading(false))
  }

  const handleToggleStatus = async (show) => {
    try {
      await showsAPI.update(show.id, { is_active: !show.is_active })
      toast.success(`Show ${show.is_active ? 'deactivated' : 'activated'}!`)
      fetchShows()
    } catch (err) {
      console.error('Toggle error:', err.response?.data)
      toast.error('Failed to update show status')
    }
  }

  const handleSaveEdit = async () => {
    if (!editShow) return
    setSaving(true)
    try {
      await showsAPI.update(editShow.id, {
        name:           editShow.name,
        date:           editShow.date,
        start_time:     editShow.start_time,
        end_time:       editShow.end_time,
        price_adult:    editShow.price_adult,
        price_child:    editShow.price_child,
        total_capacity: editShow.capacity,
      })
      toast.success('Show updated!')
      setEditShow(null)
      fetchShows()
    } catch (err) {
      console.error('Save error:', err.response?.data)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddShow = async () => {
    if (!newShow.name || !newShow.date || !newShow.start_time || !newShow.end_time) {
      toast.error('Please fill all required fields!')
      return
    }
    setAdding(true)
    try {
      await showsAPI.create(newShow)
      toast.success('Show created successfully! 🎉')
      setShowAddModal(false)
      setNewShow({
        name: '', category: 'general', date: '',
        start_time: '', end_time: '',
        price_adult: 150, price_child: 75,
        total_capacity: 100, description: '', is_active: true,
      })
      fetchShows()
    } catch (err) {
      console.error('Create error:', err.response?.data)
      toast.error(err.response?.data?.error || 'Failed to create show')
    } finally {
      setAdding(false)
    }
  }

  // ── Delete confirm karne ke baad call hoga ──────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await showsAPI.delete(confirmDelete.id)
      toast.success(`"${confirmDelete.name}" deleted successfully!`)
      setConfirmDelete(null)
      fetchShows()
    } catch (err) {
      console.error('Delete error:', err.response?.data)
      toast.error('Failed to delete show')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h2 className="text-white font-black text-2xl">Manage Shows</h2>
          <p className="text-dark-400 text-sm mt-1">{shows.length} shows configured</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchShows}
            className="glass-light border border-white/10 text-dark-300 hover:text-white p-3 rounded-2xl transition-all hover:bg-white/5"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-white text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-button"
          >
            <Plus size={16} /> Add Show
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Shows',   value: shows.filter(s => s.is_active).length,     color: 'text-green-400',  border: 'border-green-500/20'  },
          { label: 'Total Capacity', value: shows.reduce((a, s) => a + s.capacity, 0), color: 'text-brand-400',  border: 'border-brand-500/20'  },
          { label: 'Total Booked',   value: shows.reduce((a, s) => a + s.booked, 0),   color: 'text-purple-400', border: 'border-purple-500/20' },
        ].map((s, i) => (
          <div key={i} className={`glass rounded-2xl p-5 border ${s.border} text-center`}>
            <p className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</p>
            <p className="text-dark-400 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass rounded-3xl border border-red-500/20 p-6 w-full max-w-sm shadow-card relative overflow-hidden"
          >
            {/* Red top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-3xl" />

            {/* Warning Icon */}
            <div className="flex flex-col items-center text-center mb-6 mt-2">
              <div className="w-16 h-16 bg-red-500/15 border border-red-500/25 rounded-full flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              <h3 className="text-white font-black text-xl mb-2">Delete Show?</h3>
              <p className="text-dark-400 text-sm leading-relaxed">
                You are about to delete
              </p>
              <p className="text-white font-bold text-base mt-1">
                {confirmDelete.emoji} {confirmDelete.name}
              </p>
              {confirmDelete.booked > 0 && (
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-2.5 w-full">
                  <p className="text-yellow-400 text-xs font-semibold">
                    ⚠️ This show has {confirmDelete.booked} active bookings!
                  </p>
                  <p className="text-yellow-400/70 text-xs mt-0.5">
                    Deleting will affect existing bookings.
                  </p>
                </div>
              )}
              <p className="text-dark-500 text-xs mt-3">This action cannot be undone.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 glass-light border border-white/10 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── ADD SHOW MODAL ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-6 w-full max-w-md shadow-card relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-brand-500 to-purple-500 rounded-t-3xl" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-black text-xl">Add New Show</h3>
                <p className="text-dark-400 text-xs mt-0.5">Fill details to create a new show</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 glass-light rounded-xl flex items-center justify-center text-dark-400 hover:text-white transition-colors border border-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Show Name *</label>
                <input type="text" placeholder="e.g. Ancient India Exhibition" value={newShow.name}
                  onChange={e => setNewShow(prev => ({ ...prev, name: e.target.value }))}
                  className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
              </div>
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Category *</label>
                <select value={newShow.category}
                  onChange={e => setNewShow(prev => ({ ...prev, category: e.target.value }))}
                  className="input-dark w-full px-4 py-3 rounded-2xl text-sm"
                  style={{ background: 'rgba(15,23,42,0.9)', color: 'white' }}>
                  <option value="general"    style={{ background: '#0f172a' }}>🏺 General Entry</option>
                  <option value="exhibition" style={{ background: '#0f172a' }}>🎨 Exhibition</option>
                  <option value="night_show" style={{ background: '#0f172a' }}>🌙 Night Show</option>
                  <option value="special"    style={{ background: '#0f172a' }}>🦕 Special / Dinosaur</option>
                </select>
              </div>
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea placeholder="Short description..." value={newShow.description}
                  onChange={e => setNewShow(prev => ({ ...prev, description: e.target.value }))}
                  rows={2} className="input-dark w-full px-4 py-3 rounded-2xl text-sm resize-none" />
              </div>
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Date *</label>
                <input type="date" value={newShow.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewShow(prev => ({ ...prev, date: e.target.value }))}
                  className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Start Time *</label>
                  <input type="time" value={newShow.start_time}
                    onChange={e => setNewShow(prev => ({ ...prev, start_time: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
                </div>
                <div>
                  <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">End Time *</label>
                  <input type="time" value={newShow.end_time}
                    onChange={e => setNewShow(prev => ({ ...prev, end_time: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Adult Price (₹)</label>
                  <input type="number" value={newShow.price_adult} min="0"
                    onChange={e => setNewShow(prev => ({ ...prev, price_adult: Number(e.target.value) }))}
                    className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
                </div>
                <div>
                  <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Child Price (₹)</label>
                  <input type="number" value={newShow.price_child} min="0"
                    onChange={e => setNewShow(prev => ({ ...prev, price_child: Number(e.target.value) }))}
                    className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Total Capacity</label>
                <input type="number" value={newShow.total_capacity} min="1"
                  onChange={e => setNewShow(prev => ({ ...prev, total_capacity: Number(e.target.value) }))}
                  className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
              </div>
              <div className="flex items-center justify-between glass-light rounded-2xl px-4 py-3 border border-white/5">
                <div>
                  <p className="text-white text-sm font-semibold">Active Show</p>
                  <p className="text-dark-500 text-xs">Visible to users immediately</p>
                </div>
                <button
                  onClick={() => setNewShow(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${newShow.is_active ? 'bg-brand-500' : 'bg-dark-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${newShow.is_active ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 glass-light border border-white/10 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleAddShow} disabled={adding}
                className="flex-1 btn-primary text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-button">
                {adding ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                ) : (
                  <><Plus size={15} /> Create Show</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────────── */}
      {editShow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setEditShow(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-6 w-full max-w-md shadow-card relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 rounded-t-3xl" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-black text-xl">Edit Show</h3>
                <p className="text-dark-400 text-xs mt-0.5">{editShow.name}</p>
              </div>
              <button onClick={() => setEditShow(null)}
                className="w-8 h-8 glass-light rounded-xl flex items-center justify-center text-dark-400 hover:text-white transition-colors border border-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[
                { label: 'Show Name',       key: 'name',        type: 'text'   },
                { label: 'Date',            key: 'date',        type: 'date'   },
                { label: 'Start Time',      key: 'start_time',  type: 'time'   },
                { label: 'End Time',        key: 'end_time',    type: 'time'   },
                { label: 'Adult Price (₹)', key: 'price_adult', type: 'number' },
                { label: 'Child Price (₹)', key: 'price_child', type: 'number' },
                { label: 'Total Capacity',  key: 'capacity',    type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">{field.label}</label>
                  <input type={field.type} value={editShow[field.key] || ''}
                    onChange={e => setEditShow(prev => ({
                      ...prev,
                      [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value
                    }))}
                    className="input-dark w-full px-4 py-3 rounded-2xl text-sm" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditShow(null)}
                className="flex-1 glass-light border border-white/10 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 btn-primary text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-button">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={15} /> Save Changes</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Shows Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass rounded-3xl p-6 border border-white/5 animate-pulse">
              <div className="flex gap-3 mb-5">
                <div className="w-14 h-14 shimmer-bg rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 shimmer-bg rounded-full w-3/4" />
                  <div className="h-3 shimmer-bg rounded-full w-1/2" />
                  <div className="h-3 shimmer-bg rounded-full w-2/3" />
                </div>
              </div>
              <div className="h-2 shimmer-bg rounded-full mb-5" />
              <div className="flex justify-between items-center">
                <div className="h-8 shimmer-bg rounded-xl w-20" />
                <div className="flex gap-2">
                  <div className="h-9 shimmer-bg rounded-xl w-16" />
                  <div className="h-9 shimmer-bg rounded-xl w-24" />
                  <div className="h-9 shimmer-bg rounded-xl w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div className="glass rounded-3xl p-16 border border-white/5 text-center">
          <p className="text-5xl mb-4">🎭</p>
          <p className="text-white font-bold text-xl mb-2">No shows found</p>
          <button onClick={() => setShowAddModal(true)}
            className="btn-primary text-white text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-2 mx-auto mt-4">
            <Plus size={15} /> Create First Show
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shows.map((show, i) => {
            const pct = show.capacity > 0 ? Math.round((show.booked / show.capacity) * 100) : 0
            return (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07 } }}
                className="glass rounded-3xl p-6 border border-white/5 hover:border-brand-500/20 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 glass-light rounded-2xl flex items-center justify-center text-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
                      {show.emoji}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">{show.name}</h3>
                      <p className="text-brand-400 text-xs font-medium capitalize mt-0.5">{show.category}</p>
                      <p className="text-dark-500 text-xs mt-1">
                        📅 {show.date} &nbsp;•&nbsp; ⏰ {show.start_time?.slice(0,5)} – {show.end_time?.slice(0,5)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ${
                    show.is_active
                      ? 'bg-green-500/15 text-green-400 border-green-500/25'
                      : 'bg-red-500/15 text-red-400 border-red-500/25'
                  }`}>
                    {show.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-dark-400 font-medium">Occupancy</span>
                    <span className="text-white font-bold">
                      {show.booked}/{show.capacity}
                      <span className={`ml-1.5 ${pct > 80 ? 'text-red-400' : 'text-brand-400'}`}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-dark-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        background: pct > 80
                          ? 'linear-gradient(90deg, #ef4444, #f97316)'
                          : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-white font-black text-2xl">₹{show.price_adult}</p>
                      <p className="text-dark-500 text-xs">adult</p>
                    </div>
                    <p className="text-dark-500 text-xs mt-0.5">Child ₹{show.price_child}</p>
                  </div>

                  <div className="flex gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => setEditShow({ ...show })}
                      className="flex items-center gap-1.5 glass-light border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/50 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>

                    {/* Activate / Deactivate */}
                    <button
                      onClick={() => handleToggleStatus(show)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 border ${
                        show.is_active
                          ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50'
                      }`}
                    >
                      {show.is_active ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          Deactivate
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>
                          </svg>
                          Activate
                        </>
                      )}
                    </button>

                    {/* ── DELETE BUTTON ── */}
                    <button
                      onClick={() => setConfirmDelete(show)}
                      disabled={deletingId === show.id}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl transition-all duration-200 border border-red-500/25 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 disabled:opacity-50"
                      title="Delete show"
                    >
                      {deletingId === show.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}