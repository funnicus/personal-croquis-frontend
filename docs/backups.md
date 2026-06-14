# Backups And Restore

Backups are handled by
[`offen/docker-volume-backup`](https://github.com/offen/docker-volume-backup).
The service is opt-in through the `backup` Compose profile.

## Setup

Create the backup env file:

```bash
cp backup.env.example backup.env
```

Set the host archive path in `.env`:

```env
BACKUP_ARCHIVE_HOST_PATH=/Users/name/Backups/personal-croquis
```

This value has no default. Compose will error if it is missing:

```text
Set BACKUP_ARCHIVE_HOST_PATH in .env to a backup directory
```

Use a machine-specific path on each server, for example:

```env
BACKUP_ARCHIVE_HOST_PATH=/srv/backups/personal-croquis
```

Docker Compose validates variable interpolation before applying profiles, so keep
this value set in `.env` even on machines where you do not start the backup
service.

## Syncthing

The backup service writes finished archives to `BACKUP_ARCHIVE_HOST_PATH`.

Add the parent backup folder or the `personal-croquis` subfolder to Syncthing to
replicate backups to other devices. Keeping this app in its own subfolder avoids
mixing pruning rules with backups from other sources.

Recommended folder shape:

```text
Backups/
  personal-croquis/
  laptop-documents/
  phone-photos/
  server-configs/
```

Do not sync live Docker volumes directly. Sync only finished backup archives.

## What Gets Backed Up

The archive contains:

- `db/croquis.sql`: logical Postgres dump
- `minio/`: MinIO volume contents

Before each archive, the backup container runs `pg_dump` inside the `db` service.
The app, worker, and MinIO containers are stopped during archive creation and
restarted afterward, so the database dump and object files are not changing while
the backup is created.

## Schedule And Retention

Configure schedule and retention in `backup.env`:

```env
BACKUP_CRON_EXPRESSION=0 30 3 * * *
BACKUP_FILENAME=personal-croquis-%Y-%m-%dT%H-%M-%S.{{ .Extension }}
BACKUP_COMPRESSION=zst
BACKUP_RETENTION_DAYS=14
BACKUP_PRUNING_PREFIX=personal-croquis-
```

The default schedule runs every night at 03:30.

`BACKUP_PRUNING_PREFIX` scopes pruning to this app’s backup files, which matters
if the Syncthing backup folder contains archives from other sources.

## Start Scheduled Backups

```bash
docker compose --profile backup up -d
```

Without `--profile backup`, the backup service is not started.

## Manual Backup

One-off backup without keeping the service running:

```bash
docker compose --profile backup run --rm backup backup
```

If the backup service is already running:

```bash
docker compose exec backup backup
```

## Restore From Backup

The safest restore path is to restore into fresh Docker volumes.

1. Stop the stack:

   ```bash
   docker compose down
   ```

2. Pick the backup archive from `BACKUP_ARCHIVE_HOST_PATH` and extract it to a
   temporary folder:

   ```bash
   mkdir -p /tmp/personal-croquis-restore
   tar -xvf /path/to/personal-croquis-YYYY-MM-DDTHH-MM-SS.tar.zst \
     -C /tmp/personal-croquis-restore
   ```

3. Remove and recreate the MinIO volume, then copy the archived object store data
   back in:

   ```bash
   docker volume rm personal-croquis-frontend_minio
   docker volume create personal-croquis-frontend_minio
   docker run --rm \
     -v personal-croquis-frontend_minio:/restore \
     -v /tmp/personal-croquis-restore/minio:/backup/minio:ro \
     alpine sh -c 'cp -a /backup/minio/. /restore/'
   ```

4. Remove the Postgres data volume and start a fresh database:

   ```bash
   docker volume rm personal-croquis-frontend_pgdata
   docker compose up -d db
   ```

5. Restore the SQL dump:

   ```bash
   docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
     < /tmp/personal-croquis-restore/db/croquis.sql
   ```

6. Start the rest of the stack:

   ```bash
   docker compose up -d --build
   ```

Use `docker volume ls` if your Compose project name differs and the generated
volume names are not `personal-croquis-frontend_minio` and
`personal-croquis-frontend_pgdata`.
