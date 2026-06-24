# Modelo de seguridad

Esta página explica cómo UFW Remote Manager protege credenciales, sesiones y límites de red.

Para informar vulnerabilidades, consulte [SECURITY.md](../../../SECURITY.md) (inglés, canónico).

## Autenticación

- **Better Auth** con correo electrónico/contraseña
- Una sola cuenta de administrador tras la configuración inicial — sin registro público
- Cookies de sesión; `BETTER_AUTH_SECRET` obligatorio en producción
- Límite de tasa en endpoints de autenticación (en memoria, una sola réplica)

## Cifrado de credenciales

Las contraseñas SSH y las claves privadas se cifran con **AES-256-GCM** antes del almacenamiento.

| Secreto | Propósito |
|--------|---------|
| `APP_ENCRYPTION_KEY` | Cifra/descifra secretos de identidad (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Firma tokens de sesión |

**Si se pierde `APP_ENCRYPTION_KEY`, las credenciales SSH cifradas no se pueden recuperar** — solo reintroducirlas manualmente o restaurar desde copia de exportación de configuración.

## Seguridad SSH

- La validación de host bloquea SSRF hacia direcciones privadas/de metadatos
- `SSH_ALLOWED_CIDRS` opcional para redes internas
- Fijación de clave host en la primera conexión exitosa
- Claves importadas marcadas como no verificadas hasta que la prueba SSH tenga éxito
- Inyección de comandos evitada mediante enums en lista blanca y construcción sanitizada de comandos UFW

## Salvaguardas de aplicación y exportación

- Los cambios UFW requieren **vista previa + confirmación explícita**
- La exportación de configuración requiere **volver a introducir la contraseña** y escribe evento de auditoría `CONFIG_EXPORT`
- Los archivos de exportación contienen **secretos en texto plano** — responsabilidad del operador

## Cabeceras de seguridad HTTP (producción)

Cuando `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS termina en Nginx Proxy Manager; la aplicación recibe HTTP en la red Docker.

## Lista de comprobación de exposición de red

- [ ] Interfaz de administración solo vía proxy inverso HTTPS
- [ ] Postgres no expuesto al host/internet en producción
- [ ] Restringir URL de administración (VPN, lista de IPs en NPM)
- [ ] Secretos `.env` únicos y robustos
- [ ] Copias de seguridad regulares de Postgres + `.env` fuera del host
- [ ] Rotar secretos si la exportación o `.env` pudieron filtrarse

## Sanitización de errores

Los errores orientados al cliente en rutas SSH/aplicación se sanitizan para no filtrar trazas de pila ni rutas internas.

## Documentación relacionada

- [Variables de entorno](./environment-variables.md)
- [Registro de auditoría y exportación](./audit-log-and-export.md)
- [Arquitectura](../architecture.md)
