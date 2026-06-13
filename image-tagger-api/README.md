# Image Tagger API

Use [RAM++](https://github.com/xinyu1205/recognize-anything) to automatically tag sent images.

Add ram_plus_swin_large_14m.pth inside the `pretrained` directory.

## Development

Tooling: https://astral.sh/

To run the development server, use the following command:

```bash
uv run fastapi dev src/image_tagger/main.py
curl http://127.0.0.1:8000/health # Should return "ok"

# Test the tag endpoint
curl -X POST http://127.0.0.1:8000/tag \
  -H "content-type: application/json" \
  -d '{"image_url":"https://example.com/image.jpg"}'

# Test the tag-upload endpoint (local file)
curl -X POST http://127.0.0.1:8000/tag-upload \
  -F "file=@/path/to/your/image.jpg"

# Test the tag-batch endpoint
curl -X POST http://127.0.0.1:8000/tag-batch \
  -H "content-type: application/json" \
  -d '{
    "images": [
      {
        "image_id": "img_1",
        "image_url": "https://example.com/image-1.jpg"
      },
      {
        "image_id": "img_2",
        "image_url": "https://example.com/image-2.jpg"
      }
    ]
  }'

# Artistic
curl -X POST http://127.0.0.1:8000/tag-artistic \
  -H "content-type: application/json" \
  -d '{"image_url":"https://example.com/image.jpg"}'

# Linter
ruff check
ruff format

# Type check
ty check
```

To avoid RAM++ relaoding on code changes, use the following command:

```bash
uv run uvicorn image_tagger.main:app \
  --app-dir src \
  --host 0.0.0.0 \
  --port 8000
```
