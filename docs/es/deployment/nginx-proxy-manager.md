# Nginx Proxy Manager

Nginx Proxy Manager (NPM) debe estar **ya instalado** en su host Docker. Este proyecto no despliega NPM.

## Flujo de tráfico

```
Internet → NPM:443 (TLS) → ufw-app:3000 (HTTP, red Docker)
```

NPM termina HTTPS. La aplicación establece HSTS en producción pero depende de NPM para los certificados.

## Lista de comprobación de Proxy Host

Cree o actualice un **Proxy Host** en la interfaz de NPM:

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (p. ej. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recomendado |
| SSL | Let's Encrypt o certificado existente |
| Force SSL | Recomendado |

## Red Docker

El contenedor de la aplicación debe unirse a la **misma red Docker** que NPM.

Configure en `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` adjunta `ufw-app` a la red externa `npm_proxy` → `$NPM_NETWORK`.)

Encuentre el nombre de su red:

```bash
docker network ls | grep -i proxy
```

## APP_URL debe coincidir

`APP_URL` en `.env` debe coincidir exactamente con la URL pública (esquema + host):

```bash
APP_URL=https://ufw.example.com
```

La discrepancia provoca bucles de redirección de autenticación o cookies rotas.

## Compilación local (sin GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Se aplican los mismos ajustes de NPM Proxy Host.

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Solución de problemas](../troubleshooting.md)
