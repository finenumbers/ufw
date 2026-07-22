# Серверы и SSH

Запись **сервера** хранит display name, host, port, SSH-идентификацию и optional host key fingerprint. Вся удалённая работа UFW идёт через эту запись.

## Проверка хоста

Перед сохранением app проверяет target host:

| Проверка | Поведение по умолчанию |
|----------|------------------------|
| Private IP ranges | **Отклоняются** (RFC1918, loopback, link-local) |
| Cloud metadata IP | **Отклоняются** |
| Публичные hostnames / IP | Разрешены |
| Пользовательский allowlist | `SSH_ALLOWED_CIDRS` для specific private ranges (lab/VPN) |

DNS resolution проверяется где применимо, чтобы опечатки выявлялись рано.

## Проверка подключения

**Создать сервер** и **Изменить сервер** (при изменении host, port или identity) автоматически выполняют SSH connection test. Отдельной кнопки *Test connection* в форме edit нет.

Сообщения об ошибках указывают на reachability, credentials, firewall или host validation — см. [Устранение неполадок](../troubleshooting.md).

## SSH host keys (trust on first use)

При первом успешном подключении fingerprint host key сохраняется и помечается **verified**.

| Состояние | UI | Apply rules |
|-----------|-----|-------------|
| **Verified** | Fingerprint на странице edit | Разрешено после refresh |
| **Unverified** | Предупреждение на dashboard и edit | **Сохранить правила** (apply) заблокировано до успешного **Обновить статус** |

Снижает MITM-риск при первом подключении. Чтобы доверять новому key после rebuild сервера, обновите сервер или очистите и reverified через refresh.

Imported servers из конфигурации могут иметь stored fingerprints — verify через **Обновить статус** перед apply.

## Sudo и UFW

Remote commands предполагают, что SSH user может запускать `ufw` — обычно passwordless sudo для `ufw` или root. App оборачивает apt install в `sudo` где нужно для **Установить UFW**.

Убедитесь, что `/etc/sudoers` разрешает нужные команды для выбранного user.

## Дубликаты серверов

Одна и та же комбинация host + port + identity не регистрируется дважды. Используйте разные имена, если намеренно управляете одним host через разные accounts (разные identities).

## Связанные документы

- [SSH-идентификации](./ssh-identities.md)
- [Управление серверами](../user-guide/manage-servers.md)
- [Переменные окружения](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
