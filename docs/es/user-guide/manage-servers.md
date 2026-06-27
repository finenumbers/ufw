# Gestionar servidores

Esta guía recorre el ciclo de vida del servidor: añadir, configurar UFW, actualizar, editar y eliminar.

## Requisitos previos

Cree al menos una [identidad SSH](../concepts/ssh-identities.md) antes de añadir un servidor.

## Añadir un servidor

1. Barra lateral → **Servidores** o haga clic en **Añadir servidor**
2. Complete nombre, host, puerto y seleccione una identidad
3. Haga clic en **Crear servidor** — la conexión SSH se verifica automáticamente al enviar
4. Si tiene éxito, llegará al panel del servidor

Si la verificación falla, compruebe la accesibilidad del host, las credenciales, el firewall que permita SSH desde el host Docker y la [validación de host](../concepts/servers-and-ssh.md).

## Panel del servidor

El panel carga el **estado UFW en caché** del último snapshot de Postgres — sin SSH en la primera carga. Los paneles de escaneo de puertos y Docker también cargan los últimos resultados en caché de Postgres cuando están disponibles.

| Estado | Acciones disponibles |
|--------|----------------------|
| UFW no instalado | **Actualizar estado**, luego **Instalar UFW** (tras actualización que confirme que falta UFW) |
| Instalado pero inactivo | Solo **Actualizar estado** — UFW ya está instalado; use la actualización para detectar el estado activo/inactivo |
| Instalado y activo | **Añadir regla**, **Guardar reglas**, **Actualizar estado** |

Haga clic primero en **Actualizar estado** para verificar SSH y detectar si UFW está instalado. **Instalar UFW** permanece deshabilitado hasta que una actualización exitosa indique que falta UFW.

Hasta que ejecute **Actualizar estado**, la insignia UFW puede mostrar una etiqueta activo/inactivo **en caché** del último snapshot.

Use **Actualizar estado** para obtener el último estado UFW por SSH y sincronizar la tabla de reglas. Si tiene cambios de reglas **sin guardar**, la app pide confirmación antes de recargar desde el servidor.

Si la app **aún no tiene snapshot UFW** en Postgres (servidor nuevo, nunca actualizado, etc.), se ejecuta una sincronización automática en segundo plano una vez para rellenar la caché.

## Contadores de reglas

Aparecen dos contadores distintos en la interfaz:

| Ubicación | Etiqueta | Significado |
|-----------|----------|-------------|
| Tarjeta de la **lista de servidores** | reglas guardadas | Número de reglas almacenadas en metadatos locales (`ruleRecord`) |
| Insignia del **panel** bajo Añadir regla | en la tabla | Número de filas en la tabla de reglas (sesión de borrador activa) |

Estos números pueden diferir mientras edita, sincroniza o importa reglas. La insignia del panel coincide con el total de la tabla de reglas.

## Editar un servidor

1. Abrir servidor → **Editar**
2. Cambiar nombre, host, puerto o identidad
3. La conexión SSH se verifica automáticamente al enviar si cambiaron los parámetros de conexión

La página de edición muestra la huella de la clave de host almacenada y una advertencia **No verificado** cuando corresponda — no hay un botón de prueba separado.

## Eliminar un servidor

**Zona de peligro** en la página de edición o ajustes del servidor:

- Elimina todas las reglas locales, borradores y snapshots de este servidor
- **No modifica** el UFW remoto

Confirme solo si desea eliminar datos de gestión, no para borrar reglas de firewall remotas.

## Herramientas de la lista de servidores

Desde la página principal de servidores puede:

- **Guardar configuración** / **Cargar configuración** — exportación/importación JSON completa (véase [Importar y exportar configuración](../concepts/import-export-config.md))

## Documentación relacionada

- [Servidores y SSH](../concepts/servers-and-ssh.md)
- [Editar y aplicar reglas](./edit-and-apply-rules.md)
