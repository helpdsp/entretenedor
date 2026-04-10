/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:20:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-003
 */

import React, { useState } from 'react'
import { partnerService } from '../store/database'
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'

export function PartnerForm({ onPartnerCreated, partnerToEdit = null, onCancel }) {
  const [formData, setFormData] = useState(partnerToEdit ? {
    nombres: partnerToEdit.nombres,
    apellido_paterno: partnerToEdit.apellido_paterno,
    apellido_materno: partnerToEdit.apellido_materno,
    email: partnerToEdit.email,
    tipo_cliente: partnerToEdit.tipo_cliente
  } : {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    tipo_cliente: 'SOCIO'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      if (partnerToEdit) {
        partnerService.update(partnerToEdit.id, formData)
        setSuccess('Datos del socio actualizados correctamente.')
      } else {
        const newPartner = partnerService.create(formData)
        setSuccess(`Socio registrado exitosamente con No. ${newPartner.numero_cliente}`)
        setFormData({ nombres: '', apellido_paterno: '', apellido_materno: '', email: '', tipo_cliente: 'SOCIO' })
      }
      if (onPartnerCreated) onPartnerCreated()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="glass p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold">Alta de Nuevo Socio</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Nombre(s)</label>
            <input 
              required
              className="input-field"
              value={formData.nombres}
              onChange={e => setFormData({...formData, nombres: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Apellido Paterno</label>
            <input 
              required
              className="input-field"
              value={formData.apellido_paterno}
              onChange={e => setFormData({...formData, apellido_paterno: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Apellido Materno</label>
            <input 
              className="input-field"
              value={formData.apellido_materno}
              onChange={e => setFormData({...formData, apellido_materno: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Tipo de Cliente</label>
            <select 
              className="input-field cursor-pointer"
              value={formData.tipo_cliente}
              onChange={e => setFormData({...formData, tipo_cliente: e.target.value})}
            >
              <option value="SOCIO">Socio Regular</option>
              <option value="ACTIVACION">Activación</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Email</label>
          <input 
            type="email"
            required
            className="input-field w-full"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition-all border border-white/5 h-14"
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary flex-1 py-4 text-lg h-14">
            {partnerToEdit ? 'Guardar Cambios' : 'Registrar Socio'}
          </button>
        </div>
      </form>
    </div>
  )
}
