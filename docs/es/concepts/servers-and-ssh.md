# Servidores y SSH

Un registro de **servidor** representa un host Linux que gestiona. La app se conecta por SSH para ejecutar comandos UFW y leer el estado del firewall.

## Campos del servidor

| Campo | Propósito |
|-------|-----------|
| **Nombre** | Etiqueta mostrada en la barra lateral |
| **Host** | Dirección IP o nombre DNS (validado antes de guardar) |
| **Puerto** | Puerto SSH (22 por defecto) |
| **Identidad SSH** | Credenciales usadas para la conexión |

## Validación de host (protección SSRF)

Antes de guardar un servidor, se valida el host:

- Los rangos IP privados (10.x, 172.16–31, 192.168.x) están **bloqueados** por defecto
- Las direcciones link-local y de metadatos cloud están bloqueadas
- Las direcciones privadas IPv6 mapeadas a IPv4 están bloqueadas
- Lista blanca opcional: establezca `SSH_ALLOWED_CIDRS` en `.env` (p. ej. `10.0.0.0/8`) para redes internas

Esto evita que la aplicación se use como proxy para escanear redes internas.

## Comprobación de resolución DNS

La validación ocurre en dos etapas:

1. **Al guardar** — se comprueba la cadena del nombre de host (literales privados, hosts de metadatos, lista blanca CIDR opcional).
2. **Antes de conectar** — el nombre de host se resuelve a IP y la **dirección resuelta** se comprueba con las mismas reglas.

Esto cierra brechas de DNS rebinding donde un nombre de host público luego se resuelve a una IP privada o de metadatos.

## Verificación SSH al guardar

Crear o actualizar un servidor (cambio de host, puerto o identidad) ejecuta automáticamente una **prueba de conexión SSH al enviar**. No hay un botón de prueba separado — guardar está bloqueado hasta que la verificación tenga éxito.

En la primera verificación exitosa, se almacena la huella de la clave de host y el servidor se marca como **Verificado**.

## Fijación de clave de host SSH

| Estado | Significado |
|--------|-------------|
| **Verificado** | Clave registrada tras guardado exitoso al crear/actualizar o **Actualizar estado** |
| **No verificado** | Clave importada desde la configuración — ejecute **Actualizar estado** en el panel del servidor para verificar |

La página de edición muestra la huella y una advertencia no verificada cuando corresponda, pero no ejecuta la verificación hasta que guarde ajustes de conexión modificados o use **Actualizar estado** en el panel.

Si la clave de host remota cambia (reinstalación, MITM), la siguiente conexión falla hasta que investigue.

## Qué hace eliminar un servidor

Eliminar un servidor quita **solo datos locales**:

- Reglas borrador, snapshots, sesiones de aplicación, historial de operaciones de ese servidor

**No cambia** las reglas UFW en el host Linux remoto. El estado del firewall remoto permanece igual.

## Ciclo de vida UFW en un servidor

Desde el panel del servidor puede:

1. **Actualizar estado** — detectar si UFW está instalado y activo (usa snapshot en caché hasta actualizar)
2. **Instalar UFW** si falta — instalación y activación se ejecutan juntas en una operación
3. Editar y aplicar reglas cuando UFW está instalado **y** activo

La edición de reglas solo está disponible cuando UFW está instalado **y** activo.

## Documentación relacionada

- [Identidades SSH](./ssh-identities.md)
- [Gestionar servidores](../user-guide/manage-servers.md)
- [Solución de problemas](../troubleshooting.md)
