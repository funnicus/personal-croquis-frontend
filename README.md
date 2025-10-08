# Personal Croqui Frontend

`npm run dev -- --open`

or

`docker compose -f "docker-compose.yml" up -d`

or

`docker compose -f "docker-compose.yml" up -d --build`

For docker debug:

```bash
docker ps # List container ids
docker exec -it <server_container_id> sh # Exec with a shell into the wad server (id found with previous command)

exit # exit container
```

If you want to sync images easily to server:

`rsync -avzh --delete --progress --stats . user@address:/path/to/static/images/references`

## TODO:

3. Timer
4. Filters and categories
5. Each image only once vs random

## Bonus:

1. Extension to autoupload
