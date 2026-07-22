# Administrar servidores

Esta guía cubre el ciclo de vida del servidor: añadir, panel, actualizar, instalar UFW, editar, eliminar y estadísticas de lista.

## Requisitos previos

Cree al menos una [identidad SSH](../concepts/ssh-identities.md) antes de añadir un servidor.

## Añadir un servidor

1. Barra lateral → **Servidores** → **Añadir servidor**
2. Rellene nombre, host, puerto y seleccione identidad
3. **Crear servidor** — SSH verificado automáticamente al enviar
4. Si tiene éxito, abra el panel del servidor

Si la verificación falla, compruebe accesibilidad del host, credenciales, firewall que permita SSH desde el host Docker y [validación de host](../concepts/servers-and-ssh.md).

## Panel del servidor

El panel carga **estado UFW en caché** desde el último snapshot de Postgres — sin SSH en la primera pintura.

Cuando el escaneo de puertos está activado, el panel de escaneo carga el **último escaneo de cualquier estado** desde Postgres (incluidos escaneos en curso desde v0.9.2).

| Estado UFW | Acciones |
|------------|----------|
| No instalado | **Actualizar estado**, luego **Instalar UFW** (tras confirmar con actualización que falta) |
| Instalado pero inactivo | **Actualizar estado** — botón instalar oculto si UFW existe pero está inactivo |
| Instalado y activo | **Añadir regla**, **Guardar reglas**, **Actualizar estado**, **Scan ports** opcional |

**Actualizar estado** ejecuta SSH en vivo, actualiza snapshot y sincroniza la tabla de reglas. **Instalar UFW** permanece desactivado hasta que la actualización confirme que UFW no está instalado.

Hasta actualizar, la insignia UFW puede mostrar etiqueta **caché** del último snapshot.

### Advertencia de ediciones no guardadas

Si tiene cambios de borrador no guardados, la actualización pide confirmación antes de recargar desde el servidor.

### Sincronización inicial automática

Cuando **no existe snapshot UFW** en Postgres (servidor nuevo, nunca actualizado), se ejecuta una operación de sincronización en segundo plano una vez para poblar la caché. Observe el banner de operaciones.

## Estadísticas de reglas y puertos

| Ubicación | Métrica | Significado |
|-----------|---------|-------------|
| Tarjeta **lista de servidores** | reglas guardadas | Recuento local `ruleRecord` |
| Tarjeta **lista de servidores** | puertos abiertos | Hallazgos del último escaneo exitoso (cuando está activado) |
| Insignia del **panel** | en la tabla | Recuento de filas visibles de la tabla de reglas |

*En la tabla* del panel puede diferir de *reglas guardadas* mientras edita o antes de aplicar.

## Editar un servidor

1. Página del servidor → **Editar**
2. Cambie nombre, host, puerto o identidad
3. SSH verificado al enviar cuando cambiaron parámetros de conexión

La página de edición muestra huella de clave host y advertencia **sin verificar** cuando corresponde.

## Eliminar un servidor

**Zona de peligro** en la página de edición:

- Elimina reglas locales, borradores, snapshots y escaneos de este servidor
- **No** cambia UFW remoto

Confirme solo al eliminar datos de gestión, no al limpiar reglas de firewall remotas.

## Herramientas de configuración en lista de servidores

- **Guardar configuración** / **Cargar configuración** — exportación/importación JSON v2 completa — consulte [Importar y exportar configuración](../concepts/import-export-config.md)

## Documentos relacionados

- [Servidores y SSH](../concepts/servers-and-ssh.md)
- [Editar y aplicar reglas](./edit-and-apply-rules.md)
- [Escaneo de puertos](./port-scan.md)
