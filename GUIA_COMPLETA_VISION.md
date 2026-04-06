# Guía Completa del Framework VISION
**Para usuarios que utilizan el framework por primera vez**

---

## 🎯 ¿Qué es VISION Framework?

**VISION Framework** es un sistema completo para gestionar el desarrollo de software de forma estructurada, desde la idea inicial hasta la implementación en sprints. A diferencia de otras metodologías, VISION utiliza **comandos de agente** que ejecutas directamente en la ventana de tu IDE (Cursor, Claude Code, GitHub Copilot, etc.), y el agente de IA orquesta todo el proceso por ti.

### Filosofía central

- **Local-first**: Todo funciona en tu máquina sin depender de servicios externos obligatorios
- **Agent-driven**: El agente del IDE ejecuta los comandos, lee archivos, genera artefactos y escribe código
- **Template-based**: Usa templates profesionales de GitHub (Spec Kit) y roles especializados (Agency Agents)
- **Workflow estructurado**: Cada fase tiene precondiciones claras y produce artefactos verificables

---

## 📁 Estructura del Proyecto

Cuando inicialices un proyecto VISION, encontrarás esta estructura:

```
vision-framework/
├── refdocs/                    ← TUS documentos de entrada (PDFs, MDs, imágenes, etc.)
├── source-code/                ← Tu código existente (si es reverse engineering)
├── spec-kit/
│   ├── input/                  ← Artefactos generados (brief, PRD, specs, etc.)
│   ├── templates/              ← Templates oficiales de GitHub Spec Kit
│   └── upstream/               ← Repositorio clonado (gitignored)
├── agency-agents/
│   ├── agents/                 ← Roles de agente por especialidad
│   │   ├── engineering/        ← Frontend, Backend, DevOps, etc.
│   │   ├── design/             ← UI, UX, Research
│   │   ├── testing/            ← QA, Performance, Accessibility
│   │   ├── product/            ← PM, Sprint Prioritizer
│   │   └── project-management/ ← Project Manager, Operations
│   └── upstream/               ← Repositorio clonado (gitignored)
├── planning/
│   ├── workflow-state.json     ← Estado central del flujo (NO editar manualmente)
│   ├── clarifications/         ← Respuestas a sesiones de clarificación
│   └── sprints/                ← Plan detallado por sprint
│       ├── sprint-01/
│       │   ├── sprint-goal.md  ← Objetivo del sprint
│       │   ├── stories.md      ← User stories asignadas
│       │   ├── tasks.md        ← Tareas con owner, status, points
│       │   └── qa-plan.md      ← Criterios de aceptación y QA
│       └── sprint-02/
│           └── ...
├── commands/                   ← Definiciones de todos los comandos (fuente de verdad)
├── scripts/                    ← Implementación Node.js de cada comando
├── AGENTS.md                   ← Referencia rápida de comandos
├── CLAUDE.md                   ← Instrucciones para Claude Code
├── .cursor/                    ← Configuración para Cursor
├── .claude/                    ← Configuración para Claude Code
├── agent-roles.json            ← Mapeo de roles por área
└── .env                        ← Configuración local (opcional)
```

---

## 🔄 Flujo Completo de Trabajo

VISION sigue un flujo secuencial con validaciones en cada etapa:

```
📋 FASE 1: INICIALIZACIÓN
   └─ init

📝 FASE 2: BRIEF (Documento de contexto)
   ├─ clarify_brief (opcional si hay ambigüedades)
   └─ generate_brief

📐 FASE 3: ESPECIFICACIÓN TÉCNICA
   ├─ clarify_spec_kit (opcional si el brief es ambiguo)
   └─ generate_spec_kit → Genera 8 artefactos

🗓️ FASE 4: PLANIFICACIÓN DE SPRINTS
   ├─ clarify_sprints (opcional si el spec es ambiguo)
   └─ generate_sprints → Genera plan completo

🚀 FASE 5: EJECUCIÓN
   ├─ start_sprint --sprint 1 → DESARROLLA el código del sprint
   ├─ continue_sprint          → Retoma sprint activo con tareas pendientes
   └─ start_sprint --sprint 2 → Siguiente sprint (cierra el anterior automáticamente)
```

### Regla de oro de secuencia

