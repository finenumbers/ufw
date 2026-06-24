# Быстрый старт (локально)

Запустите UFW Remote Manager на своей машине с Docker. Этот путь предназначен для **оценки и разработки**, а не для продакшена.

## 1. Клонирование и настройка

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Файл `.env` по умолчанию содержит значения, удобные для разработки. **Не** используйте эти значения по умолчанию в продакшене.

## 2. Запуск стека

```bash
docker compose up -d --build
```

Дождитесь, пока все контейнеры станут healthy:

```bash
docker compose ps
```

Вы должны увидеть `ufw-postgres` (healthy), `ufw-migrate` (exited 0) и `ufw-app` (healthy).

## 3. Открытие интерфейса

Откройте **http://localhost:8088** в браузере.

- **Первый визит:** `/setup` — создание единственной учётной записи администратора
- **Последующие визиты:** `/login`

## 4. Первый рабочий процесс в интерфейсе

1. **SSH-идентификации** (`/identities`) — создайте учётные данные (пароль или приватный ключ)
2. **Добавить сервер** — выберите идентификацию, укажите хост/порт; проверка SSH выполняется перед сохранением
3. На странице сервера — установите/включите UFW при необходимости, затем откройте **Правила**
4. Отредактируйте правила, выполните **предпросмотр применения**, подтвердите для отправки изменений по SSH

## Полезные команды

```bash
docker compose logs -f app          # application logs
docker compose down                 # stop stack
docker compose down -v              # stop and delete database volume
```

## Разработка на хосте (опционально)

Запустите только Postgres в Docker, а приложение — на хосте:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Используйте порт **5434** в `DATABASE_URL` для доступа с хоста (см. `.env.example`).

## Продакшен

Для развёртывания с HTTPS за Nginx Proxy Manager см. [Обзор развёртывания](./deployment/overview.md).
