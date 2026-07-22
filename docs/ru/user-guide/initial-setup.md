# Первоначальная настройка

Первый запуск создаёт единственную учётную запись администратора. После этого регистрация навсегда отключена.

## Страница setup (`/setup`)

Доступна, когда **нет пользователя** в базе:

1. Откройте `http://localhost:8088/setup` (или ваш `APP_URL/setup`)
2. Введите email и пароль
3. Submit — вход и redirect в app

Если пользователь уже есть, `/setup` → `/login`.

## Login (`/login`)

Email и пароль из setup. Sessions — Better Auth (HTTP-only cookies).

Logout: боковая панель → **Выйти**.

## Single admin model

UI управления пользователями нет. Одна учётная запись на installation. Для shared access — team password manager и процедуры, не отдельные app users.

## Setup rate limiting

Setup attempts limited **5 per minute per client IP** против brute force на fresh installs.

За Nginx Proxy Manager в production:

```env
TRUST_PROXY=1
```

Без этого rate limits используют shared bucket и менее точны за proxy.

## Production first visit

1. Deploy stack — см. [Обзор развёртывания](../deployment/overview.md)
2. Откройте `https://your-domain/setup` (must match `APP_URL`)
3. Complete setup до широкого exposure URL
4. Run [smoke tests](../operations/smoke-tests.md)

## Связанные документы

- [Быстрый старт](../quick-start.md)
- [Модель безопасности](../administration/security-model.md)