**Cada etapa requiere que la anterior esté completa.** No puedes saltar pasos:
- No puedes generar el Spec Kit sin tener el brief
- No puedes generar sprints sin tener el Spec Kit completo (8 artefactos)
- No puedes iniciar sprint 2 sin que todas las tareas del sprint 1 estén marcadas como `done`

---

## 🛠️ Herramientas Disponibles

### 1. **Comandos Principales** (Flujo central)

#### `init`
**Qué hace:** Inicializa el proyecto, resetea el estado del workflow y configura el entorno.

**Cómo usarlo:**
```
init
```

**El agente te preguntará:**
1. ¿Es reverse engineering? (¿partes de código existente?)
   - `yes` → Necesitarás archivos en `source-code/`
   - `no` → Solo necesitas documentación en `refdocs/`
2. ¿Descargar/actualizar Spec Kit? (templates de GitHub)
3. ¿Descargar/actualizar Agency Agents? (roles de agente)

**Qué genera:**
- Resetea `planning/workflow-state.json` al estado `created`
- Descarga templates si lo solicitaste
- Configura el modo de proyecto (nuevo vs reverse engineering)

**Siguiente paso:** `generate_brief` (después de colocar tus documentos en `refdocs/`)

---

#### `generate_brief`
**Qué hace:** El agente lee todos tus documentos de entrada y redacta un brief ejecutivo estructurado.

**Precondiciones:**
- Proyecto inicializado (`init` ejecutado)
- Al menos 1 archivo en `refdocs/`
- Si es reverse engineering: al menos 1 archivo en `source-code/`

**Cómo funciona:**
1. El agente lee `planning/workflow-state.json` para saber si es reverse engineering
2. Lee TODOS los archivos en `refdocs/` (PDFs, MDs, JSONs, YAMLs)
3. Si es reverse engineering, también lee el código en `source-code/`
4. Si existe `planning/clarifications/brief.json`, incorpora esas respuestas
5. **El agente redacta** el brief con estas secciones obligatorias:
   - Executive Summary
   - Context
   - Goals
   - Target Users / Roles
   - Scope — In / Out
   - Functional Requirements Summary
   - Technical Stack & Constraints
   - Success Criteria
   - Open Questions / Risks
   - Input Sources
6. Guarda el resultado en `spec-kit/input/brief.md`
7. Ejecuta `node scripts/generate-brief.js --agent-written` para registrar el evento

**Qué genera:**
- `spec-kit/input/brief.md` (documento de 400+ palabras)

**Siguiente paso:** `generate_spec_kit` (puedes editar el brief antes si quieres)

---

#### `generate_spec_kit`
**Qué hace:** Genera los 8 artefactos técnicos de especificación a partir del brief.

**Precondiciones:**
- `spec-kit/input/brief.md` existe (tras `generate_brief`)
- PRD de producto disponible (en `refdocs/` o como `spec-kit/input/product-prd.md`)

**Los 8 artefactos que genera:**

| Archivo | Contenido |
|---------|-----------|
| `PRD.md` | Product Requirements Document: casos de uso, flujos, métricas de producto |
| `technical-spec.md` | Stack tecnológico, arquitectura, decisiones técnicas, diagramas |
| `api-spec.yaml` | Definición OpenAPI de todos los endpoints |
| `data-model.md` | Modelo de datos, entidades, relaciones, esquemas |
| `epics.md` | Épicas del producto (features de alto nivel) |
| `stories.md` | User stories con formato "Como [rol] quiero [acción] para [beneficio]" + criterios de aceptación |
| `sprint-plan.md` | Distribución preliminar de stories por sprint |
| `test-plan.md` | Estrategia de QA por capa (unit, integration, e2e, performance) |

**Cómo funciona:**
1. Ejecuta `node scripts/generate-spec-kit.js --mode local --brief spec-kit/input/brief.md`
2. El script puede invocar `LOCAL_IDE_AI_COMMAND` si está configurado (opcional)
3. Si no hay IA CLI configurada, usa fallbacks determinísticos + el agente enriquece
4. Lee `planning/clarifications/spec_kit.json` si existe
5. Genera los 8 archivos en `spec-kit/input/`
6. Marca el brief como aprobado en el workflow (aprobación implícita)

**Qué genera:**
- 8 archivos `.md` y `.yaml` en `spec-kit/input/`

**Siguiente paso:** `generate_sprints` (puedes editar los artefactos antes)

---

