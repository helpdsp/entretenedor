/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-10T00:10:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-019
 */

import React, { useState } from 'react'
import { LogIn, Lock, User, AlertCircle } from 'lucide-react'
import { userService } from '../store/database'

export function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = userService.login(username, password)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center text-blue-500 mx-auto shadow-2xl border border-blue-500/20 mb-6 group hover:scale-105 transition-transform">
            <LogIn size={40} className="group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema Entretenedor</h1>
          <p className="text-slate-400 mt-2">Bienvenido de nuevo. Por favor inicia sesión.</p>
        </div>

        <div className="glass p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 pl-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  autoFocus
                  required
                  className="input-field w-full pl-12 h-14"
                  placeholder="admin / op01"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 pl-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type="password"
                  className="input-field w-full pl-12 h-14"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg animate-shake">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-4 text-lg font-bold shadow-blue-500/20 hover:shadow-blue-500/40 translate-y-0 active:translate-y-1 transition-all">
              Entrar al Sistema
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-xs text-slate-600 uppercase tracking-widest font-bold">
          ICONOS &bull; Security Protocol v2.4
        </p>
      </div>
    </div>
  )
}
