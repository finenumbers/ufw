# Solución de problemas

Síntoma → causa probable → qué hacer.

## Autenticación

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Bucle de redirección al iniciar sesión | `APP_URL` no coincide con la URL del navegador | Definir `APP_URL` a la URL HTTPS pública exacta; reiniciar la app |
| Login funciona en local pero no por dominio | NPM o flag cookie secure | Forzar SSL en NPM; comprobar que el esquema `APP_URL` es `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` no cargado | Usar `--env-file .env` en compose |
| `APP_URL must use HTTPS in production` | `APP_URL` no HTTPS para un dominio real | Usar `https://your-domain`; `http://localhost` permitido solo para smoke/CI |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Secreto demasiado corto | Regenerar con `openssl rand -base64 32` |

## Docker / NPM

| Síntoma | Causa | Solución |
|---------|-------|----------|
| NPM 502 Bad Gateway | App no en la red NPM | Definir `NPM_NETWORK`; verificar que `ufw-app` se une a la red externa |
| Página setup fácil de brute-force | Falta `TRUST_PROXY` | Definir `TRUST_PROXY=1` detrás de NPM |
| `ufw-app` unhealthy | BD caída o secretos faltantes | Comprobar `docker logs ufw-app`, salud de postgres |
| `ufw-migrate` falló | Error de migración | Leer `docker logs ufw-migrate`; restaurar backup si es necesario |
| `pull access denied` | Paquete GHCR privado | Visibilidad Public o `docker login ghcr.io` |

## SSH

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Prueba SSH falla | Credenciales incorrectas, firewall, host caído | Verificar identidad, puerto; el servidor permite IP del host Docker |
| Error de validación de host | IP privada bloqueada | Definir `SSH_ALLOWED_CIDRS` para redes internas |
| Clave de host cambiada | Reinstalación del servidor o MITM | Verificar huella en el servidor; actualizar tras confirmación |
| Clave de host no verificada | Importada desde config | Ejecutar prueba SSH desde la página de edición del servidor |

## Reglas / aplicación

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Página de reglas vacía / desactivada | UFW no activo | Instalar y activar UFW desde el panel |
| Vista previa muestra eliminaciones inesperadas | Deriva del borrador | Resincronización forzada desde el servidor |
| Aplicación rechazada — remoto cambió | UFW cambió entre vista previa y confirmación | Ejecutar **Vista previa de aplicación** de nuevo (no resync) |
| Aviso de aplicación parcial | Aplicación anterior interrumpida o sync falló | Resincronizar; revisar `ufw status` remoto manualmente |
| Banner de operación atascado | RUNNING/PENDING obsoleto tras desconexión | Actualizar la página |
| Bloqueado fuera de SSH | Regla deny aplicada | Acceso consola/fuera de banda; corregir UFW directamente en el servidor |

## Datos

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Credenciales inválidas tras restauración | `APP_ENCRYPTION_KEY` incorrecto | Restaurar `.env` coincidente desde backup |
| No se pueden descifrar identidades | Rotación de clave sin reintroducción | Reintroducir secretos o restaurar export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Esperado: `{"status":"ok","db":"ok","version":"…"}` (`revision` solo fuera de producción)

## ¿Sigue atascado?

Envíe un correo a **[apps@finenumbers.com](mailto:apps@finenumbers.com)** con el tag de versión, logs sanitizados (sin secretos) y pasos para reproducir.