#### `generate_sprints`
**Qué hace:** Planifica todos los sprints distribuyendo las stories en sprints ejecutables con tareas concretas.

**Precondiciones:**
- Los 8 artefactos del Spec Kit en `spec-kit/input/`

**Cómo funciona:**
1. Lee `epics.md`, `stories.md`, `sprint-plan.md` del Spec Kit
2. Detecta el número de sprints (del `sprint-plan.md` o default: 3)
3. Distribuye stories por sprint según prioridad y dependencias
4. Por cada sprint, genera:
   - `sprint-goal.md` → Objetivo específico del sprint
   - `stories.md` → Stories asignadas a este sprint
   - `tasks.md` → Tareas técnicas con este formato:
     ```markdown
     | ID | Title | Story | Owner Role | Status | Points |
     |----|-------|-------|------------|--------|--------|
     | T-001 | Crear modelo User | US-001 | backend | pending | 3 |
     | T-002 | API endpoint /users | US-001 | backend | pending | 5 |
     ```
   - `qa-plan.md` → Criterios de aceptación y checklist de QA
5. Ejecuta `node scripts/plan-all-sprints.js --mode local`
6. Marca el spec como aprobado en el workflow (aprobación implícita)

**Qué genera:**
- Carpetas `planning/sprints/sprint-01/`, `sprint-02/`, etc.
- Cada una con 4 archivos de planificación
- Actualiza `planning/workflow-state.json` con el total de sprints

**Siguiente paso:** `start_sprint --sprint 1`

---

#### `start_sprint --sprint N`
**Qué hace:** **DESARROLLA** el sprint N según el plan. **El agente debe escribir código en la misma sesión**, no solo ejecutar el script.

**Precondiciones:**
- Sprints generados (`generate_sprints` ejecutado)
- Si N > 1: todas las tareas del sprint N-1 deben estar en `done`

**IMPORTANTE - Contrato del agente:**

Este comando **NO es solo un script**. El agente tiene la obligación de:
1. Ejecutar `node scripts/start-sprint.js --sprint N` (si no está ya activo)
2. **En la misma respuesta**, leer el plan del sprint:
   - `planning/sprints/sprint-0N/sprint-goal.md`
   - `stories.md`, `tasks.md`, `qa-plan.md`
   - Spec Kit cuando sea necesario
3. **Implementar código real** que cumpla las tareas
4. Marcar tareas como `done` en `tasks.md` al completarlas
5. Si el backlog es grande, entregar al menos un **primer corte vertical** (ej: rutas + mock + player básico)

**Cómo funciona el script:**
- Si N > 1: valida que todas las tareas del sprint N-1 estén `done`
- Registra el sprint N-1 como completado (no existe comando `complete_sprint`)
- Marca el sprint N como activo en `planning/workflow-state.json`

**Ejemplo de uso:**
```
start_sprint --sprint 1
```

El agente responderá algo como:
```markdown
**Agente(s):** `engineering-backend-architect` + `engineering-frontend-developer`

Sprint 1 activado: "Setup técnico y modelo de datos"

## Implementación

He creado:
- `/src/models/User.ts` → Modelo de usuario con validaciones
- `/src/routes/users.ts` → Endpoints CRUD /api/users
- `/tests/users.test.ts` → Tests unitarios del modelo

Tareas completadas (marcadas como done en tasks.md):
- T-001 ✓ Crear modelo User
- T-002 ✓ API endpoint /users

Pendientes: T-003, T-004, T-005
```

**Siguiente paso:**
- Si quedan tareas sin `done` → `continue_sprint`
- Si todas las tareas están `done` → `start_sprint --sprint 2`

---

#### `continue_sprint`
**Qué hace:** Retoma el sprint activo cuando quedan tareas pendientes (ej: nueva sesión, pausaste el trabajo).

**Precondiciones:**
- Hay un sprint activo en el workflow
- Al menos una tarea sin status `done` en `tasks.md`

**Diferencia con `start_sprint`:**

| Situación | Comando |
|-----------|---------|
| Primera vez que abres sprint N o pasas de N-1 a N (con N-1 completo) | `start_sprint --sprint N` |
| Sprint N ya activo pero aún hay tareas sin `done` | `continue_sprint` |

**Cómo usarlo:**
```
continue_sprint
```

