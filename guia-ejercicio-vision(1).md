# Ejercicio VISION Framework — Guía autodirigida (~12.5 horas)

## ¿Para qué sirve VISION?

VISION convierte una idea de producto en código funcionando mediante un flujo ordenado de comandos que se escriben en la ventana de agente del IDE. En cada etapa la IA produce artefactos en disco. Tú los lees, detectas lo que no refleja bien el producto real, y le dices al agente qué corregir antes de avanzar. Ese ciclo de observación y corrección es el trabajo central de este ejercicio.

Este ejercicio es autodirigido: cada quien lo hace a su ritmo. La guía describe los bloques y las duraciones aproximadas, pero no hay un facilitador presente. Si te atoras, la misma guía y los comandos del agente te orientan sobre qué sigue.

El flujo es:

```
init → generate_brief → generate_spec_kit → generate_sprints → start_sprint N
```

Los comandos `clarify_*` son opcionales. El agente los invoca cuando detecta ambigüedades, o los puedes pedir explícitamente si algo no quedó claro.

---

## Qué produce cada comando y qué hay que revisar

### `init`
Configura el proyecto. No produce artefactos para revisar. Hay que responder bien las preguntas de configuración, especialmente si el proyecto parte de código existente o no.

---

### `generate_brief` → `spec-kit/input/brief.md`

El documento raíz. Todo lo que viene después se deriva de aquí.

Leerlo completo y preguntarse: ¿si alguien leyera solo esto, construiría exactamente lo que queremos?

- ¿El problema descrito es el problema real o la IA lo generalizó?
- ¿Los usuarios y sus roles son los correctos?
- ¿El Scope In incluye exactamente lo que se acordó, ni más ni menos?
- ¿El Scope Out dice explícitamente qué no entra?
- ¿Los requisitos son verificables? "Buena experiencia" no lo es. "El usuario puede filtrar por categoría" sí.

Si algo no está bien, decirle al agente qué corregir antes de avanzar.

---

### `generate_spec_kit` → 8 artefactos en `spec-kit/input/`

Los que importa leer:

**`epics.md`** — ¿cubren todo el Scope In? ¿incluyen algo que estaba en el Scope Out?

**`stories.md`** — ¿cada historia tiene criterios de aceptación que describan comportamiento observable? ¿alguna es demasiado grande para un sprint? ¿falta alguna funcionalidad del alcance?

**`sprint-plan.md`** — ¿las historias de setup están antes que las de features? ¿hay dependencias rotas entre sprints?

**`test-plan.md`** — ¿cada historia tiene al menos un caso con resultado esperado concreto?

Cualquier cosa que no esté bien, pedirle al agente que la corrija antes de correr `generate_sprints`.

---

### `generate_sprints` → carpetas `planning/sprints/sprint-0N/`

- ¿El objetivo de cada sprint representa valor real para el usuario?
- ¿La carga de historias por sprint parece alcanzable?
- ¿Los criterios del `qa-plan.md` son verificables sin ambigüedad?

---

### `start_sprint --sprint N`

El agente escribe código siguiendo el plan. No revisas código: usas la app como usuario y verificas que las historias del sprint cumplan sus criterios de aceptación. Si algo no funciona como se esperaba, dile al agente para que corrija.

---

## Bloques del ejercicio

---

### Bloque 1 — Setup completo (30 min)

**Meta:** Antigravity funcionando, repo clonado y branch personal listo.

1. Descargar e instalar Antigravity. Iniciar sesión y verificar que el panel de agente responde.
2. Configurar git (`user.name`, `user.email`) y verificar acceso a GitHub y Node.js ≥ 18.
3. Clonar el repo, crear el branch personal y hacer el primer push:
   ```bash
   git clone https://github.com/grupo-iconos/vision-framework.git
   cd vision-framework
   git checkout -b taller/<nombre-apellido>
   git push -u origin taller/<nombre-apellido>
   ```
4. Convertir los comandos al formato esperado por el IDE:
   ```bash
   npm run setup:ide
   ```
5. Abrir la carpeta en Antigravity y leer `CLAUDE.md`, `AGENTS.md` y `commands/README.md`.

---

### Bloque 2 — Refdocs, `init` y `generate_brief` (2 h)

**Meta:** tener el brief aprobado como base de todo el proyecto.

Primero preparar los refdocs: crear 1–3 archivos en `refdocs/` describiendo el producto (qué hace, para quién, qué problema resuelve, qué funcionalidades se esperan). Cuanto más concreto sea el contenido, mejores artefactos producirá la IA en todos los pasos siguientes.

Escribir en el agente: `init`. Responder las preguntas de configuración.

Escribir en el agente: `generate_brief`.

**Modelo sugerido:** Gemini 3.1 Pro (High o Low) o Claude Sonnet. También se puede usar Opus, pero consume el uso más rápido.

Leer `spec-kit/input/brief.md` completo. Si algo no refleja bien el producto, decirle al agente qué está mal y pedirle que corrija. Iterar hasta que el brief sea preciso. Este es el paso más importante del ejercicio: cada imprecisión aquí se amplifica en todos los pasos siguientes.

---

### Bloque 3 — `generate_spec_kit`, `generate_sprints` y diagnóstico de planeación (3 h)

**Meta:** Spec Kit aprobado, plan de sprints listo y diagnóstico de la planeación documentado.

