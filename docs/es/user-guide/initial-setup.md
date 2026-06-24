# Configuración inicial

En el primer arranque, UFW Remote Manager **no tiene usuarios**. Debe crear la cuenta de administrador una sola vez.

## Página de configuración (`/setup`)

1. Abra la URL de la aplicación (p. ej. `http://localhost:3000` o su `APP_URL`)
2. Se le redirige automáticamente a `/setup`
3. Introduzca nombre, correo electrónico, contraseña y confirmación de contraseña
4. Haga clic en **Completar configuración**

Tras el éxito, queda con sesión iniciada y se le redirige a la lista de servidores.

## Política de un solo administrador

El registro queda **deshabilitado** tras existir la primera cuenta. No hay alta autogestionada para usuarios adicionales en la versión actual.

Para añadir otra persona, compartirían las credenciales de administrador (no recomendado) o operarían con una cuenta de administrador por instancia.

## Sesión e inicio de sesión

- Las sesiones duran **7 días** con renovación deslizante
- Cierre sesión mediante **Cerrar sesión** en la barra lateral
- Página de inicio de sesión: `/login`

## Primer arranque en producción

Tras desplegar detrás de HTTPS:

1. Configure NPM Proxy Host → `ufw-app:3000`
2. Establezca `APP_URL=https://your-domain.example` en `.env`
3. Abra `https://your-domain.example/setup`
4. Complete la configuración antes de exponer la URL ampliamente

Ejecute prueba de humo tras la configuración:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Documentación relacionada

- [Inicio rápido](../quick-start.md)
- [Modelo de seguridad](../administration/security-model.md)
