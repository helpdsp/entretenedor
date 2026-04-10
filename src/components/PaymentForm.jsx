/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:55:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-007
 */

import React, { useState } from 'react'
import { CreditCard, Lock, CheckCircle2, Search } from 'lucide-react'
import { simpleMask } from '../utils/security'
import { paymentService, partnerService } from '../store/database'

export function PaymentForm({ onCancel }) {
  const [partnerQuery, setPartnerQuery] = useState('')
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [card, setCard] = useState('')
  const [amount, setAmount] = useState('')
  const [bank, setBank] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSearchPartner = () => {
    const results = partnerService.search(partnerQuery)
    if (results.length > 0) {
      setSelectedPartner(results[0])
    } else {
      alert('Socio no encontrado')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedPartner) return alert('Debes seleccionar un socio primero')
    
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return alert('El importe debe ser un número positivo')
    }

    // Registro real en la base de datos
    paymentService.create({
      partner_id: selectedPartner.id,
      bank,
      importe: numericAmount,
      tarjeta_mask: card // El servicio o el directorio se encargan del masking visual
    })

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="glass p-12 text-center flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold">Pago Registrado Exitosamente</h2>
        <p className="text-slate-400">La transacción ha sido guardada y ahora es visible en el Historial de Pagos.</p>
        <div className="mt-4 p-4 bg-white/5 rounded-lg w-full text-left">
          <p className="text-xs text-slate-500 uppercase font-bold">Resumen del Socio</p>
          <p className="font-bold">{selectedPartner.nombres} {selectedPartner.apellido_paterno}</p>
          <p className="font-mono mt-2">Importe: ${amount}</p>
        </div>
        <button onClick={() => {setSuccess(false); setCard(''); setAmount(''); setBank(''); setSelectedPartner(null); setPartnerQuery('')}} className="btn-primary mt-6">
          Registrar otro Pago
        </button>
      </div>
    )
  }

  return (
    <div className="glass p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
          <CreditCard size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Registro de Cobro</h2>
          <p className="text-xs text-slate-400">Vincular pago a cuenta de socio</p>
        </div>
      </div>

      {!selectedPartner ? (
        <div className="space-y-4 mb-8 pb-8 border-b border-white/5">
          <label className="text-sm font-medium text-slate-400">1. Buscar Socio</label>
          <div className="flex gap-2">
            <input 
              className="input-field flex-1"
              value={partnerQuery}
              onChange={e => setPartnerQuery(e.target.value)}
              placeholder="Nombre o No. Cliente"
            />
            <button onClick={handleSearchPartner} className="btn-primary px-4 bg-slate-700 shadow-none">
              <Search size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-8 flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-400 font-bold uppercase">Socio para Cobro</p>
            <p className="font-bold">{selectedPartner.nombres} (No. {selectedPartner.numero_cliente})</p>
          </div>
          <button onClick={() => setSelectedPartner(null)} className="text-xs underline text-slate-400">Cambiar</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Banco Emisor</label>
          <input 
            required
            className="input-field"
            placeholder="Ej. Banamex, HSBC"
            value={bank}
            onChange={e => setBank(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Número de Tarjeta</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              required
              maxLength={16}
              className="input-field w-full pl-10 font-mono"
              placeholder="0000 0000 0000 0000"
              value={card}
              onChange={e => setCard(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Importe (MXN)</label>
          <input 
            required
            type="number"
            step="0.01"
            className="input-field text-2xl font-bold text-green-400"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition-all border border-white/5"
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary flex-1 py-4 text-lg">
            Confirmar y Guardar Pago
          </button>
        </div>
      </form>
    </div>
  )
}
