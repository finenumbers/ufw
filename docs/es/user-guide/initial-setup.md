# Configuración inicial

El primer arranque crea la única cuenta de administrador. Después, el registro queda desactivado permanentemente.

## Página de configuración (`/setup`)

Disponible cuando **no existe ningún usuario** en la base de datos:

1. Abra `http://localhost:8088/setup` (o su `APP_URL/setup`)
2. Introduzca correo y contraseña
3. Envíe — quedará autenticado y redirigido a la app

Si ya existe un usuario, `/setup` redirige a `/login`.

## Inicio de sesión (`/login`)

Use el correo y contraseña de la configuración. Las sesiones las gestiona Better Auth (cookies HTTP-only).

Cerrar sesión: barra lateral → **Cerrar sesión**.

## Modelo de administrador único

No hay interfaz de gestión de usuarios. Una cuenta por instalación. Para acceso compartido, use un gestor de contraseñas de equipo y procedimientos operativos — no usuarios separados de la app.

## Límite de tasa de setup

Los intentos de setup están limitados a **5 por minuto por IP cliente** para ralentizar fuerza bruta en instalaciones nuevas.

Cuando la app corre detrás de Nginx Proxy Manager en producción, configure:

```env
TRUST_PROXY=1
```

Sin ello, los límites de tasa usan un bucket compartido único y pueden ser menos precisos detrás de un proxy.

## Primera visita en producción

1. Despliegue el stack — consulte [Resumen de despliegue](../deployment/overview.md)
2. Abra `https://su-dominio/setup` (debe coincidir con `APP_URL`)
3. Complete la configuración antes de exponer la URL ampliamente
4. Ejecute [pruebas de humo](../operations/smoke-tests.md)

## Documentos relacionados

- [Inicio rápido](../quick-start.md)
- [Modelo de seguridad](../administration/security-model.md)
