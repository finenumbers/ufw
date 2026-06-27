# Modelo de seguridad

Esta página explica cómo UFW Remote Manager protege credenciales, sesiones y límites de red.

Para informar de vulnerabilidades, consulte [SECURITY.md](../../../SECURITY.md) (inglés, referencia canónica).

## Autenticación

- **Better Auth** con correo/contraseña
- Cuenta de administrador única tras la configuración inicial — sin registro público
- Cookies de sesión; `BETTER_AUTH_SECRET` obligatorio en producción
- Límite de tasa en endpoints de autenticación (en memoria, réplica única)

## Cifrado de credenciales

Las contraseñas SSH y claves privadas se cifran con **AES-256-GCM** antes del almacenamiento.

| Secreto | Propósito |
|---------|-----------|
| `APP_ENCRYPTION_KEY` | Cifra/descifra secretos de identidad (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Firma tokens de sesión |

**Si se pierde `APP_ENCRYPTION_KEY`, las credenciales SSH cifradas no se pueden recuperar** — solo reintroducirlas manualmente o restaurarlas desde una copia de exportación de configuración.

## Seguridad SSH

- La validación del host bloquea SSRF hacia direcciones privadas/metadatos al guardar
- **Comprobación de resolución DNS:** antes de cada conexión SSH y escaneo de puertos, la IP resuelta se valida de nuevo — bloquea DNS rebinding hacia direcciones privadas/metadatos aunque el nombre de host pareciera seguro al guardar
- `SSH_ALLOWED_CIDRS` opcional para redes internas
- Fijación de clave de host en la primera conexión exitosa
- Claves importadas marcadas como no verificadas hasta que el test SSH tenga éxito
- Inyección de comandos evitada mediante enums en lista blanca y construcción de comandos UFW saneada

## Escaneo de puertos externo (opcional)

Cuando `PORT_SCAN_ENABLED=true`:

- Los escaneos se ejecutan **solo** hacia registros `Server.host` ya presentes en la base de datos
- Naabu + Nmap se ejecutan dentro de `ufw-app` (escaneos connect, sin destinos arbitrarios)
- Limitado por servidor; eventos de auditoría registrados
- Requiere **egreso de red** del contenedor de la aplicación hacia los hosts gestionados en los puertos escaneados — consulte [Escaneo de puertos](../deployment/port-scan.md)

## Monitorización Docker (opcional)

Cuando `DOCKER_MONITOR_ENABLED=true`:

- Inventario y control se ejecutan por **SSH** solo en servidores registrados
- Referencias de contenedores validadas; solo acciones `START` / `STOP` / `RESTART`
- Límites de tasa y eventos de auditoría en actualización y control
- El usuario SSH necesita acceso a la CLI de Docker — consulte [Monitorización Docker](../deployment/docker-monitor.md)

## Salvaguardas de aplicación y exportación

- Los cambios UFW requieren **vista previa + confirmación explícita**
- La exportación de configuración requiere **reintroducir la contraseña** y escribe un evento de auditoría `CONFIG_EXPORT`
- Los archivos de exportación contienen **secretos en texto plano** — responsabilidad del operador

## Cabeceras de seguridad HTTP (producción)

Cuando `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS termina en Nginx Proxy Manager; la aplicación recibe HTTP en la red Docker.

### Nota sobre Content-Security-Policy

La CSP actual incluye `'unsafe-inline'` y `'unsafe-eval'` para scripts de Next.js App Router e hidratación. La CSP basada en nonces se pospone hasta que Next.js la admita sin romper los bundles del cliente. No elimine estas directivas sin una pasada de regresión completa.

## Endpoints públicos

| Ruta | Auth | Notas |
|------|------|-------|
| `/api/health` | Ninguna | Devuelve `status`, `db`, `version`; `revision` (id git/build) solo en no producción |
| `/setup` | Ninguna (una vez) | Limitado en tasa; use `TRUST_PROXY=1` detrás de NPM |

## Límite de tasa del setup

El registro inicial de administrador (`/setup`) está limitado a **5 intentos por minuto** por IP de cliente cuando `TRUST_PROXY=1`, en caso contrario por bucket de conexión directa.

## Lista de comprobación de exposición de red

- [ ] UI de administración solo vía proxy inverso HTTPS
- [ ] Postgres no expuesto al host/internet en producción
- [ ] Restringir URL de administración (VPN, lista blanca de IP en NPM)
- [ ] Secretos `.env` fuertes y únicos
- [ ] Copias de seguridad regulares de Postgres + `.env` fuera del host
- [ ] Rotar secretos si la exportación o `.env` pudo haber filtrado

## Saneamiento de errores

Los errores orientados al cliente en rutas SSH/aplicación se sanear para evitar filtrar trazas o rutas internas.

Las sesiones expiradas devuelven un mensaje coherente desde las server actions: `Session expired. Please sign in again.` (sin propagar `Unauthorized` en bruto a la UI).

## Documentación relacionada

- [Variables de entorno](./environment-variables.md)
- [Registro de auditoría y exportación](./audit-log-and-export.md)
- [Arquitectura](../architecture.md)
