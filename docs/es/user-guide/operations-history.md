# Historial de operaciones

Las tareas de larga duración (aplicar, actualizar, instalar UFW, prueba SSH) se registran en **logs de operación** y se muestran en la interfaz.

## Banner de operación

Mientras una operación se ejecuta, aparece un banner en la parte superior de la app:

- Tipo de operación y estado (RUNNING, SUCCESS, FAILED)
- Lista de pasos expandible con estado por paso
- Cierre automático en éxito tras un breve retraso

El banner consulta actualizaciones mientras el trabajo está en curso.

Si un banner queda atascado en **RUNNING** o **PENDING** tras desconectar el navegador, actualice la página. Las operaciones obsoletas se limpian automáticamente mediante un barrido en segundo plano (típicamente en 30–60 minutos).

## Página de operaciones

Barra lateral → **Historial de operaciones** (`/operations`)

Dos pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Operaciones** | Log técnico de operaciones — aplicar, sync, prueba SSH, etc. |
| **Auditoría** | Eventos relevantes para seguridad — login, logout, exportación de config |

Ambas admiten desplazamiento infinito para entradas más antiguas.

## Tipos de operación

Ejemplos:

- `apply_rules` — aplicación UFW
- `ufw_refresh` — actualizar estado y reglas
- `ufw_sync` — sincronizar borrador con servidor
- `ufw_install` / `ufw_enable` — configuración UFW
- `ssh_test` — verificación de conexión
- `server_create` — nuevo servidor añadido

## Borrar historial

Los administradores pueden borrar el historial antiguo de operaciones desde la interfaz (los eventos de auditoría pueden conservarse según la política de retención). Borrar no afecta al estado del servidor ni a las reglas.

## Documentación relacionada

- [Log de auditoría y exportación](../administration/audit-log-and-export.md)
- [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md)
