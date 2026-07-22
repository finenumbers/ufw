# Historial de operaciones

Las tareas de larga duración — aplicar, sincronizar, actualizar, instalar UFW, escaneo de puertos — se rastrean en **registros de operaciones** y se muestran en la interfaz.

## Banner de operaciones

Mientras el trabajo está en curso, aparece un banner en la parte superior:

| Elemento | Descripción |
|---------|-------------|
| Estado | EN CURSO, PENDIENTE, ÉXITO, ERROR, PARCIAL |
| Pasos | Estado expandible por paso |
| Mensaje | Texto de progreso o error traducido |

**ÉXITO** se cierra automáticamente tras ~10 segundos. **ERROR** y **PARCIAL** permanecen hasta cerrar.

### Comportamiento de sondeo (v0.9.2)

- Sondea ~**1 segundo** mientras la operación está EN CURSO o PENDIENTE
- **Deja de sondear cuando está inactivo** — sin bucle de fondo de 5 segundos
- Se reinicia cuando comienza una nueva operación
- Al completar, despacha evento para que las páginas de servidor refresquen datos SSR

Consulte [Operaciones y concurrencia](../concepts/operations-and-concurrency.md).

### Banner atascado

Si el banner muestra EN CURSO tras desconexión, actualice la página. El barrido en segundo plano marca operaciones EN CURSO antiguas como fallidas en ~30–60 minutos.

## Página de operaciones

Barra lateral → **Historial de operaciones** (`/operations`)

| Pestaña | Contenido |
|---------|-----------|
| **Registros de operaciones** | Registro técnico — aplicar, sincronizar, actualizar, escaneo de puertos, fallos de creación de servidor |
| **Eventos de auditoría** | Eventos de seguridad — inicio/cierre de sesión, exportación de configuración, acciones UFW |

Ambas pestañas admiten desplazamiento infinito para entradas antiguas.

## Tipos de operación

La base de datos almacena nombres con puntos; la interfaz los traduce.

| Tipo | Descripción |
|------|-------------|
| `apply.rules` | Sesión de aplicación UFW |
| `ufw.refresh` | Actualizar estado — SSH en vivo + sync de reglas |
| `ufw.sync` | Sincronización inicial en segundo plano sin snapshot |
| `ufw.install` | Instalación y activación UFW remota |
| `port.scan` | Escaneo externo de puertos |
| `server.create` | Creación de servidor con fallo SSH |

Legacy (solo entradas históricas):

- `ssh_test` — pre v0.7.4; ya no se crea

## Borrar historial

**Borrar historial** elimina entradas antiguas del registro de operaciones de la interfaz/base de datos según la acción de retención. No afecta servidores, reglas o UFW remoto.

La pestaña de auditoría puede retener eventos según política — consulte [Registro de auditoría y exportación](../administration/audit-log-and-export.md).

## Documentos relacionados

- [Operaciones y concurrencia](../concepts/operations-and-concurrency.md)
- [Flujo de borrador y aplicación](../concepts/draft-apply-workflow.md)
- [Escaneo de puertos](./port-scan.md)
