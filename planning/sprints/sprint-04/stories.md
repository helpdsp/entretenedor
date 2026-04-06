# Sprint 4 Stories

- **AC:**
- [ ] Al cumplir la condición del player, se invoca el RPC `mark_atom_complete`.
- [ ] La tabla `user_progress` registra el completado con un UNIQUE constraint `(user_id, atom_id)`.
- [ ] El sistema detecta si el átomo ya estaba completado (`already_completed: true`) y no duplica créditos.
- [ ] Si el átomo pertenece a múltiples células o tracks, el estado visual se actualiza en todos instantáneamente.
- **Como** learner **quiero** ver la ruta de aprendizaje como un grafo visual **para** entender la estructura del conocimiento y mi posición en ella.
- **RF:** RF-08
- **AC:**