El agente:
1. Ejecuta `node scripts/continue-sprint.js` (usa el sprint activo automáticamente)
2. Lee las tareas pendientes en `tasks.md`
3. **Continúa implementando** en la misma respuesta
4. Marca tareas como `done` al completarlas

**Siguiente paso:** Cuando todas las tareas estén `done` → `start_sprint --sprint N+1`

---

#### `next_step`
**Qué hace:** Detecta automáticamente cuál es la siguiente acción disponible en el flujo y la recomienda (o ejecuta).

**Cuándo usarlo:**
- No sabes en qué parte del flujo estás
- Regresas al proyecto después de varios días
- Quieres que el agente decida qué hacer

**Cómo funciona:**
1. Ejecuta `node scripts/next-step.js`
2. Lee `planning/workflow-state.json`
3. Evalúa precondiciones de cada comando
4. Detecta bloqueos (ej: faltan refdocs, clarificaciones pendientes)
5. Recomienda la acción más apropiada

**Ejemplo de output:**
```json
{
  "nextAction": "continue_sprint",
  "sprint": 1,
  "blockers": [],
  "message": "Sprint 1 activo con 3 tareas pendientes. Ejecuta continue_sprint."
}
```

**Siguiente paso:** El agente ejecuta la acción recomendada

---

### 2. **Comandos de Clarificación** (Opcionales)

Estos comandos **NO son obligatorios** en el flujo. El agente los invoca solo cuando detecta ambigüedades.

#### `clarify_brief`
**Cuándo invocarlo:**
- Los refdocs son ambiguos, incompletos o contradictorios
- No está claro el objetivo de negocio o la audiencia
- Quieres definir preferencias de UX (theming, responsive, accesibilidad) antes del brief

**Qué hace:**
1. Lee todos los archivos en `refdocs/`
2. Llama a la IA para generar 4-6 preguntas contextuales específicas al proyecto
3. Concatena preguntas UX fijas desde `config/ux-clarification.json` (theming, dispositivos, estilo visual, densidad UI, accesibilidad)
4. Presenta las preguntas de forma interactiva
5. Guarda respuestas en `planning/clarifications/brief.json`

**Ejemplo de preguntas generadas:**
- ¿Cuál es la prioridad principal: velocidad de entrega, robustez técnica o experiencia de usuario?
- ¿Qué nivel de accesibilidad se requiere? (WCAG AA, AAA, básico)
- ¿El sistema debe soportar temas claro/oscuro?
- ¿Es responsive (móvil + desktop) o solo desktop?

**Siguiente paso:** `generate_brief` (usará las respuestas como contexto)

---

#### `clarify_spec_kit`
**Cuándo invocarlo:**
- El brief tiene secciones ambiguas o incompletas
- No está claro el stack tecnológico
- Dudas sobre integraciones, autenticación o modelo de datos

**Qué hace:**
1. Lee `spec-kit/input/brief.md`
2. Genera 4-6 preguntas técnicas y de producto
3. Guarda respuestas en `planning/clarifications/spec_kit.json`

**Siguiente paso:** `generate_spec_kit`

---

#### `clarify_sprints`
**Cuándo invocarlo:**
- Las stories del Spec Kit son ambiguas o muy amplias
- No está clara la priorización entre features
- La velocidad del equipo o el número de sprints no está definido

**Qué hace:**
1. Lee `epics.md`, `stories.md`, `sprint-plan.md`, `PRD.md`, `technical-spec.md`
2. Genera 4-6 preguntas de planificación
3. Guarda respuestas en `planning/clarifications/sprints.json`

**Siguiente paso:** `generate_sprints`

---

#### `clarify_sprint --sprint N`
**Cuándo invocarlo:**
- Las tareas del sprint N tienen criterios de aceptación ambiguos
- Los roles asignados no están claros
- Hay dependencias técnicas no resueltas

**Qué hace:**
1. Lee `planning/sprints/sprint-0N/goal.md`, `stories.md`, `tasks.md`, `qa-plan.md`
2. Genera 3-5 preguntas de ejecución
3. Guarda respuestas en `planning/clarifications/sprint-N.json`

**Siguiente paso:** `start_sprint --sprint N`

---

### 3. **Comandos de Gestión**

#### `update_spec_kit`
**Qué hace:** Descarga o actualiza los templates oficiales de GitHub Spec Kit.

