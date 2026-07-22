# Introducción

**UFW Remote Manager** es una aplicación web autoalojada para gestionar **UFW (Uncomplicated Firewall)** en servidores Linux remotos por **SSH**. Edita reglas de firewall en un navegador, previsualiza cambios, confirma explícitamente y los aplica de forma segura — con un registro de auditoría completo.

Repositorio: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Versión actual: **v0.9.2**

## ¿Para quién es?

- **Administradores de sistemas** que gestionan varios servidores Linux y prefieren una interfaz estructurada a sesiones CLI `ufw` repetidas
- **Equipos pequeños** que necesitan un lugar central para borradores de firewall, vistas previas de aplicación e historial de operaciones
- **Self-hosters** que ejecutan infraestructura detrás de un proxy inverso (se recomienda Nginx Proxy Manager)

## Qué hace

| Capacidad | Descripción |
|------------|-------------|
| **Gestión SSH** | Conexión con contraseña o clave privada; fijación de clave host en la primera conexión |
| **Ciclo de vida UFW** | Detectar, instalar y activar UFW remotamente |
| **Tabla de reglas** | Editar reglas con grupos, nombres, búsqueda, filtros y reordenación por arrastre |
| **Borrador → aplicación** | Vista previa del diff, confirmación y ejecución de comandos UFW por SSH |
| **Paneles rápidos** | Las páginas de servidor cargan desde snapshots en caché en Postgres; SSH en vivo solo al actualizar |
| **Importar / exportar** | Reglas desde CSV, XLSX, JSON; configuración completa de servidor + identidad como JSON v2 |
| **Escaneo de puertos (opcional)** | Escaneo TCP externo con mapeo de cobertura UFW |
| **Seguridad** | Credenciales cifradas en reposo; registro de auditoría; contraseña de reautenticación para exportar configuración |
| **Idiomas** | Interfaz en inglés, alemán, francés, español, italiano, portugués (Brasil) y ruso |

## Qué no hace

| Expectativa | Realidad |
|-------------|----------|
| Reemplaza su proxy inverso | **No.** Nginx Proxy Manager (o similar) termina HTTPS por separado |
| Gestiona `iptables` sin UFW | **No.** Orientado a servidores donde UFW es el front-end del firewall |
| Inventario / control de contenedores Docker | **No.** Eliminado en v0.9.0 — no forma parte del alcance actual |
| SaaS multiinquilino | **No.** Self-hosted de instancia única; una cuenta admin tras la configuración |
| Cluster de alta disponibilidad | **No.** Diseñado para **una réplica de la app** (límites de tasa en memoria) |
| Cambios automáticos del firewall sin confirmación | **No.** Aplicar siempre requiere confirmación explícita del usuario |

## Inventario y estadísticas

Tras v0.9.0, **inventario** en la lista de servidores significa:

- **Reglas guardadas** — recuento de reglas almacenadas en metadatos locales (`ruleRecord`)
- **Puertos abiertos** — recuento del último escaneo externo de puertos exitoso (cuando está activado)

No hay panel de contenedores Docker ni monitorización remota de contenedores.

## Requisitos

### Host de gestión (donde corre Docker)

- Docker y Docker Compose
- Opcional: Portainer, Nginx Proxy Manager existente
- Acceso de red desde el contenedor de la app a servidores destino por SSH (puerto 22 o personalizado)
- Para escaneo de puertos: salida desde el host de la app hacia puertos TCP destino (no solo `:22`)

### Servidores destino (hosts Linux gestionados)

- Linux con UFW disponible (`apt install ufw` o equivalente)
- Acceso SSH con privilegios para ejecutar comandos `ufw`
- Puerto SSH accesible desde el host de gestión

### Producción

- URL pública **HTTPS** para la interfaz de administración (`APP_URL`)
- Secretos robustos en `.env` (nunca subirlos a git)

## Próximos pasos

- [Inicio rápido](./quick-start.md) — ejecutar localmente en Docker
- [Arquitectura](./architecture.md) — componentes, flujo de datos, concurrencia
- [Resumen de despliegue](./deployment/overview.md) — producción detrás de NPM
