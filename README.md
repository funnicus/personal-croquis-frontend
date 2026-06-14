# Personal Croquis App

A personal reference-image library for timed croquis practice. Upload images,
automatically tag them, filter by useful drawing-practice categories, and serve
them through a timer workflow.

## Quickstart

```bash
cp .env.example .env
docker compose up -d --build
```

Open http://localhost:3000. The MinIO console is at http://localhost:9001.

Ollama must be running on the host with the required vision model:

```bash
ollama pull qwen2.5vl:7b
ollama serve
```

## Services

| Service               | What it is                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `app`                 | SvelteKit frontend                                               |
| `db`                  | PostgreSQL 17                                                    |
| `minio`               | S3-compatible image storage                                      |
| `migrate`             | One-shot database migration runner                               |
| `image-tagger-api`    | FastAPI tagging service using RAM++ and a VLM through Ollama     |
| `image-tagger-worker` | Worker that tags queued uploads and writes tags back to Postgres |
| `backup`              | Optional `offen/docker-volume-backup` service behind a profile   |

Upload flow: `app` enqueues a tagging job, `image-tagger-worker` claims it,
`image-tagger-api` analyzes the image, and the worker writes tags back to the DB.

## Documentation

- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Backups and Restore](docs/backups.md)
- [Contributing](docs/contributing.md)

## Common Commands

```bash
docker compose up -d --build
docker compose build --no-cache --pull # Skip cache and pull latest images
docker compose down
docker compose ps
docker compose logs -f app
```

Production with scheduled backups:

```bash
cp backup.env.example backup.env
docker compose --profile backup up -d --build
```