**Cómo funciona:**
1. Verifica que `git` esté disponible
2. Si `spec-kit/upstream/` no existe: hace `git clone https://github.com/github/spec-kit.git`
3. Si ya existe: hace `git pull`
4. Copia los templates a `spec-kit/templates/`
5. Guarda el SHA del commit en `spec-kit/upstream.json`

**Cuándo usarlo:**
- Primera vez que usas el framework
- Quieres actualizar los templates a la última versión

---

#### `update_agency_agents`
**Qué hace:** Descarga o actualiza los roles de agente desde el repositorio Agency Agents.

**Cómo funciona:**
1. Verifica que `git` esté disponible
2. Si `agency-agents/upstream/` no existe: hace `git clone https://github.com/msitarzewski/agency-agents.git`
3. Si ya existe: hace `git pull`
4. Copia los roles a `agency-agents/agents/`
5. Guarda el SHA del commit en `agency-agents/upstream.json`

**Roles disponibles por área:**

| Área | Roles principales |
|------|------------------|
| **Frontend** | `engineering-frontend-developer`, `design-ui-designer`, `design-ux-architect` |
| **Backend** | `engineering-backend-architect`, `engineering-database-optimizer`, `engineering-security-engineer` |
| **QA** | `testing-reality-checker`, `testing-api-tester`, `testing-accessibility-auditor`, `testing-performance-benchmarker` |
| **Deploy** | `engineering-devops-automator`, `engineering-site-reliability-engineer` |
| **PM** | `project-management-senior-project-manager`, `product-product-manager`, `project-management-project-shepherd` |

---

#### `reset_project`
**Qué hace:** Reinicia el proyecto eliminando todos los artefactos generados (brief, spec, sprints, estado).

**LO QUE SE ELIMINA:**
- `spec-kit/input/brief.md` y todos los artefactos del Spec Kit
- `planning/workflow-state.json` (vuelve a estado `created`)
- `planning/clarifications/` (todas las respuestas)
- `planning/sprints/` (todos los sprints planificados)

**LO QUE SE CONSERVA:**
- `refdocs/` (tus documentos de entrada)
- `source-code/` (tu código fuente)
- `spec-kit/templates/` (templates de GitHub)
- `agency-agents/agents/` (roles de agente)

**Precauciones:**
- El agente debe pedir confirmación explícita antes de ejecutar
- **Esta acción no se puede deshacer**

**Siguiente paso:** `init` (empezar de nuevo)

---

### 4. **Comandos de Diagnóstico**

#### Ver estado del proyecto

Desde terminal:
```bash
npm run status
# o
node scripts/status-report.js
```

Output de ejemplo:
```
Estado: spec_generated
Brief: ✓ generado y aprobado
Spec Kit: ✓ generado (8 artefactos)
Sprints: ✗ no generados
Siguiente acción: generate_sprints
```

#### Dashboard web interactivo

```bash
npm run status:web
```

Abre un dashboard web en `http://localhost:4173` con:
- Estado visual del flujo
- Artefactos generados
- Sprints activos y completados
- Siguiente acción recomendada

---

## 🎭 Sistema de Roles (Agency Agents)

### ¿Qué es un rol de agente?

Cada rol es una **personalidad especializada** que el agente del IDE asume para ejecutar tareas específicas. Los roles están definidos en `agency-agents/agents/<categoria>/` como archivos markdown con:
- **Especialidad** del rol
- **Responsabilidades** principales
- **Herramientas** que usa
- **Patrones de trabajo** recomendados
- **Criterios de calidad** que debe cumplir

### Declaración de agentes (obligatorio)

**Norma:** Al inicio de cada actividad VISION, el agente debe declarar qué rol(es) está aplicando.

**Formato:**
```markdown
**Agente(s):** `slug-del-rol` + `slug-del-rol-2` (motivo opcional)
```

**Ejemplo:**
```markdown
**Agente(s):** `engineering-backend-architect` + `engineering-database-optimizer`

Voy a implementar el modelo de datos y los endpoints de la API...
```

### Tabla de roles por comando

| Comando | Roles sugeridos |
|---------|----------------|
| `init` | `project-management-studio-operations-manager`, `engineering-devops-automator` |
| `clarify_brief` | `product-product-manager`, `design-ux-researcher` |
| `generate_brief` | `product-product-manager`, `engineering-technical-writer` |
| `generate_spec_kit` | `engineering-software-architect`, `engineering-backend-architect`, `engineering-frontend-developer` |
| `generate_sprints` | `product-sprint-prioritizer`, `project-management-project-shepherd` |
| `start_sprint` | `project-management-senior-project-manager` + roles técnicos según tareas (frontend/backend/qa/deploy) |
| `continue_sprint` | Igual que `start_sprint` |

