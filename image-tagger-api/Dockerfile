# Image Tagger API (FastAPI + RAM++ + VLM via Ollama)
# Built with uv. The RAM++ checkpoint (~2.9GB) is NOT baked into the image;
# it is mounted at runtime via a volume (see compose.yml).
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

# `git` is required to install the `ram` dependency, which is sourced from GitHub.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# Install dependencies in their own layer for better caching.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy the application source and install the project itself.
COPY . .
RUN uv sync --frozen --no-dev

# Use the project's virtualenv directly.
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "image_tagger.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000"]
