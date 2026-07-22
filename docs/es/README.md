# UFW Remote Manager — Documentación (Español)

Guía completa para administradores y operadores. Alineada con la **v0.9.6**.

## Primeros pasos

| Documento | Descripción |
|----------|-------------|
| [Introducción](./introduction.md) | Alcance del producto, requisitos, qué no hace |
| [Inicio rápido](./quick-start.md) | Configuración local con Docker en minutos |
| [Arquitectura](./architecture.md) | Componentes, SSR cache-first, modelo de datos, concurrencia |

## Conceptos

| Documento | Descripción |
|----------|-------------|
| [Identidades SSH](./concepts/ssh-identities.md) | Credenciales reutilizables cifradas |
| [Servidores y SSH](./concepts/servers-and-ssh.md) | Validación de host, claves host, verificación |
| [Reglas UFW y estados](./concepts/ufw-rules-and-states.md) | Modelo de reglas y colores de estado de origen |
| [Flujo de borrador y aplicación](./concepts/draft-apply-workflow.md) | Edición, vista previa, confirmación, aplicación por SSH |
| [Importar y exportar configuración](./concepts/import-export-config.md) | Copia de seguridad JSON v2 completa |
| [Operaciones y concurrencia](./concepts/operations-and-concurrency.md) | Banner, sondeo, colas, límites de tasa |

## Guía de usuario

| Documento | Descripción |
|----------|-------------|
| [Configuración inicial](./user-guide/initial-setup.md) | Primera cuenta de administrador e inicio de sesión |
| [Administrar servidores](./user-guide/manage-servers.md) | Añadir, editar, eliminar; panel y sincronización |
| [Editar y aplicar reglas](./user-guide/edit-and-apply-rules.md) | Edición en tabla, importación, vista previa de aplicación |
| [Historial de operaciones](./user-guide/operations-history.md) | Banner de progreso y página de historial |
| [Escaneo de puertos](./user-guide/port-scan.md) | Resultados del escaneo externo y cobertura UFW |

## Administración

| Documento | Descripción |
|----------|-------------|
| [Modelo de seguridad](./administration/security-model.md) | Cifrado, autenticación, exposición de red |
| [Variables de entorno](./administration/environment-variables.md) | Referencia completa de configuración en tiempo de ejecución |
| [Registro de auditoría y exportación](./administration/audit-log-and-export.md) | Eventos de auditoría y exportación con reautenticación |

## Despliegue

| Documento | Descripción |
|----------|-------------|
| [Resumen](./deployment/overview.md) | Elija un método de despliegue |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Descargar imágenes precompiladas (recomendado) |
| [Portainer](./deployment/portainer.md) | Desplegar mediante stack de Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Lista de comprobación del proxy inverso HTTPS |
| [Escaneo externo de puertos](./deployment/port-scan.md) | Activar escaneo de puertos, red, tiempos de espera |

## Operaciones

| Documento | Descripción |
|----------|-------------|
| [Copia de seguridad y restauración](./operations/backup-restore.md) | Copias de seguridad de Postgres y `.env` |
| [Actualización y reversión](./operations/upgrade-rollback.md) | Actualizaciones de versión y recuperación |
| [Pruebas de humo](./operations/smoke-tests.md) | Verificación posterior al despliegue |

## Referencia

| Documento | Descripción |
|----------|-------------|
| [Preguntas frecuentes](./faq.md) | Preguntas habituales |
| [Solución de problemas](./troubleshooting.md) | Síntoma → causa → solución |
| [Acerca de Finenumbers](./about.md) | Autor y contacto |

---

Desarrollado por **[Finenumbers](https://finenumbers.com)** — operador de telefonía empresarial para empresas · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Otros idiomas: [Centro de documentación](../README.md)
