# Servidores y SSH

Un registro de **servidor** representa un host Linux que gestiona. La aplicación se conecta por SSH para ejecutar comandos UFW y leer el estado del cortafuegos.

## Campos del servidor

| Campo | Propósito |
|-------|-----------|
| **Nombre** | Etiqueta visible en la barra lateral |
| **Host** | Dirección IP o nombre DNS (validado antes de guardar) |
| **Puerto** | Puerto SSH (22 por defecto) |
| **Identidad SSH** | Credenciales usadas para la conexión |

## Validación del host (protección SSRF)

Antes de guardar un servidor, el host se valida:

- Los rangos IP privados (10.x, 172.16–31, 192.168.x) están **bloqueados** por defecto
- Las direcciones link-local y de metadatos en la nube están bloqueadas
- Las direcciones IPv6 mapeadas a IPv4 privadas están bloqueadas
- Lista blanca opcional: establezca `SSH_ALLOWED_CIDRS` en `.env` (p. ej. `10.0.0.0/8`) para redes internas

Esto evita que la aplicación se abuse como proxy para escanear redes internas.

## Comprobación de resolución DNS

La validación ocurre en dos etapas:

1. **Al guardar** — se comprueba la cadena del nombre de host (literales privados, hosts de metadatos, lista blanca CIDR opcional).
2. **Antes de conectar** — el nombre de host se resuelve a IP y la **dirección resuelta** se comprueba con las mismas reglas.

Esto cierra brechas de DNS rebinding donde un nombre de host público luego se resuelve a una IP privada o de metadatos.

## Test SSH antes de guardar

Crear o actualizar un servidor (host, puerto o cambio de identidad) requiere un **test de conexión SSH** exitoso. La UI bloquea el guardado hasta que el test pase.

## Fijación de clave de host SSH

En la primera conexión exitosa, se almacena la huella de la clave de host SSH del servidor.

| Estado | Significado |
|--------|-------------|
| **Verificado** | Clave registrada tras test SSH exitoso u operación normal |
| **No verificado** | Clave importada desde archivo de configuración — ejecute el test SSH para verificar |

Si la clave de host remota cambia (reinstalación, MITM), la siguiente conexión falla hasta que investigue.

## Qué hace eliminar un servidor

Eliminar un servidor quita **solo** datos locales:

- Reglas borrador, snapshots, sesiones de aplicación, historial de operaciones de ese servidor

**No** modifica las reglas UFW en el host Linux remoto. El estado del cortafuegos remoto permanece igual.

## Ciclo de vida UFW en un servidor

Desde el panel del servidor puede:

1. **Detectar** UFW — ¿instalado? ¿activo?
2. **Instalar** UFW si falta
3. **Activar** UFW y sincronizar reglas

La edición de reglas solo está disponible cuando UFW está instalado **y** activo.

## Documentación relacionada

- [Identidades SSH](./ssh-identities.md)
- [Gestionar servidores](../user-guide/manage-servers.md)
- [Solución de problemas](../troubleshooting.md)
