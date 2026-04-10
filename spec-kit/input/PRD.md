---
generated_by_model: 'gemini-3.1-pro'
generated_at: '2026-04-09T23:00:00Z'
agent_roles: 'product-product-manager + engineering-backend-architect'
vision_command: 'generate_spec_kit'
---

# PRD - Sistema Entretenedor

## Introducción y Vision
El Sistema Entretenedor busca ser el núcleo operativo de ICONOS para la gestión de su programa de afiliados. La visión es eliminar la fragmentación de datos y proporcionar una plataforma unificada donde cada interacción con el socio (venta, pago, logística, queja, encuesta) quede registrada y sea trazable.

## Historias de Usuario (User Journeys)
### Como Operador de Telemarketing:
*   Quiero registrar un nuevo socio validando que no exista previamente para evitar duplicidad.
*   Quiero capturar los datos de pago de forma segura, sabiendo que la información sensible está protegida.
*   Quiero realizar llamadas de seguimiento y registrar los resultados para mantener la membresía activa.
*   Quiero capturar encuestas de perfil demográfico para entender mejor los hábitos de consumo de los socios.

### Como Administrador:
*   Quiero gestionar los catálogos de motivos de cancelación y tipos de quejas para estandarizar los reportes.
*   Quiero visualizar el estatus de las membresías a nivel global.
*   Quiero supervisar la logística de entrega de paquetes mediante los números de guía.

## Funcionalidades Detalladas
### M1: Gestión de Identidad y Socios
*   Autonumeración de socios siguiendo la secuencia histórica.
*   Búsqueda avanzada por nombre, membresía o incluso nombres en tarjetas adicionales.
*   Validación de duplicidad basada en nombre y apellidos.

### M2: Ciclo de Vida de Membresía
*   Gestión de programas (Nacional/Internacional) y promociones (6 meses sin intereses, noches de cortesía).
*   Registro de "Llamada de Bienvenida" como hito obligatorio tras la afiliación.
*   Criterios de renovación y registro de motivos de rechazo configurables.

### M3: Gestión Financiera Segura
*   Captura de formas de pago y bancos emisores.
*   **Enmascaramiento de Tarjeta**: Solo se muestran los últimos 4 dígitos o asteriscos en la UI. El número completo solo es accesible vía API bajo permisos estrictos (si aplica) o nunca se muestra.
*   Historial de autorizaciones y facturas asociadas.

### M4: Logística y Seguimiento
*   Integración (manual) de datos de mensajería: fecha de entrega a mensajería, fecha de entrega al cliente, y causas de devolución.

### M5: CRM y Satisfacción (Encuestas y Quejas)
*   Encuestas demográficas detalladas (edad, sexo, hijos, ocupación).
*   Registro de hábitos: Restaurante visitado, hotel utilizado (ciudad), tiendas utilizadas.
*   Gestión de quejas con folio automático y tipificación (mal servicio, descuento no aplicado, etc.).

## Criterios de Éxito (KPIs)
1.  **Cero Duplicados**: El sistema debe detectar intentos de duplicación en el 100% de los casos.
2.  **Seguridad**: Ningún operador debe poder ver el número de tarjeta completo en pantalla.
3.  **Trazabilidad**: Cada registro de socio debe tener asociado un capturista y un vendedor.
4.  **Adopción**: El 100% de las nuevas afiliaciones deben pasar por el sistema.

## Requerimientos de UX/UI
*   Diseño optimizado para entrada de datos masiva (uso intensivo de teclado).
*   Dashboards rápidos para ver el estatus de las quejas pendientes.
*   Buscador global de socios siempre accesible.
