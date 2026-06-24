# Inicio rápido (local)

Ejecute UFW Remote Manager en su máquina con Docker. Esta ruta es para **evaluación y desarrollo**, no para producción.

## 1. Clonar y configurar

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

El `.env` predeterminado usa valores adecuados para desarrollo. **No** use estos valores predeterminados en producción.

## 2. Iniciar el stack

```bash
docker compose up -d --build
```

Espere hasta que todos los contenedores estén en estado healthy:

```bash
docker compose ps
```

Debería ver `ufw-postgres` (healthy), `ufw-migrate` (exited 0) y `ufw-app` (healthy).

## 3. Abrir la interfaz

Abra **http://localhost:8088** en su navegador.

- **Primera visita:** `/setup` — cree la única cuenta de administrador
- **Visitas posteriores:** `/login`

## 4. Primer flujo en la interfaz

1. **Identidades SSH** (`/identities`) — cree credenciales (contraseña o clave privada)
2. **Añadir servidor** — elija la identidad, introduzca host/puerto; la prueba SSH se ejecuta antes de guardar
3. En la página del servidor — instale/active UFW si es necesario, luego abra **Reglas**
4. Edite reglas, ejecute la vista previa de aplicación y confirme para enviar los cambios por SSH

## Comandos útiles

```bash
docker compose logs -f app          # registros de la aplicación
docker compose down                 # detener el stack
docker compose down -v              # detener y eliminar el volumen de la base de datos
```

## Desarrollo en el host (opcional)

Ejecute solo Postgres en Docker y la aplicación en el host:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Use el puerto **5434** en `DATABASE_URL` para acceso desde el host (consulte `.env.example`).

## Producción

Para despliegue HTTPS detrás de Nginx Proxy Manager, consulte [Resumen de despliegue](./deployment/overview.md).
