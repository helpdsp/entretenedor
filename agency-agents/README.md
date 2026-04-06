# Agency Agents

Roles de agente por especialidad, descargados desde [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents).

## Estructura

```
agency-agents/
  agents/               ← definiciones de roles (tracked en git)
    engineering/        ← frontend-developer, backend-architect, devops-automator...
    design/             ← ui-designer, ux-architect, brand-guardian...
    testing/            ← reality-checker, api-tester, accessibility-auditor...
    product/            ← product-manager, sprint-prioritizer...
    project-management/ ← senior-project-manager, project-shepherd...
  upstream/             ← clon local de git (gitignored)
  upstream.json         ← sha y fecha de la última actualización
```

## Actualizar

Desde la ventana de agente del IDE:

```
update_agency_agents
```

O desde terminal:

```powershell
node scripts/update-agency-agents.js
# o
npm run update_agency_agents
```

El `init` pregunta automáticamente si quieres descargar o actualizar al inicializar el proyecto.

## Cómo se usan los roles

Los roles definen el comportamiento de los agentes durante la ejecución de sprints.
Cuando el agente del IDE procesa `start_sprint`, lee `agent-roles.json` para saber qué rol
aplica a cada tarea según su `owner_role`, y luego usa la definición de ese rol en `agents/`
para ejecutar el trabajo.

Ejemplo: una tarea con `owner_role: backend` activa el rol `engineering-backend-architect`.

## Roles activos por defecto

Definidos en `../agent-roles.json`:

| Área | Rol lead |
|---|---|
| Frontend | `engineering-frontend-developer` |
| Backend | `engineering-backend-architect` |
| QA | `testing-reality-checker` |
| Deploy | `engineering-devops-automator` |
| PM | `project-management-senior-project-manager` |

## Compatibilidad

Agency Agents es compatible con Cursor, Claude Code, GitHub Copilot y Gemini CLI.
Los archivos de rol siguen el formato del framework
[agency-agents](https://github.com/msitarzewski/agency-agents) (MIT License).
