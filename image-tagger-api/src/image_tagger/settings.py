from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ram_checkpoint_path: str = "pretrained/ram_plus_swin_large_14m.pth"
    ram_image_size: int = 384
    device: str = "auto"

    # VLM / Ollama configuration. Overridable via env (e.g. OLLAMA_URL) so the
    # service can reach Ollama on the host or another container when run in
    # Docker, where "localhost" would point at the container itself.
    ollama_url: str = "http://localhost:11434/api/generate"
    vlm_model: str = "qwen2.5vl:7b"
    vlm_keep_alive: str = "30m"


settings = Settings()
