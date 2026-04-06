# Input Spec Kit

Coloca aqui los artefactos finales del Spec Kit.

## Si ya tienes un Spec Kit en otra ruta

Ejecuta:

```bash
npm run bootstrap -- --project-name "Mi Proyecto" --spec-kit-path "/ruta/spec-kit"
```

El script detecta y copia los artefactos a esta carpeta.

## Si no tienes Spec Kit

- Validar briefing en matriz:
  - `npm run brief:validate -- --brief ./spec-kit/input/brief.md`
- Generar Spec Kit en matriz (OpenRouter corre en matriz):
  - `npm run spec:generate -- --mode matrix --brief ./spec-kit/input/brief.md`
- Local con Specify:
  - `npm run spec:local`
