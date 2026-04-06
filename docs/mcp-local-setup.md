# MCP local bridge setup

## Ejecutar servidor MCP

```bash
npm run mcp:matrix
```

## Registrar en cliente MCP

Usa `mcp/mcp-server.example.json` como base.

## Herramientas expuestas

- `matrix_healthcheck`
- `matrix_connect_project`
- `matrix_authorize_project`
- `matrix_validate_briefing`
- `matrix_generate_spec_kit`
- `matrix_report_stats`
- `matrix_sync_pending_reports`

## Flujo recomendado desde MCP

1. `matrix_connect_project` (deja estado `pending_auth`).
2. `matrix_authorize_project` (pasa a `connected`).
3. Ejecutar tools de validacion/generacion/reporte.
