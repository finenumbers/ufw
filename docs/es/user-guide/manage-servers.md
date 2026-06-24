# Administrar servidores

Esta guía recorre el ciclo de vida del servidor: añadir, configurar UFW, actualizar, editar y eliminar.

## Requisitos previos

Cree al menos una [identidad SSH](../concepts/ssh-identities.md) antes de añadir un servidor.

## Añadir un servidor

1. Barra lateral → **Servidores** o haga clic en **Añadir servidor**
2. Complete nombre, host, puerto y seleccione una identidad
3. Haga clic en **Crear servidor** — la prueba SSH se ejecuta automáticamente
4. Tras el éxito, llega al panel del servidor

Si la prueba SSH falla, compruebe alcance del host, credenciales, firewall que permita SSH desde el host Docker y [validación de host](../concepts/servers-and-ssh.md).

## Panel del servidor

El panel muestra el estado de UFW:

| Estado | Acciones disponibles |
|--------|-------------------|
| UFW no instalado | **Instalar UFW** |
| Instalado pero inactivo | **Activar UFW** |
| Instalado y activo | **Reglas**, actualizar estado, probar SSH |

Use **Actualizar estado** para obtener el último estado UFW y sincronizar la tabla de reglas.

## Editar un servidor

1. Abra el servidor → **Editar**
2. Cambie nombre, host, puerto o identidad
3. Prueba SSH obligatoria antes de guardar si cambiaron parámetros de conexión

## Eliminar un servidor

**Zona de peligro** en la página de edición o ajustes del servidor:

- Elimina todas las reglas locales, borradores y snapshots de este servidor
- **No** modifica UFW remoto

Confirme solo si desea eliminar datos de gestión, no para borrar reglas de firewall remotas.

## Herramientas de la lista de servidores

Desde la página principal de servidores puede:

- **Guardar configuración** / **Cargar configuración** — exportación/importación JSON completa (consulte [Importar y exportar configuración](../concepts/import-export-config.md))

## Documentación relacionada

- [Servidores y SSH](../concepts/servers-and-ssh.md)
- [Editar y aplicar reglas](./edit-and-apply-rules.md)
