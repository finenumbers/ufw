# Introducción

**UFW Remote Manager** es una aplicación web autoalojada para administrar **UFW (Uncomplicated Firewall)** en servidores Linux remotos mediante **SSH**. Edita reglas de firewall en el navegador, previsualiza los cambios, confírmalos explícitamente y aplícalos de forma segura, con un registro de auditoría completo.

Repositorio: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## ¿Para quién está pensado?

- **Administradores de sistemas** que gestionan varios servidores Linux y prefieren una interfaz estructurada frente a sesiones manuales de la CLI de `ufw`
- **Equipos pequeños** que necesitan un lugar central para borradores de firewall, vistas previas de aplicación e historial de operaciones
- **Usuarios autoalojados** que ejecutan su propia infraestructura detrás de un proxy inverso (se recomienda Nginx Proxy Manager)

## Qué hace

- Conectar con servidores Linux por SSH (contraseña o clave privada)
- Detectar, instalar y activar UFW de forma remota
- Cargar reglas UFW en vivo, editarlas en una tabla (con grupos, nombres, búsqueda y reordenación)
- Flujo **borrador → vista previa → confirmación → aplicación** con visualización de diferencias
- Importar reglas desde CSV, XLSX o JSON; exportar/importar la configuración completa de servidores
- Cifrar credenciales SSH en reposo; fijar claves host SSH; auditar acciones sensibles
- Interfaz multilingüe (inglés, alemán, francés, español, italiano, portugués, ruso)

## Qué no hace

| Expectativa | Realidad |
|-------------|---------|
| Sustituye su proxy inverso | **No.** Nginx Proxy Manager (o similar) termina HTTPS por separado |
| Gestiona `iptables` sin UFW | **No.** Está orientado a servidores donde UFW es la capa frontal del firewall |
| SaaS multiinquilino | **No.** Autoalojado de instancia única; una cuenta de administrador tras la configuración |
| Clúster de alta disponibilidad | **No.** Diseñado para **una sola réplica de la aplicación** (límites de tasa en memoria) |
| Cambios automáticos en el firewall sin confirmación | **No.** La aplicación siempre requiere confirmación explícita del usuario |

## Requisitos

### Host de gestión (donde se ejecuta Docker)

- Docker y Docker Compose
- Opcional: Portainer, instalación existente de Nginx Proxy Manager
- Acceso de red desde el contenedor de la aplicación a los servidores de destino por SSH (puerto 22 o personalizado)

### Servidores de destino (hosts Linux gestionados)

- Linux con UFW disponible (`apt install ufw` o equivalente)
- Acceso SSH con privilegios suficientes para ejecutar comandos `ufw`
- Conectividad saliente desde el host de gestión al puerto SSH del servidor

### Producción

- URL pública **HTTPS** para la interfaz de administración (`APP_URL`)
- Secretos robustos en `.env` (nunca subidos a git)

## Próximos pasos

- [Inicio rápido](./quick-start.md) — ejecutar localmente con Docker
- [Arquitectura](./architecture.md) — cómo encajan los componentes
- [Resumen de despliegue](./deployment/overview.md) — producción detrás de NPM
