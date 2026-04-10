---
generated_by_model: 'gemini-3.1-pro'
generated_at: '2026-04-09T23:07:00Z'
agent_roles: 'engineering-backend-architect'
vision_command: 'generate_spec_kit'
---

# Modelo de Datos - Entretenedor

## Entidades y Atributos

### 1. Socios (Partners)
*   `id`: UUID (PK)
*   `numero_cliente`: Integer (Consecutivo histórico)
*   `titulo`: String (Sr, Sra, Lic, etc)
*   `nombres`: String
*   `apellido_paterno`: String
*   `apellido_materno`: String
*   `nacimiento_fecha`: Date
*   `email`: String
*   `empresa_nombre`: String
*   `empresa_puesto`: String
*   `tipo_cliente`: Enum (ACTIVACION, SOCIO)
*   `created_at`: Timestamp

### 2. Membresías (Memberships)
*   `id`: UUID (PK)
*   `partner_id`: UUID (FK)
*   `numero_membresia`: String (Unique)
*   `programa`: Enum (NACIONAL, INTERNACIONAL)
*   `estatus`: Enum (ACTIVO, INACTIVO, CANCELADO)
*   `vendedor_id`: UUID (FK)
*   `capturista_id`: UUID (FK)
*   `expiracion_fecha`: Date
*   `llamada_bienvenida_status`: Boolean
*   `comentarios`: Text

### 3. Pagos (Payments)
*   `id`: UUID (PK)
*   `membership_id`: UUID (FK)
*   `forma_pago`: String
*   `banco`: String
*   `importe`: Decimal
*   `tarjeta_mask`: String (e.g. "**** **** **** 1234")
*   `autorizacion_numero`: String
*   `deposito_fecha`: Date

### 4. Quejas (Complaints)
*   `id`: UUID (PK)
*   `folio`: String (Auto-generado)
*   `partner_id`: UUID (FK)
*   `tipo_queja`: String (Catalogo)
*   `descripcion`: Text
*   `estatus`: Enum (ABIERTA, SEGUIMIENTO, CERRADA)

### 5. Encuestas (Surveys)
*   `id`: UUID (PK)
*   `partner_id`: UUID (FK)
*   `edad`: Integer
*   `sexo`: String
*   `hijos_cuenta`: Integer
*   `estado_civil`: String
*   `restaurante_frecuencia`: Integer
*   `hotel_usado`: String
