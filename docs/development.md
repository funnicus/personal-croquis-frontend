# Development

## Requirements

- Docker with Compose v2
- Node 24+
- `uv` for tagger API development
- Ollama on the host with `qwen2.5vl:7b` pulled

```bash
ollama pull qwen2.5vl:7b
ollama serve
```

## Frontend Dev

Run backing services, the tagger API, and the worker in Docker. Run only the
SvelteKit app on the host for hot reload.

Because the worker stays in Docker, presigned MinIO URLs point at the `minio`
service and work from the tagger API container.

```bash
cp .env.example .env
cp app/.env.example app/.env

docker compose up -d db minio image-tagger-api image-tagger-worker

cd app
npm install
npm run dev -- --open
```

Open http://localhost:5173.

For host-side app dev, point `app/.env`'s `DATABASE_HOST` and
`BLOB_STORAGE_END_POINT` at `localhost`, because Docker publishes those ports to
the host.

## Full Local Dev

Run only `db` and `minio` in Docker. Run the app, worker, and tagger API on the
host. This keeps signed `localhost` MinIO URLs resolvable by every process.

```bash
cp .env.example .env
cp app/.env.example app/.env
cp image-tagger-worker/.env.example image-tagger-worker/.env

docker compose up -d db minio
```

Terminal 1:

```bash
cd image-tagger-api
uv run fastapi dev src/image_tagger/main.py
```

Terminal 2:

```bash
cd app
npm install
npm install --prefix ../image-tagger-worker
npm run migrate:up
npm run dev:all
```

Keep the worker and tagger API on the same host in this mode. The worker gives
the tagger a presigned MinIO URL whose host comes from `BLOB_STORAGE_END_POINT`.
SigV4 signs that host, so it cannot be rewritten after the fact. Mixing a
Dockerized tagger with a host worker, or vice versa, breaks image fetching.

You can also run the worker on its own:

```bash
cd app
npm run dev:tag-worker
```

## Checks

```bash
cd app
npm run lint
npm run check
npm run build

cd ../image-tagger-worker
npm run typecheck

cd ../image-tagger-api
uvx --from ruff==0.15.17 ruff check .
uvx --from ruff==0.15.17 ruff format --check .
python3 -m compileall src
```

## Docker Debug

```bash
docker compose ps
docker compose ps -a
docker compose logs -f app
docker compose logs -f image-tagger-worker
docker compose exec app sh
```

One-shot containers like `migrate` are hidden by default. Use
`docker compose ps -a` to see their `Exited (0)` status.
