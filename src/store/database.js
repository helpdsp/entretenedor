/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:15:00Z
 * @agent_roles engineering-backend-architect
 * @vision_command start_sprint --sprint 1
 * @task_id T-002
 */

// Mock Database using LocalStorage for persistence
const STORAGE_KEY = 'entretenedor_db';

export const getDB = () => {
  const dbStr = localStorage.getItem(STORAGE_KEY);
  let db = dbStr ? JSON.parse(dbStr) : {
    partners: [],
    payments: [],
    complaints: [],
    users: [],
    config: { nextPartnerNumber: 1001, nextFolioNumber: 5001 }
  };

  // Asegurar que las tablas existan en bases de datos viejas
  if (!db.users) {
    db.users = [
      { id: 'admin-1', username: 'admin', password: 'password123', role: 'ADMIN', name: 'Administrador' },
      { id: 'op-1', username: 'op01', password: 'password123', role: 'OPERADOR', name: 'Operador 01' }
    ];
  }
  if (!db.partners) db.partners = [];
  if (!db.payments) db.payments = [];
  if (!db.complaints) db.complaints = [];
  if (!db.config) db.config = { nextPartnerNumber: 1001, nextFolioNumber: 5001 };
  
  return db;
};

export const saveDB = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// CRUD for Partners
export const partnerService = {
  getAll: () => getDB().partners,
  
  create: (partnerData) => {
    const db = getDB();
    
    // Duplicate validation
    const exists = db.partners.some(p => 
      p.nombres.toLowerCase() === partnerData.nombres.toLowerCase() && 
      p.apellido_paterno.toLowerCase() === partnerData.apellido_paterno.toLowerCase()
    );
    
    if (exists) throw new Error('Ya existe un socio con el mismo nombre y apellido.');

    const newPartner = {
      ...partnerData,
      id: crypto.randomUUID(),
      numero_cliente: db.config.nextPartnerNumber++,
      created_at: new Date().toISOString()
    };

    db.partners.push(newPartner);
    saveDB(db);
    return newPartner;
  },

  update: (id, updateData) => {
    const db = getDB();
    const index = db.partners.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Socio no encontrado');
    
    db.partners[index] = { ...db.partners[index], ...updateData };
    saveDB(db);
    return db.partners[index];
  },

  search: (query) => {
    const partners = getDB().partners;
    const lowerQuery = query.toLowerCase();
    return partners.filter(p => 
      p.nombres.toLowerCase().includes(lowerQuery) || 
      p.apellido_paterno.toLowerCase().includes(lowerQuery) ||
      p.numero_cliente.toString().includes(lowerQuery)
    );
  }
};

// CRUD for Payments
export const paymentService = {
  getAll: () => {
    const db = getDB();
    return db.payments.map(p => {
      const partner = db.partners.find(part => part.id === p.partner_id);
      return { ...p, partner_name: partner ? `${partner.nombres} ${partner.apellido_paterno}` : 'Socio Desconocido' };
    });
  },
  create: (paymentData) => {
    const db = getDB();
    const newPayment = {
      ...paymentData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    db.payments.push(newPayment);
    saveDB(db);
    return newPayment;
  }
};

// CRUD for Complaints
export const complaintService = {
  getAll: () => {
    const db = getDB();
    return db.complaints.map(c => {
      const partner = db.partners.find(p => p.id === c.partner_id);
      return { ...c, partner_name: partner ? `${partner.nombres} ${partner.apellido_paterno}` : 'Socio Desconocido' };
    });
  },
  create: (complaintData) => {
    const db = getDB();
    const newComplaint = {
      ...complaintData,
      id: crypto.randomUUID(),
      folio: `Q-${db.config.nextFolioNumber++}`,
      estatus: 'ABIERTA',
      created_at: new Date().toISOString()
    };
    db.complaints.push(newComplaint);
    saveDB(db);
    return newComplaint;
  },

  update: (id, updateData) => {
    const db = getDB();
    const index = db.complaints.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Queja no encontrada');
    
  }
};

// CRUD for Users
export const userService = {
  login: (username, password) => {
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Credenciales inválidas');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  getAll: () => {
    const db = getDB();
    return db.users.map(({ password, ...u }) => u);
  },
  create: (userData) => {
    const db = getDB();
    if (db.users.some(u => u.username === userData.username)) {
      throw new Error('El nombre de usuario ya existe');
    }
    const newUser = {
      ...userData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDB(db);
    return newUser;
  },
  update: (id, updateData) => {
    const db = getDB();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    
    db.users[index] = { ...db.users[index], ...updateData };
    saveDB(db);
    return db.users[index];
  }
};
