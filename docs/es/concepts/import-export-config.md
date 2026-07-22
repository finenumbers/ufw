# Importar y exportar configuración

Exporte e importe un archivo **JSON v2** con todos los servidores, identidades SSH (incluidos secretos descifrados) y metadatos relacionados. Use para copia de seguridad, migración o recuperación ante desastres — no para edición diaria de reglas.

La importación/exportación a nivel de reglas (CSV, XLSX) es independiente — consulte [Editar y aplicar reglas](../user-guide/edit-and-apply-rules.md).

## Flujo de exportación

1. Lista **Servidores** → **Guardar configuración**
2. Introduzca la **contraseña** de su cuenta (reautenticación)
3. Descargue archivo JSON (`servers-config-YYYY-MM-DD.json`)

La exportación incluye secretos SSH descifrados. Almacene el archivo cifrado en reposo; elimínelo cuando ya no lo necesite.

Un token de corta duración protege la API de descarga tras confirmación de contraseña.

Límite de tasa: 5 exportaciones por minuto por usuario.

## Flujo de importación

1. **Cargar configuración** → seleccione archivo JSON
2. La **vista previa** muestra diff: servidores e identidades a crear, actualizar o eliminar
3. Confirme con contraseña → la importación aplica cambios

La importación espera a que las colas por servidor estén inactivas y bloquea si operaciones destructivas entrarían en conflicto con trabajo activo.

## Formato JSON v2

| Sección | Contenido |
|---------|-----------|
| **version** | `2` |
| **identities** | Nombre, usuario, método de auth, secretos |
| **servers** | Nombre, host, puerto, referencia de identidad, campos de clave host |

Los archivos legacy solo array o v1 se rechazan.

Las claves duplicadas (mismo host + puerto + identidad) se rechazan al parsear.

## Semántica de eliminación en importación

Los servidores presentes en la base de datos pero ausentes del archivo importado aparecen en el conjunto **eliminar** de la vista previa. Confirme solo si pretende eliminar esos registros de servidor y todas las reglas, borradores y snapshots asociados localmente.

UFW remoto en registros de servidor eliminados **no** se modifica.

## Documentos relacionados

- [Identidades SSH](./ssh-identities.md)
- [Copia de seguridad y restauración](../operations/backup-restore.md)
- [Registro de auditoría y exportación](../administration/audit-log-and-export.md)
