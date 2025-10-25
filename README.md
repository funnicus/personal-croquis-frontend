# Personal Croqui Frontend

## Development

First populate .env. Run `echo $(id -u):$(id -g)` to see MINIO_USER.

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

If you want to sync images easily to server:

`rsync -avzh --delete --progress --stats . user@address:/path/to/static/images/references`

## TODO:

1. Gallery

## Bonus:

1. Extension to autoupload
