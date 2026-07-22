# Solución de problemas

Síntoma → causa probable → solución. Para conceptos, consulte los documentos enlazados.

## Autenticación y configuración

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `/setup` redirige al inicio de sesión | Ya existe un usuario | Use `/login` |
| Fallo de inicio de sesión tras despliegue | `APP_URL` incorrecta o HTTP en lugar de HTTPS | Coincida con el dominio NPM; configure `APP_URL=https://...` |
| Límite de tasa de setup demasiado agresivo | Falta `TRUST_PROXY` detrás de NPM | Configure `TRUST_PROXY=1` |

## SSH y creación de servidor

| Síntoma | Causa | Solución |
|---------|-------|----------|
| IP privada rechazada | Validación de host | Use IP/hostname público o `SSH_ALLOWED_CIDRS` |
| Conexión rechazada | Firewall, puerto incorrecto, host caído | Verifique desde el host Docker: `ssh -p PORT user@host` |
| Autenticación fallida | Credenciales de identidad incorrectas | Edite identidad; vuelva a introducir el secreto |
| Advertencia de clave host | Primera conexión o servidor reconstruido | **Actualizar estado** para capturar nueva huella |

## UFW y reglas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Aplicación desactivada | Clave host sin verificar | **Actualizar estado** |
| Aplicación rechazada tras vista previa | UFW remoto cambió | **Vista previa de aplicación** de nuevo |
| Aplicación parcial | Comandos interrumpidos o fallo de sincronización | **Resincronización forzada desde el servidor**; consulte historial de operaciones |
| Vista previa muestra eliminaciones inesperadas | Deriva del borrador | **Resincronización forzada desde el servidor** |
| Reglas reaparecen tras eliminar en servidor | Sincronización obsoleta (pre-v0.9.2) | Actualice a v0.9.2+; resincronización forzada |
| Bloqueo de SSH | Regla deny aplicada | Acceso por consola; corrija UFW fuera de banda |

## Banner de operaciones

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Banner EN CURSO para siempre | Navegador desconectado a mitad de operación | Actualice página; espere al barrido |
| Tabla obsoleta tras sincronizar | Fin de operación no detectado (raro post-v0.9.2) | Actualice el navegador |
| Tráfico API inactivo | Versión antigua sondeaba indefinidamente | Actualice a v0.9.2 — el sondeo inactivo se detiene |

## Escaneo de puertos

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Panel ausente | Función desactivada | `PORT_SCAN_ENABLED=true` |
| Escaneo fallido por tiempo de espera | Rango grande / red lenta | Aumente `PORT_SCAN_*_TIMEOUT_MS`; compruebe salida |
| Error escaneo en curso | Protección de solapamiento | Espere al escaneo actual |
| Sin hallazgos | Todos los puertos filtrados/cerrados | Esperado; compruebe estado SUCCESS del escaneo |
| Progreso perdido al actualizar (antiguo) | SSR solo cargaba escaneos SUCCESS | Actualice a v0.9.2 |

## Docker y migrate

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `EACCES` prisma en app | Contenedor incorrecto | `docker compose run --rm migrate` |
| Migrate falla al actualizar | Permisos DB o versión antigua | Consulte `docker compose logs migrate` |
| App no saludable | Secretos incorrectos o DB caída | Logs: `docker compose logs app` |

## Importación/exportación de configuración

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Importación bloqueada | Operaciones activas en servidor | Espere a que la cola esté inactiva |
| Exportación limitada por tasa | Demasiados intentos | Espere 60 segundos |
| Secretos descifrados corruptos tras restaurar | `APP_ENCRYPTION_KEY` incorrecta | Restaure `.env` coincidente |

## Documentos relacionados

- [Preguntas frecuentes](./faq.md)
- [Operaciones y concurrencia](./concepts/operations-and-concurrency.md)
- [Variables de entorno](./administration/environment-variables.md)
