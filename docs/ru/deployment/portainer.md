# Развёртывание через Portainer

Развёртывание с **Portainer** с использованием готовых образов **GHCR** за существующим **Nginx Proxy Manager**.

NPM не включён в этот стек.

## Предварительные требования

- Docker-хост с Portainer и NPM
- Образы GHCR из [releases](https://github.com/finenumbers/ufw/releases) (тег `latest` обновляется при каждом релизе)
- Имя Docker-сети NPM (например, `nginxproxymanager_default`)

Найдите сеть NPM:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Подготовка переменных окружения

```bash
./scripts/generate-production-env.sh .env
```

Или скопируйте [`.env.production.example`](../../../.env.production.example).

**Обязательно:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

**Опционально (образы):** `GHCR_OWNER` (по умолчанию `finenumbers`), `GHCR_IMAGE_TAG` (по умолчанию `latest`). Stack уже указывает на `:latest` — URL образов в `.env` не нужны.

## Создание стека

### Web editor

1. Portainer → **Stacks** → **Add stack**
2. Имя: `ufw-remote-manager`
3. Вставьте [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → вставьте `.env` (только секреты)
5. **Deploy the stack**

### Git repository

1. Repository URL: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Задайте переменные окружения в UI Portainer (никогда не коммитьте секреты в git)

## Настройка NPM

См. [Nginx Proxy Manager](./nginx-proxy-manager.md) — проксирование на `ufw-app:8088`.

## Обновление (без правки файлов)

1. [Резервная копия](../operations/backup-restore.md) Postgres и `.env`
2. Portainer → stack → **Update the stack**
3. Включите **Pull latest image**
4. Deploy — используется `ghcr.io/finenumbers/ufw-remote-manager:latest`

Чтобы **зафиксировать** версию, задайте `GHCR_IMAGE_TAG=v0.2.1` в environment стека.

## Проверка

1. Контейнеры стека healthy; `ufw-migrate` exited 0
2. Браузер → `APP_URL/setup` или `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Связанные документы

- [Обновление и откат](../operations/upgrade-rollback.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Модель безопасности](../administration/security-model.md)
