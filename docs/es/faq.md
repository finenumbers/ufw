# Preguntas frecuentes

## General

### ¿Qué es UFW Remote Manager?

Una aplicación web autoalojada para gestionar firewalls UFW en servidores Linux remotos por SSH, con flujo de borrador/aplicación y registro de auditoría.

### ¿Reemplaza Nginx Proxy Manager?

No. NPM (o similar) termina HTTPS para la interfaz de administración. UFW Remote Manager gestiona **firewalls de servidores remotos**, no su proxy inverso.

### ¿Puedo gestionar contenedores Docker?

No. El monitor de contenedores Docker se **eliminó en v0.9.0**. La app gestiona reglas UFW y escaneos externos de puertos opcionales únicamente.

### ¿Cuántos usuarios administradores?

Una cuenta tras la configuración inicial en `/setup`. No hay interfaz multiusuario.

### ¿Puedo ejecutar varias réplicas de la app?

No se recomienda. Los límites de tasa y las colas están en memoria (diseño de réplica única).

## SSH y servidores

### ¿Por qué se rechaza una IP privada?

Seguridad predeterminada — bloquea RFC1918 y direcciones de metadatos. Configure `SSH_ALLOWED_CIDRS` para destinos de laboratorio/VPN.

### ¿Por qué está desactivada la aplicación?

La clave host SSH puede estar **sin verificar**. Ejecute **Actualizar estado** con éxito primero.

### ¿Eliminar servidor modifica UFW remoto?

No. Eliminar solo quita datos de gestión locales.

## Reglas y aplicación

### ¿Vista previa vs confirmación?

La vista previa muestra los cambios planificados sin ejecutarlos. Confirmar ejecuta comandos UFW por SSH.

### ¿El remoto cambió desde la vista previa?

Aplicación rechazada — ejecute **Vista previa de aplicación** de nuevo. No use resincronización forzada en este caso.

### ¿Aplicación parcial?

Consulte [Flujo de borrador y aplicación](./concepts/draft-apply-workflow.md). Use **Resincronización forzada desde el servidor** cuando se indique.

### ¿Por qué difieren los recuentos de reglas?

**Reglas guardadas** (tarjeta de lista) vs **en la tabla** (panel) cuentan cosas distintas — consulte [Reglas UFW y estados](./concepts/ufw-rules-and-states.md).

## Interfaz de operaciones

### ¿Banner atascado en EN CURSO?

Actualice la página. El barrido marca operaciones obsoletas en ~30–60 minutos.

### ¿Reglas no se actualizan tras sincronizar?

Desde v0.9.2, el fin de la operación debería refrescar la página. Pruebe una actualización manual del navegador una vez.

## Escaneo de puertos

### ¿Falta el botón de escaneo?

`PORT_SCAN_ENABLED` no está en `true` en el entorno de la app.

### ¿Escaneo ya en curso?

Solo un escaneo activo por servidor. Espere o consulte el historial de operaciones.

### ¿El escaneo bloquea la actualización UFW?

No (desde v0.9.2). El escaneo corre fuera de la cola SSH.

## Despliegue

### ¿Dónde ejecutar migraciones?

En el contenedor **migrate** / **ufw-migrate** — no dentro de **ufw-app**. Consulte [Resumen de despliegue](./deployment/overview.md).

### ¿EACCES al ejecutar prisma en el contenedor app?

Esperado — use `docker compose run --rm migrate`.

## Documentos relacionados

- [Solución de problemas](./troubleshooting.md)
- [Introducción](./introduction.md)
