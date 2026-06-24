# Развёртывание через Portainer

Развёртывание с **Portainer** с использованием готовых образов **GHCR** за существующим **Nginx Proxy Manager**.

NPM не включён в этот стек.

## Предварительные требования

- Docker-хост с Portainer и NPM
- Образы GHCR из [releases](https://github.com/finenumbers/ufw/releases)
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

Обязательно: `APP_URL`, `NPM_NETWORK`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

## Создание стека

### Web editor

1. Portainer → **Stacks** → **Add stack**
2. Имя: `ufw-remote-manager`
3. Вставьте [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → вставьте содержимое `.env`
5. **Deploy the stack**

### Git repository

1. Repository URL: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Задайте переменные окружения в UI Portainer (никогда не коммитьте секреты в git)

## Настройка NPM

См. [Nginx Proxy Manager](./nginx-proxy-manager.md) — проксирование на `ufw-app:3000`.

## Проверка

1. Контейнеры стека healthy; `ufw-migrate` exited 0
2. Браузер → `APP_URL/setup` или `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Обновление и резервное копирование

- [Обновление и откат](../operations/upgrade-rollback.md)
- [Резервное копирование и восстановление](../operations/backup-restore.md)

## Связанные документы

- [GHCR + Compose](./ghcr-compose.md)
- [Модель безопасности](../administration/security-model.md)
