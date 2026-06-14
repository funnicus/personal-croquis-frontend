# Deployment

## Environment

Create the required env files:

```bash
cp .env.example .env
```

Fill in credentials for Postgres and MinIO. For an all-Docker run, service
hostnames are overridden in `compose.yml`, so credentials and ports are the main
values to configure.

If you plan to enable backups, also set `BACKUP_ARCHIVE_HOST_PATH` in `.env` and
create `backup.env`:

```bash
cp backup.env.example backup.env
```

See [Backups and Restore](backups.md) for backup-specific details.

## Start The Stack

Without scheduled backups:

```bash
docker compose up -d --build
```

With scheduled backups:

```bash
docker compose --profile backup up -d --build
```

Open http://localhost:3000. The MinIO console is at http://localhost:9001.

## Stop The Stack

```bash
docker compose down
```

## Ollama

Ollama must run on the host:

```bash
ollama pull qwen2.5vl:7b
ollama serve
```

`image-tagger-api` reaches Ollama at
`http://host.docker.internal:11434/api/generate`.

On Linux, Ollama may need to listen on all interfaces:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

## Firewall Setup

The Docker subnet is pinned to `172.19.0.0/16` in `compose.yml` so the firewall
rule can keep matching after network recreation. If that subnet conflicts on a
machine, change it in `compose.yml` and update the rule.

ufw:

```bash
sudo ufw allow from 172.19.0.0/16 to any port 11434 proto tcp comment 'docker stack -> host ollama'
sudo ufw status verbose | grep 11434
docker compose restart image-tagger-api
```

## Profiles

The `backup` service is behind the `backup` profile:

```bash
docker compose --profile backup up -d
```

Without the profile, the backup service is not started. This keeps regular
development and normal local runs from creating scheduled backups.

Docker Compose validates variable interpolation before applying profiles, so keep
`BACKUP_ARCHIVE_HOST_PATH` set in `.env` even on machines where you do not start
the backup service.
