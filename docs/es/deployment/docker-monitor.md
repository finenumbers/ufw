# Monitorización de contenedores Docker

UFW Remote Manager puede inventariar y controlar **contenedores Docker** en cada servidor registrado por **SSH** (mismo transporte que las operaciones UFW).

Los resultados aparecen en una tabla **debajo del panel de escaneo de puertos** en la página del servidor.

## Activar

Definir en el entorno de la app (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Ajustes opcionales:

| Variable | Predeterminado | Propósito |
|----------|----------------|-----------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Snapshots de inventario almacenados por servidor |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | Tiempo de espera de comandos SSH para Docker CLI |

La actualización de inventario y el control de contenedores (start/stop/restart) comparten un **cooldown de 30 segundos** por servidor (fijo en el código desde v0.5.1). Los legacy `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` y `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` en `.env` se **ignoran**.

## Requisitos en servidores gestionados

- **Docker CLI** instalado (`docker` en PATH)
- Daemon Docker accesible para el usuario SSH
- Membresía en el grupo **`docker`** o **sudo sin contraseña** para `docker`

La app intenta primero `docker …`, luego `sudo docker …` si se deniega permiso.

## Funciones (MVP)

- Actualizar inventario: `docker ps -a`, estadísticas para contenedores en ejecución
- Tabla: nombre, imagen, estado, health, puertos, CPU/memoria, etiquetas Compose
- Agrupación por proyecto Compose
- Panel de detalle del contenedor (`docker inspect`, variables env enmascaradas)
- Control: **start**, **stop**, **restart** (confirmación para stop/restart)
- Banner de progreso de operación + eventos de auditoría

## Seguridad

- Feature flag (desactivado por defecto)
- Validación de ID/nombre de contenedor — sin shell arbitrario desde la interfaz
- Solo acciones de control fijas
- Límites de tasa fijos de 30s en actualización y control (no configurables por env)
- Auditoría: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Polling de progreso

Mientras la actualización de inventario se ejecuta, la interfaz consulta un endpoint de estado ligero. El intervalo de polling aumenta: **3s → 5s → 10s**. El banner de operación muestra el progreso por pasos.

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [Modelo de seguridad](../administration/security-model.md)
