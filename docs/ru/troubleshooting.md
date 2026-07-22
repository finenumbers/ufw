# Устранение неполадок

Симптом → вероятная причина → решение. Концепции — в связанных документах.

## Аутентификация и настройка

| Симптом | Причина | Решение |
|---------|---------|---------|
| `/setup` перенаправляет на login | Пользователь уже существует | Используйте `/login` |
| Ошибка входа после deploy | Неверный `APP_URL` или HTTP вместо HTTPS | Совпадение с доменом NPM; `APP_URL=https://...` |
| Слишком жёсткий setup rate limit | Нет `TRUST_PROXY` за NPM | `TRUST_PROXY=1` |

## SSH и создание сервера

| Симптом | Причина | Решение |
|---------|---------|---------|
| Private IP отклонён | Проверка хоста | Публичный IP/hostname или `SSH_ALLOWED_CIDRS` |
| Connection refused | Firewall, неверный port, host down | С хоста Docker: `ssh -p PORT user@host` |
| Auth failed | Неверные credentials identity | Измените identity; введите секрет заново |
| Предупреждение host key | Первое подключение или rebuild сервера | **Обновить статус** для нового fingerprint |

## UFW и правила

| Симптом | Причина | Решение |
|---------|---------|---------|
| Apply отключён | Host key не проверен | **Обновить статус** |
| Apply отклонён после preview | Remote UFW изменился | Снова **Apply preview** |
| Частичный apply | Прерванные команды или sync | **Принудительная синхронизация с сервером**; история операций |
| Preview показывает неожиданные delete | Draft drift | **Принудительная синхронизация с сервером** |
| Правила возвращаются после delete на сервере | Stale sync (до v0.9.2) | Обновление до v0.9.2+; force resync |
| Потерян SSH-доступ | Применено deny rule | Console; исправьте UFW out-of-band |

## Баннер операций

| Симптом | Причина | Решение |
|---------|---------|---------|
| Баннер ВЫПОЛНЯЕТСЯ бесконечно | Браузер отключился mid-op | Обновите страницу; дождитесь sweeper |
| Таблица stale после sync | Конец операции не обнаружен (редко после v0.9.2) | Обновите браузер |
| Idle API traffic | Старая версия poll forever | Обновление v0.9.2 — idle poll прекращается |

## Сканирование портов

| Симптом | Причина | Решение |
|---------|---------|---------|
| Панель отсутствует | Feature disabled | `PORT_SCAN_ENABLED=true` |
| Scan failed timeout | Большой диапазон / медленная сеть | Увеличьте `PORT_SCAN_*_TIMEOUT_MS`; проверьте egress |
| Scan in progress error | Overlap guard | Дождитесь текущего scan |
| Нет findings | Все порты filtered/closed | Ожидаемо; проверьте SUCCESS scan |
| Progress lost on refresh (старое) | SSR загружал только SUCCESS scans | Обновление v0.9.2 |

## Docker и migrate

| Симптом | Причина | Решение |
|---------|---------|---------|
| `EACCES` prisma в app | Неверный container | `docker compose run --rm migrate` |
| Migrate fails on upgrade | DB permissions или старая версия | `docker compose logs migrate` |
| App unhealthy | Плохие secrets или DB down | `docker compose logs app` |

## Import/export конфигурации

| Симптом | Причина | Решение |
|---------|---------|---------|
| Import blocked | Активные операции на сервере | Дождитесь idle queue |
| Export rate limited | Слишком много попыток | Подождите 60 секунд |
| Расшифрованные secrets повреждены после restore | Неверный `APP_ENCRYPTION_KEY` | Восстановите matching `.env` |

## Связанные документы

- [FAQ](./faq.md)
- [Операции и конкурентность](./concepts/operations-and-concurrency.md)
- [Переменные окружения](./administration/environment-variables.md)
