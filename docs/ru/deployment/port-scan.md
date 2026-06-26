# Внешнее сканирование портов

UFW Remote Manager может выполнять **внешнее сканирование портов** из контейнера `ufw-app` по адресу `host` каждого зарегистрированного сервера. Pipeline:

1. **Naabu** — быстрый TCP discovery (`host/port/protocol/open`)
2. **Nmap** — определение сервисов только по найденным портам (`-sV`, XML)

Результаты отображаются в таблице **под правилами UFW** на странице сервера.

## Включение

В окружении приложения (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Опциональные параметры:

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `PORT_SCAN_TOP_PORTS` | `1000` | Профиль Naabu top-ports |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Лимит портов для Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `300000` | Таймаут discovery |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Таймаут enrichment |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | `900000` | Интервал между сканами на сервер |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | История сканов на сервер |

## Сеть

Контейнер приложения должен достигать **managed-серверов на сканируемых TCP-портах**, не только SSH `:22`. Проверьте маршрутизацию и firewall между Docker-хостом и целями.

Сканируются **только хосты из UFW Remote Manager** — произвольные адреса запрещены.

## Колонка UFW

Каждый открытый порт сравнивается с последним snapshot UFW:

| Значение | Смысл |
|----------|-------|
| **Разрешено** | Порт покрыт правилом ALLOW |
| **Нет в UFW** | Порт открыт снаружи, но не покрыт ALLOW |
| **Запрещено** | Явный DENY/REJECT |
| **Неизвестно** | UFW неактивен или нет snapshot |

## Безопасность

- Rate limit (по умолчанию 1 скан / 15 мин на сервер)
- Audit: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Скан в очереди serverId вместе с SSH-операциями
- Connect-scan (`naabu -scan-type c`, `nmap -sT`) — без raw sockets

## См. также

- [Обзор деплоя](./overview.md)
- [Модель безопасности](../administration/security-model.md)
