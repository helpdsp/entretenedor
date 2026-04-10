/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-10T00:15:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-020
 */

import React, { useState, useEffect } from 'react'
import { userService } from '../store/database'
import { UserPlus, Shield, User, Key, AlertCircle } from 'lucide-react'

export function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'OPERADOR' })
  const [error, setError] = useState('')

  useEffect(() => {
    setUsers(userService.getAll())
  }, [])

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="glass p-12 text-center flex flex-col items-center gap-4">
        <Shield size={48} className="text-red-500 opacity-50" />
        <h2 className="text-xl font-bold">Acceso Restringido</h2>
        <p className="text-slate-400">Solo los administradores pueden gestionar usuarios del sistema.</p>
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      userService.create(formData)
      setUsers(userService.getAll())
      setShowForm(false)
      setFormData({ name: '', username: '', password: '', role: 'OPERADOR' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-slate-400 text-sm">Control de acceso y roles del personal</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <div className="glass p-8 animate-slideDown">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nombre Completo</label>
              <input 
                required
                className="input-field"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nombre de Usuario</label>
              <input 
                required
                className="input-field"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Contraseña</label>
              <input 
                required
                type="password"
                className="input-field"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Rol de Sistema</label>
              <select 
                className="input-field"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="OPERADOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            {error && <div className="md:col-span-2 text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary px-8">Crear Usuario</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="glass p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${u.role === 'ADMIN' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                <User size={20} />
              </div>
              <div>
                <div className="font-bold">{u.name}</div>
                <div className="text-xs text-slate-500">@{u.username}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {u.role}
              </span>
              {u.id.includes('admin') && <span className="text-[10px] text-slate-600 font-bold">SISTEMA</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
