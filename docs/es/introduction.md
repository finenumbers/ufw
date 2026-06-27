# Introducción

**UFW Remote Manager** es una aplicación web autoalojada para gestionar **UFW (Uncomplicated Firewall)** en servidores Linux remotos por **SSH**. Edita reglas de firewall en un navegador, previsualiza cambios, confirma explícitamente y los aplica de forma segura — con un registro de auditoría completo.

Repositorio: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## ¿Para quién es?

- **Administradores de sistemas** que gestionan varios servidores Linux y prefieren una interfaz estructurada a sesiones CLI `ufw` manuales
- **Equipos pequeños** que necesitan un lugar central para borradores de firewall, vistas previas de aplicación e historial de operaciones
- **Self-hosters** que ejecutan su propia infraestructura detrás de un proxy inverso (se recomienda Nginx Proxy Manager)

## Qué hace

- Conectar a servidores Linux por SSH (contraseña o clave privada)
- Detectar, instalar y activar UFW remotamente
- Cargar reglas UFW en vivo, editarlas en una tabla (con grupos, nombres, búsqueda, reordenación)
- Flujo **borrador → vista previa → confirmación → aplicación** con visualización de diff
- Carga rápida del panel del servidor desde snapshots UFW en caché (SSH en vivo solo al actualizar)
- Importar reglas desde CSV, XLSX o JSON; exportar/importar configuración completa de servidores
- Cifrar credenciales SSH en reposo; fijar claves de host SSH; auditar acciones sensibles
- Interfaz multilingüe (inglés, alemán, francés, español, italiano, portugués, ruso)

## Qué no hace

| Expectativa | Realidad |
|-------------|----------|
| Reemplaza su proxy inverso | **No.** Nginx Proxy Manager (o similar) termina HTTPS por separado |
| Gestiona `iptables` sin UFW | **No.** Orientado a servidores donde UFW es el front-end del firewall |
| SaaS multiinquilino | **No.** Self-hosted de instancia única; una cuenta admin tras la configuración |
| Cluster de alta disponibilidad | **No.** Diseñado para **una réplica de la app** (límites de tasa en memoria) |
| Cambios automáticos del firewall sin confirmación | **No.** Aplicar siempre requiere confirmación explícita del usuario |

## Requisitos

### Host de gestión (donde corre Docker)

- Docker y Docker Compose
- Opcional: Portainer, instalación existente de Nginx Proxy Manager
- Acceso de red desde el contenedor de la app a servidores destino por SSH (puerto 22 o personalizado)

### Servidores destino (hosts Linux gestionados)

- Linux con UFW disponible (`apt install ufw` o equivalente)
- Acceso SSH con privilegios suficientes para ejecutar comandos `ufw`
- Conectividad saliente desde el host de gestión al puerto SSH del servidor

### Producción

- URL **HTTPS** pública para la interfaz de administración (`APP_URL`)
- Secretos robustos en `.env` (nunca commiteados en git)

## Próximos pasos

- [Inicio rápido](./quick-start.md) — ejecutar localmente en Docker
- [Arquitectura](./architecture.md) — cómo encajan los componentes
- [Resumen de despliegue](./deployment/overview.md) — producción detrás de NPM
