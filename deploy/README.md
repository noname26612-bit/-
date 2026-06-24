# Деплой vanmark-drive — каноничные команды

Единый источник правды по запуску прод-стека (preflight-аудит В4). Подробный runbook — в скилле
`deploy-release`. Все команды выполняются в каталоге репозитория на сервере (прод: `/opt/vanmark`).

## Запуск / обновление прод-стека

**Каноничная команда — ТОЛЬКО прод-файл:**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> Запускать именно так (один `-f`). При таком запуске порт Postgres наружу **не публикуется**
> (в `docker-compose.prod.yml` у postgres нет секции `ports`). НЕ подмешивать dev-файл
> `docker-compose.yml` — его секция `ports` открыла бы порт (хоть и на `127.0.0.1`).
> Для доступа к БД с сервера: `docker exec -it vanmark-postgres psql -U vanmark`.

Тяжёлую сборку (`next build`) на VPS 1.9 ГБ гонять в `tmux` — SSH рвётся под свопом (см. память проекта).

## Миграции

```bash
docker exec vanmark-app npx prisma migrate deploy
```

`migrate deploy` применяет готовые миграции без интерактива (НЕ `migrate dev` — он на проде запрещён,
ломает `task_number_seq`). Перед миграцией — бэкап (см. ниже).

## Бэкап

Ежедневный бэкап — `deploy/backup.sh` по cron. Образец cron-строки с **off-site + шифрованием** —
`deploy/cron.d/vanmark-backup` (preflight-аудит В5: без off-site бэкап только локальный, на том же VPS).

Установка:

```bash
sudo cp deploy/cron.d/vanmark-backup /etc/cron.d/vanmark-backup   # заполнить BACKUP_* реальными значениями
sudo systemctl restart cron
# проверка: после прогона в логе должно быть "off-site S3 ok"
```

Приватный ключ расшифровки (`age`) держать **вне сервера**. Восстановление репетировать **до пилота**.

## Откат релиза

1. Остановить стек: `docker compose -f docker-compose.prod.yml down`
2. Восстановить БД из дампа: `docker exec -i vanmark-postgres pg_restore -U vanmark -d vanmark --clean < /backups/db-YYYY-MM-DD.dump`
3. Поднять предыдущий образ/коммит: `git checkout <предыдущий-тег> && docker compose -f docker-compose.prod.yml up -d --build`

## Проверки после деплоя

```bash
curl -fsS https://$DOMAIN/api/health           # {"status":"ok","db":"up"}
ss -tlnp | grep 5432 || echo "порт БД наружу не слушает — ок"
docker compose -f docker-compose.prod.yml ps   # все healthy
```
