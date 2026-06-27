# Gestionar servidores

Esta guía recorre el ciclo de vida del servidor: añadir, configurar UFW, actualizar, editar y eliminar.

## Requisitos previos

Cree al menos una [identidad SSH](../concepts/ssh-identities.md) antes de añadir un servidor.

## Añadir un servidor

1. Barra lateral → **Servidores** o haga clic en **Añadir servidor**
2. Complete nombre, host, puerto y seleccione una identidad
3. Haga clic en **Crear servidor** — la prueba SSH se ejecuta automáticamente
4. Si tiene éxito, llegará al panel del servidor

Si la prueba SSH falla, compruebe la accesibilidad del host, las credenciales, el firewall que permita SSH desde el host Docker y la [validación de host](../concepts/servers-and-ssh.md).

## Panel del servidor

El panel carga el **estado UFW en caché** del último snapshot de Postgres — sin SSH en la primera carga. Así la página permanece rápida.

| Estado | Acciones disponibles |
|--------|----------------------|
| UFW no instalado | **Actualizar estado**, luego **Instalar UFW** (si hace falta) |
| Instalado pero inactivo | **Activar UFW** |
| Instalado y activo | **Reglas**, **Actualizar estado** |

Haga clic primero en **Actualizar estado** para verificar SSH y detectar si UFW está instalado. **Instalar UFW** permanece deshabilitado hasta que una actualización exitosa indique que falta UFW.

Use **Actualizar estado** para obtener el último estado UFW por SSH y sincronizar la tabla de reglas.

Si UFW está activo pero la app **aún no tiene snapshot** (primera visita tras activar), se ejecuta una sincronización automática en segundo plano una vez para rellenar la caché.

## Editar un servidor

1. Abrir servidor → **Editar**
2. Cambiar nombre, host, puerto o identidad
3. Prueba SSH requerida antes de guardar si cambiaron los parámetros de conexión

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
