/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:50:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-010
 */

import React, { useState, useEffect } from 'react'
import { complaintService } from '../store/database'
import { ClipboardList, AlertCircle, Clock, User } from 'lucide-react'

export function ComplaintDirectory() {
  const [complaints, setComplaints] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Todos')

  useEffect(() => {
    setComplaints(complaintService.getAll())
  }, [])

  const filteredComplaints = complaints.filter(c => {
    const matchesPartner = c.partner_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'Todos' || c.tipo_queja === typeFilter;
    return matchesPartner && matchesType;
  })

  const handleStatusChange = (id, newStatus) => {
    try {
      complaintService.update(id, { estatus: newStatus });
      setComplaints(complaintService.getAll());
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-4 mb-8 flex flex-col md:flex-row gap-4">
        <input 
          className="input-field flex-1"
          placeholder="Filtrar por nombre de socio..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select 
          className="input-field"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="Todos">Todas las Categorías</option>
          <option>Mal Servicio</option>
          <option>Descuento no aplicado</option>
          <option>Paquete no recibido</option>
          <option>Error en Cobro</option>
          <option>Otros</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map(complaint => (
            <div key={complaint.id} className="glass p-6 hover:bg-white/5 transition-colors border-l-4 border-l-orange-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold font-mono">
                      {complaint.folio}
                    </span>
                    <h3 className="font-bold text-lg">{complaint.tipo_queja}</h3>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2">{complaint.descripcion}</p>
                </div>
                
                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User size={16} className="text-blue-500" />
                    <span>{complaint.partner_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} />
                    <span>Registrada: {new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2">
                    <select 
                      value={complaint.estatus}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className="px-3 py-1 bg-slate-800 text-slate-200 text-[10px] font-bold uppercase rounded border border-white/10 outline-none focus:border-orange-500/50"
                    >
                      <option value="ABIERTA">Abierta</option>
                      <option value="SEGUIMIENTO">En Seguimiento</option>
                      <option value="CERRADA">Cerrada</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 glass flex flex-col items-center justify-center text-slate-500">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p>{searchQuery || typeFilter !== 'Todos' ? 'No se encontraron quejas coincidentes.' : 'No hay quejas registradas actualmente.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
