# Preguntas frecuentes

## General

**¿Qué es UFW Remote Manager?**  
Una interfaz web autoalojada para gestionar firewalls UFW en servidores Linux remotos por SSH, con flujo de borrador/aplicación y registro de auditoría.

**¿Es gratuito?**  
Código abierto con licencia MIT. Usted proporciona la infraestructura (host Docker, dominio, SSL).

**¿Quién lo ha desarrollado?**  
[Finenumbers](https://finenumbers.com) — consulte [Acerca de Finenumbers](./about.md).

## Cuentas

**¿Puedo crear varios usuarios administradores?**  
No mediante autorregistro. Solo se crea una cuenta en `/setup`; los registros adicionales están deshabilitados.

**He olvidado mi contraseña.**  
La recuperación requiere acceso a la base de datos o restauración desde copia de seguridad. No hay restablecimiento por correo en la configuración predeterminada.

## Despliegue

**¿Necesito una imagen Docker propia por dominio?**  
No. Configure `APP_URL` en `.env` en tiempo de ejecución. Una imagen GHCR sirve para cualquier dominio HTTPS.

**¿Esto incluye Nginx Proxy Manager?**  
No. NPM (u otro proxy inverso) debe instalarse por separado.

**¿Puedo ejecutarlo sin HTTPS?**  
El desarrollo local usa `http://localhost:3000`. Producción espera HTTPS para cookies seguras y HSTS.

## Operaciones de firewall

**¿Eliminar un servidor quita las reglas UFW remotas?**  
No. Solo se eliminan los registros locales de la base de datos.

**¿Qué pasa si la aplicación falla a mitad de camino?**  
UFW remoto puede quedar parcialmente actualizado. Use **Resincronización forzada desde el servidor** y revise el Historial de operaciones. Consulte [Flujo de borrador y aplicación](./concepts/draft-apply-workflow.md).

**¿Puedo gestionar servidores en IPs privadas?**  
Sí, configure `SSH_ALLOWED_CIDRS` en `.env` para permitir sus rangos internos.

## Datos y seguridad

**¿Dónde se almacenan las claves SSH?**  
Cifradas en Postgres con `APP_ENCRYPTION_KEY`. La clave de `.env` es obligatoria para descifrarlas.

**¿Es segura la exportación de configuración?**  
La exportación contiene **secretos en texto plano**. Se requiere volver a introducir la contraseña; guarde las exportaciones de forma segura.

## Soporte

Contacte con **[apps@finenumbers.com](mailto:apps@finenumbers.com)** para consultas sobre el producto.

Vulnerabilidades de seguridad: consulte [SECURITY.md](../../SECURITY.md) — no abra issues públicos en GitHub.
