# Сканирование портов (руководство пользователя)

Если администратор включил функцию, **панель сканирования портов** на странице каждого сервера обнаруживает внешне доступные TCP-сервисы и сравнивает их с правилами UFW.

Администраторы включают и настраивают scan через переменные окружения — см. [Внешнее сканирование портов (развёртывание)](../deployment/port-scan.md).

## Когда появляется панель

Панель видна только при `PORT_SCAN_ENABLED=true` в окружении app. Если disabled, на странице сервера только правила UFW.

## Запуск scan

1. Откройте dashboard сервера.
2. В toolbar dashboard UFW нажмите **Сканировать порты** (или секцию scan под таблицей правил, если показана).
3. Появляется баннер операций с шагами: resolve target → discovery → enrichment → normalize.
4. Результаты заполняют таблицу при успешном завершении scan.

Полное TCP discovery (порты 1–65535) может занять **30 минут и более**. Scan идёт из контейнера app к зарегистрированному hostname или IP сервера — не по SSH.

## Состояния scan

| Status | Meaning | UI behaviour |
|--------|---------|--------------|
| **PENDING** | Job создан, ещё не started | Показывает *Сканирование...*; polling active |
| **RUNNING** | Naabu/Nmap in progress | Progress via баннер операций; table empty или previous results |
| **SUCCESS** | Scan finished | Full findings table; date и port count в header панели |
| **FAILED** | Error or timeout | Error message; previous successful results may still display |

## Resume after page refresh

С v0.9.2 открытие страницы сервера загружает **latest scan любого статуса** из БД — не только last successful. При refresh браузера во время `PENDING` или `RUNNING` панель resumes polling и баннер подхватывает active operation.

## Results table

| Column | Description |
|--------|-------------|
| **Порт** | TCP port number |
| **Прото** | Protocol (typically `tcp`) |
| **Состояние** | Usually `open` for discovered ports |
| **Сервис** | Service name from Nmap when available |
| **Продукт / версия** | Product and version when detected |
| **UFW** | Coverage relative to latest UFW snapshot |

### UFW coverage values

Coverage uses **external-scan semantics** — что увидел бы anonymous client в internet:

| Value | Meaning |
|-------|---------|
| **Разрешено** | Inbound ALLOW/LIMIT from **any** covers this port |
| **Нет в UFW** | Port open externally but not covered by public inbound allow — review |
| **Запрещено** | Inbound DENY/REJECT from **any** targets this port |
| **Неизвестно** | UFW inactive or no snapshot |

Whitelist-only rules (specific source IP/CIDR, or `To Port = any` without public allow) **do not** count as *Разрешено* for external scan.

## Overlap and rate limits

| Situation | Message / behaviour |
|-----------|---------------------|
| Scan already running on this server | *Сканирование портов для этого сервера уже выполняется.* — wait for completion |
| Repeat scan within 30 seconds | Rate limit message with retry countdown |

Only one active scan per server. Port scan does not block UFW refresh or apply on same server.

## Relationship to server list stats

Card **списка серверов** may show open-port count from latest successful scan. Dashboard inventory line shows scan date and finding count when successful scan exists.

Saved rule counts on list cards refer to **local rule metadata** (`ruleRecord`), not remote UFW rule numbers.

## Operations history

Each scan creates operation log entry type `port.scan`. Audit events `PORT_SCAN_STARTED` and `PORT_SCAN_COMPLETED` on start and successful finish.

See [История операций](./operations-history.md).

## Связанные документы

- [Внешнее сканирование портов (развёртывание)](../deployment/port-scan.md)
- [Операции и конкурентность](../concepts/operations-and-concurrency.md)
- [Управление серверами](./manage-servers.md)
