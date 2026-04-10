/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:12:00Z
 * @agent_roles engineering-frontend-developer
 * @vision_command start_sprint --sprint 1
 * @task_id T-001
 */

import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Users, CreditCard, ClipboardList, Settings, UserPlus, Landmark, AlertCircle, LogIn } from 'lucide-react'
import { PartnerForm } from './components/PartnerForm'
import { PartnerSearch } from './components/PartnerSearch'
import { ComplaintForm } from './components/ComplaintForm'
import { PaymentForm } from './components/PaymentForm'
import { PaymentDirectory } from './components/PaymentDirectory'
import { ComplaintDirectory } from './components/ComplaintDirectory'
import { LoginForm } from './components/LoginForm'
import { UserManagement } from './components/UserManagement'

import { partnerService, paymentService, complaintService, userService } from './store/database'

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [partnerToEdit, setPartnerToEdit] = useState(null)
  const [stats, setStats] = useState({ partners: 0, payments: 0, complaints: 0 })

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      try {
        const allPartners = partnerService.getAll() || []
        const allPayments = paymentService.getAll() || []
        const allComplaints = complaintService.getAll() || []
        
        setStats({
          partners: allPartners.length || 0,
          payments: allPayments.length || 0,
          complaints: (allComplaints || []).filter(c => c && c.estatus !== 'CERRADA').length
        })
      } catch (err) {
        console.error("Dashboard data load error:", err)
      }
    }
  }, [activeTab])

  const handleCancel = () => {
    setPartnerToEdit(null)
    setActiveTab('dashboard')
  }

  const handleEditPartner = (partner) => {
    setPartnerToEdit(partner)
    setActiveTab('edit-partner')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Socios" value={stats.partners.toLocaleString()} change="Afiliados Activos" />
              <StatCard title="Pagos Registrados" value={stats.payments.toLocaleString()} change="Historial Completo" />
              <StatCard title="Quejas Abiertas" value={stats.complaints.toLocaleString()} change="Pendientes de Cierre" />
            </div>
            <section className="mt-12 glass p-6 h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                <LayoutDashboard size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Bienvenido al Sistema Entretenedor</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Utiliza el menú lateral para gestionar afiliados, registrar cobros y dar seguimiento a quejas de servicio.
              </p>
            </section>
          </>
        )
      case 'partners':
        return <PartnerSearch onEdit={handleEditPartner} />
      case 'new-partner':
        return <PartnerForm onPartnerCreated={() => setActiveTab('partners')} onCancel={handleCancel} />
      case 'edit-partner':
        return <PartnerForm partnerToEdit={partnerToEdit} onPartnerCreated={() => { setPartnerToEdit(null); setActiveTab('partners'); }} onCancel={handleCancel} />
      case 'finances':
        return <PaymentForm onCancel={handleCancel} />
      case 'payments-dir':
        return <PaymentDirectory />
      case 'complaints':
        return <ComplaintForm onCancel={handleCancel} />
      case 'complaints-dir':
        return <ComplaintDirectory />
      case 'settings':
        return <UserManagement currentUser={user} />
      default:
        return <div>Módulo en desarrollo</div>
    }
  }

  try {
    if (!user) {
      return <LoginForm onLogin={setUser} />
    }

    return (
      <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      {/* Sidebar */}
      <aside className="w-72 glass m-4 mr-0 flex flex-col py-8 shadow-2xl">
        <div className="px-8 text-2xl font-bold mb-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">E</div>
          <span className="tracking-tight">Entretenedor</span>
        </div>
        
        <nav className="flex flex-col gap-1 w-full px-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-4">General</div>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Resumen" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-4">Socios</div>
          <NavItem 
            icon={<Users size={18} />} 
            label="Directorio" 
            active={activeTab === 'partners'} 
            onClick={() => setActiveTab('partners')}
          />
          <NavItem 
            icon={<UserPlus size={18} />} 
            label="Nueva Alta" 
            active={activeTab === 'new-partner'} 
            onClick={() => setActiveTab('new-partner')}
          />
          
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-4">Finanzas</div>
          <NavItem 
            icon={<CreditCard size={18} />} 
            label="Nuevo Pago" 
            active={activeTab === 'finances'} 
            onClick={() => setActiveTab('finances')}
          />
          <NavItem 
            icon={<Landmark size={18} />} 
            label="Historial Pagos" 
            active={activeTab === 'payments-dir'} 
            onClick={() => setActiveTab('payments-dir')}
          />
          
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-4">Atención</div>
          <NavItem 
            icon={<ClipboardList size={18} />} 
            label="Nueva Queja" 
            active={activeTab === 'complaints'} 
            onClick={() => setActiveTab('complaints')}
          />
          <NavItem 
            icon={<AlertCircle size={18} />} 
            label="Directorio Quejas" 
            active={activeTab === 'complaints-dir'} 
            onClick={() => setActiveTab('complaints-dir')}
          />
        </nav>
        
        <div className="mt-auto px-4 pt-4 flex flex-col gap-1">
          {user.role === 'ADMIN' && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-4">Sistema</div>
              <NavItem 
                icon={<Settings size={18} />} 
                label="Configuración" 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
              />
            </>
          )}
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-4 w-full p-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold mt-2"
          >
            <LogIn size={18} className="rotate-180" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-slate-400 mt-2">ICONOS &bull; {user.role === 'ADMIN' ? 'Modo Administrador' : 'Modo Operador'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold">{user.name}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black">{user.role}</div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-20">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Error de Sistema</h1>
        <p className="text-xl text-slate-400 mb-8">La aplicación no pudo iniciarse correctamente.</p>
        <pre className="bg-black/50 p-8 rounded-xl border border-red-500/20 text-red-400 overflow-auto max-w-full">
          {error.message}
          {"\n\nStack:\n" + error.stack}
        </pre>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="mt-10 btn-primary"
        >
          Resetear Base de Datos y Reintentar
        </button>
      </div>
    )
  }
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1' 
          : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  )
}

function StatCard({ title, value, change }) {
  return (
    <div className="glass p-6">
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-xs text-blue-400 font-medium">{change}</div>
    </div>
  )
}

export default App
