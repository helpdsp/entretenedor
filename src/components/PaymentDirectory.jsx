/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:45:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-009
 */

import React, { useState, useEffect } from 'react'
import { paymentService } from '../store/database'
import { Landmark, Calendar, CreditCard, DollarSign } from 'lucide-react'
import { simpleMask } from '../utils/security'

export function PaymentDirectory() {
  const [payments, setPayments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setPayments(paymentService.getAll())
  }, [])

  const filteredPayments = payments.filter(p => 
    p.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bank?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="glass p-4 mb-8">
        <input 
          className="input-field w-full"
          placeholder="Filtrar por nombre de socio o banco..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayments.length > 0 ? (
          filteredPayments.map(payment => (
            <div key={payment.id} className="glass p-6 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Landmark size={20} />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-400">${payment.importe}</span>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{payment.bank || 'Banco No Reg.'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{payment.partner_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CreditCard size={14} />
                  <span className="font-mono">{simpleMask(payment.tarjeta_mask)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-white/5">
                  <Calendar size={12} />
                  <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 glass flex flex-col items-center justify-center text-slate-500">
            <Landmark size={48} className="mb-4 opacity-20" />
            <p>{searchQuery ? 'No se encontraron pagos para esta búsqueda.' : 'No hay registros de cobros o pagos en el sistema.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
