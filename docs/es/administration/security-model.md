# Modelo de seguridad

UFW Remote Manager es una **herramienta de administración privilegiada**: almacena secretos SSH, ejecuta comandos de firewall remotos y expone una interfaz web. Aquí se documentan supuestos de diseño y controles.

## Modelo de amenazas (resumen)

| Activo | Riesgo | Mitigación |
|--------|--------|------------|
| Credenciales SSH | Divulgación | AES-256-GCM en reposo; descifrado solo para conexiones |
| Cookie de sesión | Secuestro | HTTPS, cookies HTTP-only, `BETTER_AUTH_SECRET` |
| Suplantación de host | MITM en SSH | Huella de clave host en primera conexión; sin verificar bloquea aplicación |
| Admin no autorizado | Fuerza bruta | Usuario único; límite de tasa de setup; contraseñas robustas |
| CSRF / XSS | Abuso de cuenta | Valores predeterminados del framework, CSP en producción |
| Archivo exportación configuración | Fuga de secretos | Reautenticación con contraseña; responsabilidad del operador |

La app **no** implementa ACL por servidor — cualquier admin autenticado puede gestionar todos los servidores.

## Autenticación

- Sesiones Better Auth correo/contraseña
- Registro desactivado tras el primer usuario (`/setup` una vez)
- Cerrar sesión limpia sesión; inicio/cierre de sesión auditados

Ejecute solo por **HTTPS** en producción (`APP_URL` debe usar https salvo localhost).

## Cifrado en reposo

| Secreto | Clave |
|---------|-------|
| Contraseñas e claves de identidad | `APP_ENCRYPTION_KEY` (32 bytes) |
| Firma de sesión | `BETTER_AUTH_SECRET` (mín. 32 caracteres en prod) |

Rotar `APP_ENCRYPTION_KEY` sin reimportar identidades hace inutilizable el texto cifrado almacenado.

## Exposición de red

Compose de producción (`docker-compose.prod.yml`):

- Postgres **no** publicado al host
- App escucha dentro de la red Docker para NPM
- SSH destino desde contenedor app hacia servidores gestionados

TLS termina en **Nginx Proxy Manager**. HTTP interno entre NPM y `ufw-app` es intencional — consulte [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## Seguridad SSH

- Bloqueo predeterminado de IPs destino privadas/metadatos
- `SSH_ALLOWED_CIDRS` opcional para lab/VPN
- TOFU de clave host — consulte [Servidores y SSH](../concepts/servers-and-ssh.md)
- Aplicación bloqueada hasta verificar clave host

## Endurecimiento de aplicación

Cabeceras HTTP de producción (CSP, HSTS, etc.) vía `next.config.ts`.

El endpoint de salud `/api/health` expone versión — sin secretos.

## Auditoría

Las acciones sensibles escriben filas `auditEvent`: inicio/cierre de sesión, aplicar, snapshot, escaneo de puertos, exportación de configuración, cambios de servidor. Consulte [Registro de auditoría y exportación](./audit-log-and-export.md).

## Réplica única

Los límites de tasa y colas están **en memoria**. Varias réplicas de app sin estado compartido debilitan límites de tasa y garantías de cola.

## Informar vulnerabilidades

Consulte [SECURITY.md](../../../SECURITY.md) en la raíz del repositorio (inglés).

## Documentos relacionados

- [Variables de entorno](./environment-variables.md)
- [Arquitectura](../architecture.md)
