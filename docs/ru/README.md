# UFW Remote Manager — Документация (русский)

Полное руководство для администраторов и операторов. Соответствует **v0.9.6**.

## Начало работы

| Документ | Описание |
|----------|----------|
| [Введение](./introduction.md) | Область продукта, требования, ограничения |
| [Быстрый старт](./quick-start.md) | Локальный запуск в Docker за минуты |
| [Архитектура](./architecture.md) | Компоненты, cache-first SSR, модель данных, конкурентность |

## Концепции

| Документ | Описание |
|----------|----------|
| [SSH-идентификации](./concepts/ssh-identities.md) | Переиспользуемые зашифрованные учётные данные |
| [Серверы и SSH](./concepts/servers-and-ssh.md) | Проверка хоста, host keys, верификация |
| [Правила UFW и состояния](./concepts/ufw-rules-and-states.md) | Модель правил и цвета origin-state |
| [Черновик и применение](./concepts/draft-apply-workflow.md) | Редактирование, предпросмотр, подтверждение, apply по SSH |
| [Импорт и экспорт конфигурации](./concepts/import-export-config.md) | Полный резерв JSON v2 |
| [Операции и конкурентность](./concepts/operations-and-concurrency.md) | Баннер, polling, очереди, rate limits |

## Руководство пользователя

| Документ | Описание |
|----------|----------|
| [Первоначальная настройка](./user-guide/initial-setup.md) | Первая учётная запись администратора и вход |
| [Управление серверами](./user-guide/manage-servers.md) | Добавление, редактирование, удаление; dashboard и sync |
| [Редактирование и применение правил](./user-guide/edit-and-apply-rules.md) | Таблица, импорт, предпросмотр apply |
| [История операций](./user-guide/operations-history.md) | Баннер прогресса и страница истории |
| [Сканирование портов](./user-guide/port-scan.md) | Результаты внешнего сканирования и покрытие UFW |

## Администрирование

| Документ | Описание |
|----------|----------|
| [Модель безопасности](./administration/security-model.md) | Шифрование, аутентификация, сетевая экспозиция |
| [Переменные окружения](./administration/environment-variables.md) | Полный справочник runtime-конфигурации |
| [Журнал аудита и экспорт](./administration/audit-log-and-export.md) | События аудита и step-up export |

## Развёртывание

| Документ | Описание |
|----------|----------|
| [Обзор](./deployment/overview.md) | Выбор способа развёртывания |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Pull готовых образов (рекомендуется) |
| [Portainer](./deployment/portainer.md) | Развёртывание через stack Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Чеклист HTTPS reverse proxy |
| [Внешнее сканирование портов](./deployment/port-scan.md) | Включение scan, сеть, таймауты |

## Эксплуатация

| Документ | Описание |
|----------|----------|
| [Резервное копирование и восстановление](./operations/backup-restore.md) | Бэкапы Postgres и `.env` |
| [Обновление и откат](./operations/upgrade-rollback.md) | Обновления версий и восстановление |
| [Smoke-тесты](./operations/smoke-tests.md) | Проверка после развёртывания |

## Справочник

| Документ | Описание |
|----------|----------|
| [FAQ](./faq.md) | Частые вопросы |
| [Устранение неполадок](./troubleshooting.md) | Симптом → причина → решение |
| [О Finenumbers](./about.md) | Автор и контакты |

---

Разработано **[Finenumbers](https://finenumbers.com)** — оператор бизнес-телефонии · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Другие языки: [Центр документации](../README.md)
