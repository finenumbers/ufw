# Servidores y SSH

Un registro de **servidor** almacena nombre visible, host, puerto, identidad SSH y huella opcional de clave host. Todo el trabajo UFW remoto pasa por este registro.

## Validación de host

Antes de guardar, la app valida el host destino:

| Comprobación | Comportamiento predeterminado |
|--------------|------------------------------|
| Rangos IP privados | **Rechazados** (RFC1918, loopback, link-local) |
| IPs de metadatos cloud | **Rechazadas** |
| Hostnames / IPs públicos | Permitidos |
| Lista blanca personalizada | Configure `SSH_ALLOWED_CIDRS` para rangos privados específicos (lab/VPN) |

La resolución DNS se valida cuando corresponde para detectar errores tipográficos pronto.

## AmneziaWG

La página AmneziaWG lista los nodos que van por el túnel y las rutas /32 instaladas en `awg0`. Quitar un nodo borra esa elección y su ruta de host sin otra comprobación SSH. El nodo sigue en el inventario. Las conexiones siguientes usan la ruta normal, así que una dirección que solo existe en la VPN puede dejar de alcanzarse. Las direcciones privadas siguen rechazadas en el camino directo, salvo que la política SSH las permita. La casilla del formulario del nodo sigue comprobando la clave host guardada. El nombre o la dirección pública del endpoint de AmneziaWG se rechaza. Ese mismo servidor se indica por el túnel con su IPv4 dentro de la VPN.

## Verificación de conexión

**Crear servidor** y **Editar servidor** (cuando cambian host, puerto o identidad) ejecutan una prueba de conexión SSH automáticamente. No hay botón separado *Probar conexión* en el formulario de edición.

Los mensajes de error apuntan a accesibilidad, credenciales, firewall o validación de host — consulte [Solución de problemas](../troubleshooting.md).

## Claves host SSH (confianza en el primer uso)

En la primera conexión exitosa, se almacena la huella de la clave host del servidor y se marca como **verificada**.

| Estado | Interfaz | Aplicar reglas |
|--------|----------|----------------|
| **Verificada** | Huella mostrada en página de edición | Permitido tras actualizar |
| **Sin verificar** | Advertencia en panel y página de edición | **Guardar reglas** (aplicar) bloqueado hasta que **Actualizar estado** tenga éxito |

Esto reduce el riesgo MITM en la primera conexión. Para confiar en una clave nueva tras reconstruir el servidor, actualice el servidor o borre y vuelva a verificar mediante actualización.

Los servidores importados desde configuración pueden llegar con huellas almacenadas — verifique con **Actualizar estado** antes de aplicar reglas.

## Sudo y UFW

Los comandos remotos asumen que el usuario SSH puede ejecutar `ufw` — típicamente mediante sudo sin contraseña para `ufw` o como root. La app envuelve comandos apt install en `sudo` cuando hace falta para **Instalar UFW**.

Asegúrese de que `/etc/sudoers` permita los comandos requeridos para su usuario elegido.

## Servidores duplicados

La misma combinación host + puerto + identidad no puede registrarse dos veces. Use nombres distintos si gestiona intencionalmente el mismo host con cuentas diferentes (identidades diferentes).

## Documentos relacionados

- [Identidades SSH](./ssh-identities.md)
- [Administrar servidores](../user-guide/manage-servers.md)
- [Variables de entorno](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