### Roles por área técnica

Cuando el agente implementa código en un sprint, usa roles especializados:

**Frontend:**
- `engineering-frontend-developer` → Componentes React/Vue, UI, estado
- `design-ui-designer` → Diseño visual, theming, tokens
- `design-ux-architect` → Flujos de usuario, navegación, accesibilidad

**Backend:**
- `engineering-backend-architect` → API, dominio, arquitectura
- `engineering-database-optimizer` → Queries, índices, migraciones
- `engineering-security-engineer` → Autenticación, autorización, encriptación

**QA:**
- `testing-reality-checker` → Validación de criterios de aceptación
- `testing-api-tester` → Tests de endpoints, contratos
- `testing-accessibility-auditor` → WCAG, screen readers, keyboard nav

**Deploy:**
- `engineering-devops-automator` → CI/CD, docker, scripts de deploy
- `engineering-site-reliability-engineer` → Monitoring, logging, alertas

---

## 📊 Sistema de Estado (workflow-state.json)

El archivo `planning/workflow-state.json` es el **cerebro del framework**. Rastrea:

```json
{
  "version": 1,
  "setup": {
    "reverseEngineering": true,
    "referencesDir": "refdocs",
    "sourceDir": "source-code",
    "initializedAt": "2026-04-06T15:51:06.762Z"
  },
  "status": "spec_generated",
  "brief": {
    "generated": true,
    "approved": true,
    "path": "spec-kit/input/brief.md",
    "generatedAt": "2026-04-06T16:14:59.000Z",
    "approvedAt": "2026-04-06T16:17:53.459Z"
  },
  "spec": {
    "generated": true,
    "approved": false,
    "mode": "local",
    "generatedAt": "2026-04-06T16:17:53.459Z",
    "artifactFiles": [
      "PRD.md",
      "technical-spec.md",
      "api-spec.yaml",
      "data-model.md",
      "epics.md",
      "stories.md",
      "sprint-plan.md",
      "test-plan.md"
    ]
  },
  "sprints": {
    "generated": false,
    "approved": false,
    "total": 0,
    "active": null,
    "completed": []
  },
  "lastAction": {
    "command": "generate_spec_kit",
    "at": "2026-04-06T16:17:53.459Z"
  }
}
```

### Estados del workflow

| Estado | Descripción |
|--------|-------------|
| `created` | Proyecto inicializado pero sin brief |
| `brief_generated` | Brief generado pero no aprobado |
| `brief_approved` | Brief aprobado, listo para spec |
| `spec_generated` | Spec Kit generado |
| `spec_approved` | Spec aprobado, listo para sprints |
| `sprints_generated` | Plan de sprints generado |
| `sprints_approved` | Plan aprobado, listo para ejecución |
| `sprint_active` | Un sprint está en desarrollo |

### ⚠️ **NO edites este archivo manualmente**

Los scripts lo actualizan automáticamente. Si lo modificas a mano, puedes romper el flujo.

---

## ⚙️ Configuración (.env)

El archivo `.env` es **opcional**. VISION funciona sin él, pero puedes personalizarlo:

```bash
# Nombre del proyecto
PROJECT_NAME=Mi Proyecto Awesome
PROJECT_SLUG=mi-proyecto

# IA local (OPCIONAL - el agente del IDE es la IA local por defecto)
LOCAL_AI_PROVIDER=ide_command
LOCAL_IDE_AI_COMMAND=
LOCAL_IDE_AI_TIMEOUT_MS=180000

# Puerto del dashboard web
STATUS_WEB_PORT=4173

# Conexión a Matrix (OPCIONAL - solo si usas el servicio central)
MATRIX_BASE_URL=
MATRIX_API_KEY=
```

### ¿Qué es `LOCAL_IDE_AI_COMMAND`?

**Es OPCIONAL.** Si lo configuras, apunta a un CLI externo que:
- Lee un JSON de input (`{{INPUT_FILE}}`)
- Procesa con IA (ej: llamada a OpenAI, Anthropic, local LLM)
- Escribe un JSON de output (`{{OUTPUT_FILE}}`)

