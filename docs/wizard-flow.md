# Wizard Flow (local-first + matrix optional)

El wizard y los comandos CLI siguen este pipeline:

1. `created`
2. `brief_generated`
3. `brief_approved` *(se marca al completar `generate_spec_kit`; antes no hay paso de aprobación explícita)*
4. `spec_generated`
5. `spec_approved` *(se marca al completar `generate_sprints`; antes no hay paso de aprobación explícita del spec)*
6. `sprint_plan_generated`
7. `sprint_active` / `sprint_progress`

## Comandos del flujo

```bash
generate_brief
generate_spec_kit
generate_sprints
start_sprint --sprint 1
start_sprint --sprint 2
next_step
```
(`generate_sprints` aprueba el plan; `approve_sprints_plan` es opcional.)

## Conexion a matriz (opcional)

```bash
npm run connect_project -- --project-id "<PROJECT_ID>" --workspace-id "<WORKSPACE_ID>" --matrix-url "http://localhost:4000"
npm run matrix:authorize -- --authorized-by "<your-name>"
```

Sin `matrix:authorize`, la conexion queda en `pending_auth` y no se envian reportes.

## Ejecucion guiada

```bash
npm run wizard:start -- --project-name "Mi Proyecto"
```

`wizard:start` funciona en local-only. Si no hay matriz autorizada, `generate_spec_kit` hace fallback local automaticamente.
