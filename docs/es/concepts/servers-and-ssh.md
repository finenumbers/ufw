# Servidores y SSH

Un registro de **servidor** representa un host Linux que gestiona. La aplicación se conecta por SSH para ejecutar comandos UFW y leer el estado del firewall.

## Campos del servidor

| Campo | Propósito |
|-------|---------|
| **Nombre** | Etiqueta visible en la barra lateral |
| **Host** | Dirección IP o nombre DNS (validado antes de guardar) |
| **Puerto** | Puerto SSH (predeterminado 22) |
| **Identidad SSH** | Credenciales usadas para la conexión |

## Validación de host (protección SSRF)

Antes de guardar un servidor, se valida el host:

- Los rangos de IP privada (10.x, 172.16–31, 192.168.x) están **bloqueados** por defecto
- Se bloquean direcciones link-local y de metadatos en la nube
- Se bloquean direcciones IPv6 mapeadas a IPv4 privadas
- Lista de permitidos opcional: configure `SSH_ALLOWED_CIDRS` en `.env` (p. ej. `10.0.0.0/8`) para redes internas

Esto evita que la aplicación se use como proxy para escanear redes internas.

## Prueba SSH antes de guardar

Crear o actualizar un servidor (cambio de host, puerto o identidad) requiere una **prueba de conexión SSH** exitosa. La interfaz bloquea el guardado hasta que la prueba pase.

## Fijación de clave host SSH

En la primera conexión exitosa, se almacena la huella de la clave host SSH del servidor.

| Estado | Significado |
|-------|---------|
| **Verificada** | Clave registrada tras prueba SSH exitosa u operación normal |
| **No verificada** | Clave importada desde archivo de configuración — ejecute prueba SSH para verificar |

Si la clave host remota cambia (reinstalación, MITM), la siguiente conexión fallará hasta que investigue.

## Qué hace eliminar un servidor

Eliminar un servidor quita **solo datos locales**:

- Reglas borrador, snapshots, sesiones de aplicación e historial de operaciones de ese servidor

**No** modifica las reglas UFW en el host Linux remoto. El estado del firewall remoto permanece igual.

## Ciclo de vida de UFW en un servidor

Desde el panel del servidor puede:

1. **Detectar** UFW — ¿instalado? ¿activo?
2. **Instalar** UFW si falta
3. **Activar** UFW y sincronizar reglas

La edición de reglas está disponible solo cuando UFW está instalado **y** activo.

## Documentación relacionada

- [Identidades SSH](./ssh-identities.md)
- [Administrar servidores](../user-guide/manage-servers.md)
- [Solución de problemas](../troubleshooting.md)