**Pero:** La "IA local" del framework **es el agente del IDE** (esta ventana). Los comandos esperan que el agente lea, analice y redacte. Si no defines `LOCAL_IDE_AI_COMMAND`, los scripts usan fallbacks determinísticos y el agente enriquece manualmente.

---

## 🎓 Tutorial: Tu Primer Proyecto

### Paso 1: Preparar tus documentos

1. Coloca todos tus documentos en `refdocs/`:
   - PDFs de requisitos
   - Markdown con especificaciones
   - JSONs con datos de ejemplo
   - Imágenes de mockups
   - Transcripciones de reuniones

2. Si es reverse engineering, coloca el código en `source-code/`

### Paso 2: Inicializar

En la ventana de agente del IDE, escribe:
```
init
```

Responde las preguntas:
- **¿Es reverse engineering?** → Si ya tienes código: `yes`. Si empiezas de cero: `no`
- **¿Actualizar Spec Kit?** → `yes` (la primera vez)
- **¿Actualizar Agency Agents?** → `yes` (la primera vez)

### Paso 3: Generar el brief

Si tus documentos son claros:
```
generate_brief
```

Si son ambiguos:
```
clarify_brief
```
Responde las preguntas, luego:
```
generate_brief
```

**Resultado:** `spec-kit/input/brief.md` con tu documento ejecutivo.

### Paso 4: Generar el Spec Kit

```
generate_spec_kit
```

El agente leerá el brief y generará los 8 artefactos técnicos.

**Resultado:** 8 archivos en `spec-kit/input/` (PRD, technical-spec, api-spec, data-model, epics, stories, sprint-plan, test-plan)

### Paso 5: Planificar sprints

```
generate_sprints
```

El agente distribuirá las stories en sprints ejecutables.

**Resultado:** Carpetas `planning/sprints/sprint-01/`, `sprint-02/`, etc. con planes detallados.

### Paso 6: Desarrollar el primer sprint

```
start_sprint --sprint 1
```

**El agente escribirá código en la misma respuesta:**
- Creará archivos según `tasks.md`
- Implementará las funcionalidades
- Marcará tareas como `done` al completarlas
- Te mostrará el código generado

### Paso 7: Continuar si es necesario

Si pausaste el trabajo:
```
continue_sprint
```

El agente retomará las tareas pendientes.

### Paso 8: Pasar al siguiente sprint

Cuando todas las tareas del sprint 1 estén `done`:
```
start_sprint --sprint 2
```

El script cerrará automáticamente el sprint 1 y abrirá el 2.

---

## 🔍 Preguntas Frecuentes

### ¿Puedo editar los artefactos generados?

**Sí, absolutamente.** Todos los archivos en `spec-kit/input/` y `planning/sprints/` son editables. El framework los usa como input, no como archivos sagrados.

### ¿Qué hago si un comando falla?

1. Lee el mensaje de error — indica qué precondición falta
2. Ejecuta `next_step` para ver el diagnóstico
3. Resuelve el bloqueante (ej: agregar archivos a `refdocs/`, completar tareas pendientes)
4. Vuelve a ejecutar el comando

### ¿Puedo saltar comandos de clarificación?

**Sí.** Los comandos `clarify_*` son opcionales. Si tus documentos son claros, ve directo a `generate_brief`, `generate_spec_kit`, etc.

### ¿Puedo cambiar el número de sprints?

Sí. Edita `spec-kit/input/sprint-plan.md` antes de ejecutar `generate_sprints`. El script detecta automáticamente el número de sprints del documento.

### ¿Cómo marco una tarea como completada?

En `planning/sprints/sprint-0N/tasks.md`, cambia el Status:
```markdown
| T-001 | Crear modelo User | US-001 | backend | done | 3 |
```

### ¿Puedo trabajar en varios sprints en paralelo?

No. El workflow solo permite un sprint activo a la vez. Debes completar todas las tareas del sprint N antes de pasar al N+1.

### ¿Qué pasa si necesito más sprints?

1. Edita `planning/sprints/` para agregar `sprint-0X/`
2. Crea los 4 archivos: `sprint-goal.md`, `stories.md`, `tasks.md`, `qa-plan.md`
3. Actualiza `planning/workflow-state.json` → `sprints.total`

---

## 📦 Compatibilidad con IDEs

