# Historial de operaciones

Las tareas de larga duración (aplicación, actualización, instalación UFW, prueba SSH) se registran en **registros de operaciones** y se muestran en la interfaz.

## Banner de operaciones

Mientras una operación está en curso, aparece un banner en la parte superior de la aplicación:

- Tipo y estado de la operación (EN CURSO, ÉXITO, ERROR)
- Lista de pasos expandible con estado por paso
- Cierre automático tras éxito tras un breve retraso

El banner consulta actualizaciones mientras el trabajo está en progreso.

## Página de operaciones

Barra lateral → **Historial de operaciones** (`/operations`)

Dos pestañas:

| Pestaña | Contenido |
|-----|---------|
| **Registros de operaciones** | Registro técnico de operaciones — aplicación, sincronización, prueba SSH, etc. |
| **Eventos de auditoría** | Eventos relevantes para seguridad — inicio de sesión, cierre de sesión, exportación de configuración |

Ambas admiten desplazamiento infinito para entradas antiguas.

## Tipos de operación

Ejemplos:

- `apply_rules` — aplicación UFW
- `ufw_refresh` — actualizar estado y reglas
- `ufw_sync` — sincronizar borrador con servidor
- `ufw_install` / `ufw_enable` — configuración UFW
- `ssh_test` — verificación de conexión
- `server_create` — nuevo servidor añadido

## Borrar historial

Los administradores pueden borrar el historial de operaciones antiguo desde la interfaz (los eventos de auditoría pueden conservarse según la política de retención). Borrar no afecta al estado del servidor ni a las reglas.

## Documentación relacionada

- [Registro de auditoría y exportación](../administration/audit-log-and-export.md)
- [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md)
