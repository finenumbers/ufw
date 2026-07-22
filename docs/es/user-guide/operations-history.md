# Historial de operaciones

Las tareas de larga duración (aplicar, actualizar, instalar UFW, escaneo de puertos) se registran en **registros de operaciones** y se muestran en la interfaz.

## Banner de operación

Mientras se ejecuta una operación, aparece un banner en la parte superior de la app:

- Tipo y estado de la operación (RUNNING, SUCCESS, FAILED)
- Lista de pasos expandible con estado por paso
- Cierre automático tras éxito tras un breve retraso

El banner consulta actualizaciones mientras el trabajo está en curso.

Si un banner queda atascado en **RUNNING** o **PENDING** tras una desconexión del navegador, actualice la página. Las operaciones obsoletas se limpian automáticamente mediante un barrido en segundo plano (normalmente en 30–60 minutos).

## Página de operaciones

Barra lateral → **Historial de operaciones** (`/operations`)

Dos pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Operaciones** | Registro técnico — aplicar, sync, actualizar, escaneo de puertos, Docker, etc. |
| **Audit** | Eventos relevantes para seguridad — inicio/cierre de sesión, exportación de configuración |

Ambas admiten desplazamiento infinito para entradas antiguas.

## Tipos de operación

La base de datos almacena nombres de tipo con punto (por ejemplo `ufw.refresh`). La interfaz los traduce con claves con guion bajo (por ejemplo `ufw_refresh`).

Ejemplos activos:

- `apply_rules` / `apply.rules` — aplicar UFW
- `ufw_refresh` / `ufw.refresh` — Actualizar estado (lectura SSH en vivo + sync de reglas)
- `ufw_sync` / `ufw.sync` — sync inicial en segundo plano cuando no hay snapshot
- `ufw_install` / `ufw.install` — instalar UFW (la activación se ejecuta dentro de la instalación)
- `port_scan` / `port.scan` — escaneo de puertos externo
- `server_create` / `server.create` — nuevo servidor añadido

Legacy (solo entradas históricas):

- `ssh_test` — de versiones anteriores a v0.7.4; ya no se crea

## Borrar historial

Los administradores pueden borrar el historial antiguo de operaciones desde la interfaz (los eventos de audit pueden conservarse según la política de retención). Borrar no afecta al estado del servidor ni a las reglas.

## Documentación relacionada

- [Registro de audit y exportación](../administration/audit-log-and-export.md)
- [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md)
