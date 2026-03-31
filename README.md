# Personal Croqui Frontend

## First time setup

1. Run `cp .env.example .env`:

2. Fill envs.

3. Run the following commands:

```bash
docker compose --profile minio --profile db -f "docker-compose.yml" up -d --no-deps --build
npm run migrate:up
npm run dev -- --open
```

For docker debug:

```bash
docker ps # List container ids
docker exec -it <server_container_id> sh # Exec with a shell into the wad server (id found with previous command)

exit # exit container
```

MinIO frontend can be found at http://localhost:9001.

## Deploy

`docker compose -f "docker-compose.yml" up -d --build`

## AIStor for MinIO management

If you want to manage MinIO stuff, install [AIStor Client](https://docs.min.io/enterprise/aistor-object-store/reference/cli/?tab=quickstart-linux). Remember to add to path.
