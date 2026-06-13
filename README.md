# Personal Croqui Frontend

A personal reference-image (croqui) library: upload images, have them automatically
tagged, and browse/serve them for drawing practice.

## Architecture

The stack (`compose.yml`) consists of six services on a single Docker network:

| Service               | What it is                                                        | Port        |
| --------------------- | ----------------------------------------------------------------- | ----------- |
| `app`                 | SvelteKit frontend (adapter-node)                                 | 3000        |
| `db`                  | PostgreSQL 17                                                      | 5432        |
| `minio`               | Blob storage (S3-compatible) — API + console                      | 9000 / 9001 |
| `migrate`             | One-shot: runs DB migrations, then exits (the app waits for it)   | —           |
| `image-tagger-api`    | FastAPI tagging service (RAM++ + a VLM via Ollama), CPU-only      | 8000        |
| `image-tagger-worker` | Standalone Node worker: polls queued jobs and tags them via the API | —         |

Flow: `app` enqueues a tagging job on upload → `image-tagger-worker` claims it,
hands `image-tagger-api` a presigned MinIO URL → the API fetches the image and
tags it via Ollama → the worker writes tags back to the database.

Ollama is **not** part of the stack — it runs on the host, and `image-tagger-api`
reaches it via `host.docker.internal:11434` (see [Firewall Setup](#firewall-setup)).

## Minimum Requirements

- Docker (with Compose v2)
- [Ollama](https://ollama.com) installed on the host with `qwen2.5vl:7b` pulled
- On Linux: a firewall rule allowing the stack to reach host Ollama (see [Firewall Setup](#firewall-setup))
- For local dev only: Node 24+, and [`uv`](https://astral.sh/) if you intend to develop the tagger API

## Quickstart (everything in Docker)

1. Create the env files (the stack needs both):

   ```bash
   cp .env.example .env
   cp app/.env.example app/.env
   ```

2. Fill in the secrets (MinIO credentials, DB password, etc.). For an all-Docker
   run the service hostnames are overridden in `compose.yml`, so you only need to
   set credentials.

3. Make sure Ollama is running on the host with the model pulled:

   ```bash
   ollama pull qwen2.5vl:7b
   ollama serve   # if it isn't already running
   ```

4. Start the stack. Database migrations run automatically via the `migrate` service:

   ```bash
   docker compose up -d --build

   # when you're done
   docker compose down
   ```

Open http://localhost:3000 and enjoy! The MinIO console is at http://localhost:9001.

## Dev setup

### Option A — Frontend dev (recommended)

Run the backing services, the tagger API and the worker in Docker; run only the
SvelteKit app on the host for hot reload. Because the worker stays in Docker, the
presigned MinIO URLs it generates point at the `minio` service and "just work".

```bash
cp .env.example .env
cp app/.env.example app/.env

# Starting the worker also pulls in the one-shot `migrate` service (it depends on
# it), so the database is migrated automatically.
docker compose up -d db minio image-tagger-api image-tagger-worker

cd app
npm install
npm run dev -- --open       # http://localhost:5173
```

> For host-side dev, point `app/.env`'s `DATABASE_HOST` / `BLOB_STORAGE_END_POINT`
> at `localhost` (the Docker services are published on localhost ports).

### Option B — Full local dev (app + worker + tagger on the host)

Run only `db` + `minio` in Docker; run everything else on the host so the signed
`localhost` URLs resolve for all of them.

```bash
cp .env.example .env
cp app/.env.example app/.env
cp image-tagger-worker/.env.example image-tagger-worker/.env

docker compose up -d db minio

# terminal 1 — tagger API
cd image-tagger-api
uv run fastapi dev src/image_tagger/main.py

# terminal 2 — app + worker
cd app
npm install
npm install --prefix ../image-tagger-worker
npm run migrate:up
npm run dev:all             # SvelteKit dev server + tagger worker (via concurrently)
```

> Keep the worker and the tagger API on the **same host** in this mode. The worker
> hands the tagger a presigned MinIO URL whose host comes from `BLOB_STORAGE_END_POINT`;
> SigV4 signs that host, so it can't be rewritten after the fact. Mixing a Dockerized
> tagger with a host worker (or vice versa) breaks image fetching.

You can also run the worker on its own with `npm run dev:tag-worker`.

## Deploy

```bash
docker compose up -d --build
```

## Docker debug

```bash
docker compose ps            # list services and status
docker compose logs -f app   # follow a service's logs (app, image-tagger-worker, ...)
docker compose exec app sh   # open a shell inside a running container

exit                         # leave the container
```

One-shot containers (like `migrate`) are hidden by default; use `docker compose ps -a`
to see their `Exited (0)` status.

## AIStor for MinIO management

If you want to manage MinIO from the CLI, install the
[AIStor Client](https://docs.min.io/enterprise/aistor-object-store/reference/cli/?tab=quickstart-linux)
and add it to your `PATH`.

## Firewall Setup

`image-tagger-api` runs in Docker but needs to reach Ollama on the host. The stack's
Docker subnet is pinned to `172.19.0.0/16` in `compose.yml` so the firewall rule below
keeps matching across `down`/`up`. If that subnet conflicts on your machine, change it
in `compose.yml` and update the rule accordingly.

ufw (Linux):

```bash
sudo ufw allow from 172.19.0.0/16 to any port 11434 proto tcp comment 'docker stack -> host ollama'
sudo ufw status verbose | grep 11434     # verify the rule is active

docker compose restart image-tagger-api  # retry the Ollama warmup
```

Ollama must also listen on all interfaces (not just `127.0.0.1`) for the container to
reach it. If needed, start it with `OLLAMA_HOST=0.0.0.0 ollama serve`.
