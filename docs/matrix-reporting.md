# Matrix reporting (optional + authorized)

## Objetivo

Sincronizar estado de planeacion/sprints locales hacia matriz sin bloquear el flujo local.

## Estados de conexion

- `disconnected`: modo local-only, sin intento de envio.
- `pending_auth`: hay URL/IDs configurados, pero aun sin autorizacion explicita.
- `connected`: autorizacion concedida, se permite reportar.
- `denied`: autorizacion rechazada o fallida.

## Flujo de conexion autorizada

1. Configurar contexto:

```bash
npm run connect_project -- --project-id "<PROJECT_ID>" --workspace-id "<WORKSPACE_ID>" --matrix-url "http://localhost:4000"
```

2. Autorizar:

```bash
npm run matrix:authorize -- --authorized-by "<your-name>"
```

3. Ejecutar comandos de workflow normalmente.

## Reglas de envio

- Si el estado no es `connected`, no se envia nada y se informa `running local-only mode`.
- Si el estado es `connected` y matriz responde, se envia reporte directo.
- Si el estado es `connected` y matriz falla, se encola offline.

## Cola offline

Ruta:

- `.matrix/pending-reports.ndjson`

Sincronizacion manual:

```bash
npm run matrix:sync
```

## Variables de entorno

- `MATRIX_BASE_URL`
- `MATRIX_API_KEY`
- `MATRIX_REPORT_PATH`
- `MATRIX_VALIDATE_BRIEF_PATH`
- `MATRIX_GENERATE_SPEC_PATH`
- `MATRIX_AUTHORIZE_PATH`

## Eventos reportados por scripts

- `project_connected`
- `brief_generated`
- `brief_approved`
- `spec_generated`
- `spec_approved`
- `sprints_generated`
- `sprints_approved`
- `sprint_started`
- `sprint_completed`
- `planning_finalized`
