# Inicio rápido

Ejecute UFW Remote Manager localmente con Docker. Esta ruta es para **evaluación y desarrollo**, no para producción.

## Requisitos previos

- Docker y Docker Compose
- Git
- Puerto **8088** libre en localhost (configurable mediante `APP_PORT`)

## 1. Clonar y configurar

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Los valores predeterminados de `.env` funcionan para uso local. Los secretos vienen predefinidos solo para desarrollo — genere otros nuevos para cualquier despliegue compartido o de producción.

## 2. Iniciar el stack

```bash
docker compose up -d --build
```

Esto inicia:

| Servicio | Función |
|---------|------|
| **postgres** | Base de datos PostgreSQL |
| **migrate** | Ejecuta `prisma migrate deploy` una vez y sale |
| **app** | Interfaz Next.js en el puerto 8088 |

Comprobar estado:

```bash
docker compose ps
docker compose logs -f app
```

## 3. Crear la cuenta de administrador

Abra **http://localhost:8088/setup**

- El registro está disponible **solo una vez** — mientras no exista ningún usuario
- Tras la configuración, `/setup` redirige al inicio de sesión
- Use una contraseña robusta; esta es la única cuenta de administrador

## 4. Crear una identidad SSH

1. Barra lateral → **Identidades SSH** → **Añadir identidad**
2. Elija autenticación: contraseña, clave privada o clave con frase de contraseña
3. Guarde — las credenciales se cifran con `APP_ENCRYPTION_KEY`

Consulte [Identidades SSH](./concepts/ssh-identities.md).

## 5. Añadir un servidor

1. Barra lateral → **Servidores** → **Añadir servidor**
2. Introduzca nombre, host, puerto y seleccione identidad
3. **Crear servidor** verifica SSH automáticamente

Si tiene éxito, llegará al panel del servidor. La insignia UFW muestra el estado en caché (vacío hasta la primera actualización).

## 6. Actualizar y trabajar con reglas

1. Haga clic en **Actualizar estado** — lectura SSH en vivo; crea el primer snapshot UFW
2. Si falta UFW, use **Instalar UFW** (tras confirmar con la actualización que no está instalado)
3. Cuando UFW esté activo, edite reglas en la tabla
4. **Vista previa de aplicación** → revisión → **Confirmar** para aplicar cambios

Si aún no existe snapshot, puede ejecutarse una **sincronización inicial** automática en segundo plano una vez — consulte [Administrar servidores](./user-guide/manage-servers.md).

## Opcional: activar escaneo de puertos localmente

Añada a `.env`:

```env
PORT_SCAN_ENABLED=true
```

Reconstruya/reinicie el contenedor de la app. El escaneo de puertos requiere Naabu y Nmap en la imagen (incluidos en el Dockerfile oficial).

## Desarrollo sin la app Docker completa

Ejecute solo Postgres en Docker, app en el host:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

La app escucha en **http://localhost:8088** (consulte `package.json`).

## Detener y restablecer

```bash
docker compose down          # detener contenedores
docker compose down -v       # detener y eliminar volumen de base de datos
```

## Próximos pasos

- [Arquitectura](./architecture.md)
- [Despliegue en producción](./deployment/overview.md)
- [Modelo de seguridad](./administration/security-model.md)
