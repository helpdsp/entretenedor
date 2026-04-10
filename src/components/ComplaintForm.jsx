/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:35:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-006
 */

import React, { useState } from 'react'
import { complaintService, partnerService } from '../store/database'
import { ClipboardList, CheckCircle2, Search } from 'lucide-react'

export function ComplaintForm({ onCancel }) {
  const [partnerQuery, setPartnerQuery] = useState('')
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [complaintType, setComplaintType] = useState('Mal Servicio')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState('')

  const handleSearchPartner = () => {
    const results = partnerService.search(partnerQuery)
    if (results.length > 0) {
      setSelectedPartner(results[0])
      setSuccess('')
    } else {
      alert('Socio no encontrado')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedPartner) return alert('Debes seleccionar un socio primero')

    const newComplaint = complaintService.create({
      partner_id: selectedPartner.id,
      tipo_queja: complaintType,
      descripcion: description
    })

    setSuccess(`Queja registrada con Folio: ${newComplaint.folio}`)
    setDescription('')
    setSelectedPartner(null)
    setPartnerQuery('')
  }

  return (
    <div className="glass p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="text-orange-500" size={28} />
        <h2 className="text-2xl font-bold">Registro de Queja</h2>
      </div>

      {!selectedPartner ? (
        <div className="space-y-4 mb-6">
          <label className="text-sm font-medium text-slate-400">Buscar Socio por No. o Nombre</label>
          <div className="flex gap-2">
            <input 
              className="input-field flex-1"
              value={partnerQuery}
              onChange={e => setPartnerQuery(e.target.value)}
              placeholder="Ej. 1001 o Juan Pérez"
            />
            <button onClick={handleSearchPartner} className="btn-primary px-4">
              <Search size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-400 font-bold uppercase">Socio Seleccionado</p>
            <p className="font-bold">{selectedPartner.nombres} {selectedPartner.apellido_paterno} (No. {selectedPartner.numero_cliente})</p>
          </div>
          <button onClick={() => setSelectedPartner(null)} className="text-xs underline text-slate-400">Cambiar</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Tipo de Queja</label>
          <select 
            className="input-field"
            value={complaintType}
            onChange={e => setComplaintType(e.target.value)}
          >
            <option>Mal Servicio</option>
            <option>Descuento no aplicado</option>
            <option>Paquete no recibido</option>
            <option>Error en Cobro</option>
            <option>Otros</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Descripción del Descontento</label>
          <textarea 
            required
            rows={4}
            className="input-field w-full resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalle la situación reportada por el socio..."
          />
        </div>

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
          <button type="submit" className="btn-primary flex-1 py-4 text-lg h-14 bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/20">
            Generar Folio de Queja
          </button>
        </div>
      </form>
    </div>
  )
}
