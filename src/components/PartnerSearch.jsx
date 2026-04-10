/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:25:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-004
 */

import React, { useState, useEffect } from 'react'
import { partnerService } from '../store/database'
import { Search, User, Mail, Hash } from 'lucide-react'

export function PartnerSearch({ onEdit }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (query.length > 0) {
      setResults(partnerService.search(query))
    } else {
      setResults(partnerService.getAll())
    }
  }, [query])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          className="input-field w-full pl-12 h-14 text-lg"
          placeholder="Buscar por nombre, apellido o No. de cliente..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.length > 0 ? (
          results.map(partner => (
            <div key={partner.id} className="glass p-5 flex items-start gap-4 hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate group-hover:text-blue-400 transition-colors">
                  {partner.nombres} {partner.apellido_paterno}
                </h3>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Hash size={14} />
                    <span>No. Cliente: {partner.numero_cliente}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 truncate">
                    <Mail size={14} />
                    <span>{partner.email}</span>
                  </div>
                </div>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(partner)}
                    className="mt-4 text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold ${partner.tipo_cliente === 'SOCIO' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {partner.tipo_cliente}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 italic">
            No se encontraron socios que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}
