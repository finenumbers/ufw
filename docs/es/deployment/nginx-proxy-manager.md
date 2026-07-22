# Nginx Proxy Manager

Nginx Proxy Manager (NPM) debe estar **ya instalado** en su host Docker. Este proyecto no despliega NPM.

## Flujo de tráfico

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, red Docker)
```

NPM termina HTTPS. La app configura HSTS en producción pero depende de NPM para certificados.

## Lista de comprobación Proxy Host

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (p. ej. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Activado** |
| Block Common Exploits | Recomendado |
| SSL | Let's Encrypt o certificado existente |
| Force SSL | Recomendado |

## Red Docker

El contenedor de la app debe unirse a la **misma red Docker** que NPM.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` adjunta `ufw-app` a la red externa de `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL debe coincidir

```bash
APP_URL=https://ufw.example.com
```

Debe coincidir exactamente con el dominio del Proxy Host NPM (esquema + host). Las cookies Better Auth dependen de esto.

## HTTP interno es intencional

NPM termina TLS. El tráfico NPM → `ufw-app:8088` es HTTP sin cifrar en la red Docker — **por diseño**, no es mala configuración.

**No** configure `APP_URL` a `http://ufw-app:8088`.

## TRUST_PROXY

Configure en el entorno de la app cuando esté detrás de NPM:

```env
TRUST_PROXY=1
```

Asegura que los límites de setup usen la IP real del cliente desde `X-Forwarded-For`.

## Alternativa build local

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

La misma lista de comprobación NPM aplica.

## Documentos relacionados

- [Variables de entorno](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
