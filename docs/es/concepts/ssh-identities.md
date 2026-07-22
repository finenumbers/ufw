# Identidades SSH

Una **identidad SSH** almacena credenciales de conexión reutilizables: nombre de usuario, método de autenticación y secretos cifrados. Cada **servidor** referencia una identidad.

## Métodos de autenticación

| Método | Secreto almacenado | Uso típico |
|--------|-------------------|------------|
| **Contraseña** | Contraseña SSH | Laboratorio simple o hosts heredados |
| **Clave privada** | Clave privada PEM | Claves de producción sin frase de contraseña |
| **Clave privada + frase de contraseña** | Clave y frase de contraseña | Claves privadas cifradas |

Los secretos se cifran en reposo con **AES-256-GCM** usando `APP_ENCRYPTION_KEY`. Solo se descifran en memoria al abrir una conexión SSH.

## Crear y editar

1. Barra lateral → **Identidades SSH**
2. **Añadir identidad** o abra una fila existente → **Editar**
3. Campos obligatorios: nombre visible, usuario SSH, método de auth, secreto(s)

Al **editar**, dejar campos de contraseña/clave vacíos conserva el secreto existente sin cambios.

La validación rechaza nombres vacíos y combinaciones de auth inválidas antes de guardar.

## Vinculación a servidores

Al crear o editar un servidor, seleccione una identidad del desplegable. Cambiar la identidad de un servidor activa verificación SSH al guardar si cambiaron parámetros de conexión.

## Eliminar una identidad

La eliminación se bloquea mientras algún servidor siga referenciando la identidad. La interfaz lista servidores vinculados. Reasigne o elimine esos servidores primero.

## Notas de seguridad

- Los secretos de identidad aparecen en la **exportación de configuración** (JSON v2) tras confirmación de contraseña — trate las exportaciones como altamente sensibles
- Rotar `APP_ENCRYPTION_KEY` sin volver a introducir secretos hace ilegible el texto cifrado existente — planifique la rotación de claves con cuidado
- Una identidad puede compartirse entre muchos servidores (mismo usuario admin, misma clave)

## Documentos relacionados

- [Servidores y SSH](./servers-and-ssh.md)
- [Importar y exportar configuración](./import-export-config.md)
- [Modelo de seguridad](../administration/security-model.md)
