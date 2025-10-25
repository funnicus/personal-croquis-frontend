# Personal Croqui Frontend

## First time setup

First populate .env:

1. Run `echo $(id -u):$(id -g)` to see MINIO_USER.
2. Fill other envs as you like.

```bash
npm run dev -- --open
docker compose --profile minio -f "docker-compose.yml" up -d --no-deps --build
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

If you want to manage MinIO stuff, install [AIStor CLient](https://docs.min.io/enterprise/aistor-object-store/reference/cli/?tab=quickstart-linux). Remember to add to path.

## TODO:

### Bonus:

1. Extension to autoupload
2. Throttle large uploads
