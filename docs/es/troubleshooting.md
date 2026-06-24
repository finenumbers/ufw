# Solución de problemas

Síntoma → causa probable → qué hacer.

## Autenticación

| Síntoma | Causa | Solución |
|---------|-------|-----|
| Bucle de redirección al iniciar sesión | `APP_URL` no coincide con la URL del navegador | Configure `APP_URL` con la URL HTTPS pública exacta; reinicie la aplicación |
| Inicio de sesión funciona en local pero no por dominio | NPM o flag secure de la cookie | Force SSL en NPM; compruebe que el esquema de `APP_URL` sea `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` no cargado | Use `--env-file .env` en compose |

## Docker / NPM

| Síntoma | Causa | Solución |
|---------|-------|-----|
| NPM 502 Bad Gateway | La aplicación no está en la red de NPM | Configure `NPM_NETWORK`; verifique que `ufw-app` se una a la red externa |
| `ufw-app` unhealthy | Base de datos caída o secretos ausentes | Revise `docker logs ufw-app`, estado de postgres |
| `ufw-migrate` failed | Error de migración | Lea `docker logs ufw-migrate`; restaure copia de seguridad si es necesario |
| `pull access denied` | Paquete GHCR privado | Configure visibilidad Public del paquete o `docker login ghcr.io` |

## SSH

| Síntoma | Causa | Solución |
|---------|-------|-----|
| Falla la prueba SSH | Credenciales incorrectas, firewall, host caído | Verifique identidad, puerto, que el servidor permita la IP del host Docker |
| Error de validación de host | IP privada bloqueada | Configure `SSH_ALLOWED_CIDRS` para redes internas |
| Clave host cambiada | Reinstalación del servidor o MITM | Verifique la huella en el servidor; actualice tras confirmación |
| Clave host no verificada | Importada desde configuración | Ejecute prueba SSH desde la página de edición del servidor |

## Reglas / aplicación

| Síntoma | Causa | Solución |
|---------|-------|-----|
| Página de reglas vacía / deshabilitada | UFW no activo | Instale y active UFW desde el panel |
| La vista previa muestra eliminaciones inesperadas | Deriva del borrador | Resincronización forzada desde el servidor |
| Aviso de aplicación parcial | Aplicación anterior interrumpida | Resincronice; revise `ufw status` remoto manualmente |
| Bloqueo de SSH | Regla deny aplicada | Acceso por consola/fuera de banda; corrija UFW en el servidor directamente |

## Datos

| Síntoma | Causa | Solución |
|---------|-------|-----|
| Credenciales inválidas tras restauración | `APP_ENCRYPTION_KEY` incorrecta | Restaure el `.env` coincidente de la copia de seguridad |
| No se pueden descifrar identidades | Rotación de clave sin reintroducir secretos | Vuelva a introducir secretos o restaure JSON de exportación |

## API de salud

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Esperado: `{"status":"ok","db":"ok"}`

## ¿Sigue atascado?

Envíe un correo a **[apps@finenumbers.com](mailto:apps@finenumbers.com)** con la etiqueta de versión, registros depurados (sin secretos) y pasos para reproducir.