VISION funciona con múltiples IDEs. Cada uno tiene su punto de entrada:

| IDE | Entrypoint | Cómo activar |
|-----|------------|--------------|
| **Cursor** | `.cursor/rules/vision-index.mdc` | Always-on (carga automáticamente) |
| **Claude Code** | `CLAUDE.md` + `.claude/rules/vision-workflow.md` + slash commands en `.claude/commands/` | Always-on + `/generate_brief`, `/start_sprint`, etc. |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Always-on |
| **Antigravity (Gemini)** | Skills globales en `~/.gemini/antigravity/skills/` | `@vision-generate-brief`, `@vision-start-sprint`, etc. |
| **Continue.dev** | Apunta manualmente a `commands/<nombre>.md` | Configuración manual |

### Generar skills para Antigravity

```bash
npm run generate_skills:antigravity
```

Instala un SKILL.md por cada comando en `~/.gemini/antigravity/skills/vision-<comando>/`.

Activa con:
```
@vision-generate-brief
@vision-start-sprint
@vision-agent-declaration
```

---

## 🚀 Comandos desde Terminal (opcional)

Todos los comandos tienen equivalente `npm run` para uso directo desde terminal:

```bash
npm run init
npm run clarify_brief
npm run generate_brief
npm run generate_spec_kit
npm run generate_sprints
npm run start_sprint -- --sprint 1
npm run continue_sprint
npm run next_step
npm run status
npm run status:web
npm run reset_project
```

O usando los wrappers en `bin/`:
```bash
bin/generate_brief
bin/start_sprint --sprint 1
```

---

## 🎯 Mejores Prácticas

### 1. Documenta bien en refdocs

Cuanto más contexto proporciones en `refdocs/`, mejor será el brief y el spec. Incluye:
- Requisitos funcionales y no funcionales
- Mockups o wireframes
- Diagramas de arquitectura
- Reglas de negocio
- Casos de uso
- Criterios de aceptación

### 2. Revisa antes de continuar

Después de cada generación, **revisa los artefactos**:
- Tras `generate_brief` → Lee y edita `spec-kit/input/brief.md`
- Tras `generate_spec_kit` → Verifica los 8 artefactos
- Tras `generate_sprints` → Revisa el plan de sprints

### 3. Marca tareas como done solo cuando estén verificables

No marques una tarea como `done` si:
- El código no compila
- Los tests no pasan
- No cumple los criterios de aceptación

### 4. Usa clarificaciones cuando sea útil

Si tienes dudas, ejecuta `clarify_*` **antes** de generar. Es más eficiente aclarar primero que regenerar después.

### 5. Aprovecha los roles de agente

Cuando el agente declare roles al inicio de su respuesta, **confía en esa especialización**. Si el rol es `testing-reality-checker`, espera que valide con ojo crítico.

---

## 📚 Recursos Adicionales

### Documentación de referencia

- `@/home/lancelot/Desktop/vision-framework/AGENTS.md` → Resumen de todos los comandos
- `@/home/lancelot/Desktop/vision-framework/commands/<nombre>.md` → Instrucciones detalladas por comando
- `@/home/lancelot/Desktop/vision-framework/planning/README.md` → Estructura de planificación
- `@/home/lancelot/Desktop/vision-framework/spec-kit/README.md` → Estructura del Spec Kit

### Repositorios externos

- **Spec Kit**: https://github.com/github/spec-kit
- **Agency Agents**: https://github.com/msitarzewski/agency-agents

---

## 🎉 Conclusión

VISION Framework es una **metodología completa de desarrollo** que transforma documentos en código ejecutable mediante un flujo estructurado y asistido por IA.

**Lo que hace especial a VISION:**
1. **Secuencial y validado**: Cada paso tiene precondiciones claras
2. **Agent-driven**: El agente del IDE hace el trabajo pesado
3. **Template-based**: Usa estándares profesionales (GitHub Spec Kit)
4. **Role-based**: Especialización por área técnica (Agency Agents)
5. **Local-first**: Todo en tu máquina, sin dependencias obligatorias
6. **Trazable**: El estado del workflow es transparente y verificable

**Tu próximo paso:**

Escribe en la ventana de agente:
```
init
```

¡Y empieza tu primer proyecto VISION! 🚀

---

*Guía creada para VISION Framework v1.0.0*
*Última actualización: 2026-04-06*
