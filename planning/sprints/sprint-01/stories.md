# Sprint 1 Stories

- **Como** usuario nuevo **quiero** registrarme mediante invitación o lista de espera **para** acceder a un entorno de aprendizaje exclusivo y controlado.
- **RF:** RF-01
- **AC:**
- [ ] El registro bloquea si no hay un `invite_token` válido en la URL o sesión.
- [ ] Formulario de waitlist (nombre, email) inserta en tabla `waitlist` con status `pending`.
- [ ] Platform Admin puede invocar la Edge Function `waitlist-invite` para disparar email de invitación (Resend).
- [ ] Al registrarse, el sistema ejecuta `domain_matching` contra la tabla `organizations`.
- [ ] Si hay match y la org tiene auto-join activo, el usuario se vincula automáticamente en `org_members`.

