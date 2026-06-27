# Nginx Proxy Manager

Nginx Proxy Manager (NPM) должен быть **уже установлен** на вашем Docker-хосте. Этот проект не разворачивает NPM.

## Поток трафика

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, сеть Docker)
```

NPM завершает HTTPS. Приложение устанавливает HSTS в production, но полагается на NPM для сертификатов.

## Checklist Proxy Host

Создайте или обновите **Proxy Host** в интерфейсе NPM:

| Поле | Значение |
|------|----------|
| Domain Names | Хост из `APP_URL` (напр. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Рекомендуется |
| SSL | Let's Encrypt или существующий сертификат |
| Force SSL | Рекомендуется |

## Сеть Docker

Контейнер приложения должен присоединиться к **той же сети Docker**, что и NPM.

Установить в `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` подключает `ufw-app` к внешней сети `npm_proxy` → `$NPM_NETWORK`.)

Найти имя вашей сети:

```bash
docker network ls | grep -i proxy
```

## APP_URL должен совпадать

`APP_URL` в `.env` должен точно соответствовать публичному URL (схема + хост):

```bash
APP_URL=https://ufw.example.com
```

Несовпадение вызывает циклы редиректа auth или неработающие cookies.

## APP_URL vs схема Proxy Host

| Уровень | Схема | Пример |
|---------|-------|--------|
| Браузер / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → контейнер | **HTTP** | `http://ufw-app:8088` |

NPM завершает TLS. Контейнер приложения слушает незашифрованный HTTP внутри сети Docker — это **задумано**, а не ошибка конфигурации.

Устанавливайте `APP_URL` только на публичный HTTPS URL. Никогда не указывайте `APP_URL` на `http://ufw-app:8088`.

## TRUST_PROXY

При работе за NPM установите в `.env` или окружении stack Portainer:

```bash
TRUST_PROXY=1
```

Это заставляет rate limits на `/setup` использовать реальный IP клиента из `X-Forwarded-For`. См. [Переменные окружения](../administration/environment-variables.md).

## Локальная сборка (без GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Применяются те же настройки NPM Proxy Host.

## Связанная документация

- [Обзор развёртывания](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Устранение неполадок](../troubleshooting.md)
