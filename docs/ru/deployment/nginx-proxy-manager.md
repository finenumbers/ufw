# Nginx Proxy Manager

Nginx Proxy Manager (NPM) должен быть **уже установлен** на вашем Docker-хосте. Этот проект не разворачивает NPM.

## Поток трафика

```
Internet → NPM:443 (TLS) → ufw-app:3000 (HTTP, Docker network)
```

NPM завершает HTTPS. Приложение устанавливает HSTS в продакшене, но полагается на NPM для сертификатов.

## Чеклист Proxy Host

Создайте или обновите **Proxy Host** в UI NPM:

| Поле | Значение |
|------|----------|
| Domain Names | Хост из `APP_URL` (например, `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recommended |
| SSL | Let's Encrypt or existing certificate |
| Force SSL | Recommended |

## Docker network

Контейнер приложения должен быть в **той же Docker-сети**, что и NPM.

Задайте в `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` подключает `ufw-app` к внешней сети `npm_proxy` → `$NPM_NETWORK`.)

Найдите имя вашей сети:

```bash
docker network ls | grep -i proxy
```

## APP_URL должен совпадать

`APP_URL` в `.env` должен точно совпадать с публичным URL (схема + хост):

```bash
APP_URL=https://ufw.example.com
```

Несовпадение вызывает циклы перенаправления auth или неработающие cookies.

## Локальная сборка (без GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Те же настройки NPM Proxy Host применимы.

## Связанные документы

- [Обзор развёртывания](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Устранение неполадок](../troubleshooting.md)