Escribir en el agente: `generate_spec_kit`.

**Modelo sugerido:** Gemini 3.1 Pro.

Leer `epics.md`, `stories.md`, `sprint-plan.md` y `test-plan.md`. Para cada problema, decirle al agente qué corregir: épicas fuera de alcance, historias sin criterios verificables, dependencias rotas, historias sin casos de prueba. El agente puede corregir artefactos individuales sin regenerar todo.

Cuando el Spec Kit esté bien, escribir en el agente: `generate_sprints`.

**Modelo sugerido:** Gemini 3.1 Pro.

Revisar el objetivo y las historias de cada sprint. Si algo no está bien distribuido o los qa-plans son vagos, pedirle al agente que ajuste antes de empezar el desarrollo.

Finalmente crear `reports/diagnostico-planeacion.md` con:
- Qué modelo de IA se usó en cada comando.
- Qué artefactos requirieron corrección y por qué.
- Qué fue difícil de expresar en los refdocs.

---

### Bloque 4 — Desarrollo de todos los sprints (5.5 h)

**Meta:** todos los sprints completos con la aplicación funcionando end-to-end.

Este bloque es el corazón del ejercicio. El ciclo se repite por cada sprint:

**1. Iniciar el sprint.** Escribir en el agente: `start_sprint --sprint N`. El agente escribe código en la misma respuesta.

**Modelo sugerido:** Gemini 3 Flash para la mayoría de sprints. Para tareas complejas (setup de base de datos, configuración de autenticación, integraciones con servicios externos, migraciones de datos) usar Gemini 3.1 Pro.

**2. Probar las historias.** Levantar la app y usar cada funcionalidad del sprint como usuario final. La pregunta es simple: ¿esto hace lo que dice el criterio de aceptación? Si algo no funciona como se esperaba, describírselo al agente y pedirle que corrija. Iterar hasta que las historias del sprint pasen.

**3. Mini-retro antes del siguiente sprint.** Antes de avanzar, reflexionar brevemente: ¿qué funcionó bien en este sprint? ¿qué tuvo que corregirse y por qué? ¿fue un problema del artefacto o de la implementación? Esta reflexión alimenta el reporte final.

**4. Avanzar al siguiente sprint** cuando las historias del sprint actual estén verificadas. Escribir en el agente: `start_sprint --sprint N+1`.

Si en algún momento el sprint activo tiene trabajo pendiente de una sesión anterior, usar `continue_sprint` para retomarlo. Si no se sabe en qué punto está el flujo, usar `next_step`.

---

### Bloque 5 — Reporte final y PR (1 h)

**Meta:** entregar el trabajo completo y consolidar el aprendizaje.

Crear `reports/diagnostico-pruebas.md`. Para esto, decirle al agente tu nivel de experiencia programando y pedirle que genere el archivo con:
- Qué funciona y qué no en la aplicación final.
- De los problemas encontrados, cuáles venían de artefactos mal generados y cuáles fueron errores del agente al implementar.
- Qué cambiarías en los refdocs o en qué pasos usarías más `clarify_*`.
- Qué modelo funcionó mejor para planear y cuál para codear.

Abrir un PR de `taller/<nombre-apellido>` hacia `main` con una descripción de qué se construyó, cómo correr la app y links a los dos reportes.

---

## Resumen

| # | Bloque | Duración aprox. |
|---|--------|----------------|
| 1 | Setup: Antigravity + repo + branch | 30 min |
| 2 | Refdocs + `init` + `generate_brief` | 2 h |
| 3 | `generate_spec_kit` + `generate_sprints` + diagnóstico de planeación | 3 h |
| 4 | Desarrollo de todos los sprints con pruebas y mini-retros entre cada uno | 5.5 h |
| 5 | Reporte final + PR | 1 h |

---

## Selección de participantes

Priorizar a los miembros del equipo que estén disponibles actualmente (sin carga de clientes). El objetivo es entrenarlos primero para tenerlos listos, y después rotar con los demás conforme se liberen.

---

## Modelos recomendados por etapa

| Etapa | Modelo sugerido | Notas |
|-------|----------------|-------|
| `generate_brief` | Gemini 3.1 Pro (High o Low) o Claude Sonnet | Opus también funciona pero gasta el uso más rápido |
| `generate_spec_kit` | Gemini 3.1 Pro | — |
| `generate_sprints` | Gemini 3.1 Pro | — |
| `start_sprint` (general) | Gemini 3 Flash | Para la mayoría de sprints |
| `start_sprint` (tareas complejas) | Gemini 3.1 Pro | Setup de BD, auth, integraciones, migraciones |

---

## Reglas del ejercicio

**Iterar con el agente, no editar a mano.** Cuando un artefacto está mal, describir el problema en el chat y pedirle al agente que lo corrija.

**No avanzar con ambigüedades.** Si el brief no está bien, el spec kit tampoco lo estará. Si el spec kit tiene historias vagas, los sprints serán impredecibles.

**Probar como usuario, no como developer.** La verificación de cada sprint es usar la app y ver si las historias cumplen sus criterios de aceptación.

**Documentar solo lo que sirve.** Dos reportes en texto libre: `diagnostico-planeacion.md` al terminar la planeación y `diagnostico-pruebas.md` al terminar el desarrollo.
