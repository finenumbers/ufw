# Nginx Proxy Manager

Nginx Proxy Manager (NPM) debe estar **ya instalado** en su host Docker. Este proyecto no despliega NPM.

## Flujo de tráfico

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, red Docker)
```

NPM termina HTTPS. La app establece HSTS en producción pero depende de NPM para los certificados.

## Checklist Proxy Host

Cree o actualice un **Proxy Host** en la interfaz de NPM:

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (p. ej. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recomendado |
| SSL | Let's Encrypt o certificado existente |
| Force SSL | Recomendado |

## Red Docker

El contenedor de la app debe unirse a la **misma red Docker** que NPM.

Definir en `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` conecta `ufw-app` a la red externa `npm_proxy` → `$NPM_NETWORK`.)

Encontrar el nombre de su red:

```bash
docker network ls | grep -i proxy
```

## APP_URL debe coincidir

`APP_URL` en `.env` debe coincidir exactamente con la URL pública (esquema + host):

```bash
APP_URL=https://ufw.example.com
```

La discrepancia provoca bucles de redirección de auth o cookies rotas.

## APP_URL vs esquema Proxy Host

| Capa | Esquema | Ejemplo |
|------|---------|---------|
| Navegador / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → contenedor | **HTTP** | `http://ufw-app:8088` |

NPM termina TLS. El contenedor de la app escucha HTTP sin cifrar dentro de la red Docker — es **por diseño**, no una mala configuración.

Defina `APP_URL` solo a la URL HTTPS pública. Nunca apunte `APP_URL` a `http://ufw-app:8088`.

## TRUST_PROXY

Al ejecutar detrás de NPM, definir en `.env` o entorno de stack Portainer:

```bash
TRUST_PROXY=1
```

Esto hace que los límites de tasa en `/setup` usen la IP real del cliente desde `X-Forwarded-For`. Véase [Variables de entorno](../administration/environment-variables.md).

## Build local (sin GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Se aplican los mismos ajustes de NPM Proxy Host.

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Solución de problemas](../troubleshooting.md)
