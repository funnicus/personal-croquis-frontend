import base64
import json
from io import BytesIO

import httpx
from PIL import Image

from image_tagger.settings import settings

ARTISTIC_TAG_PROMPT = """
You are tagging images for an artist's croqui/reference image library.

Return JSON only. No markdown.

Use concise snake_case tags.

Analyze only visible visual information. Do not identify real people.
Prefer artistic usefulness over generic object labels.

Return this exact JSON shape:
{
  "expression": [],
  "pose": [],
  "composition": [],
  "style": [],
  "practice_value": [],
  "mood": [],
  "notes": null
}

Examples of useful tags:
expression: shy_smile, wide_eyed_surprise, neutral, angry, melancholic, playful, embarrassed, confident, seductive, anxious
pose: sitting, standing, leaning, looking_back, relaxed_shoulders, twisted_torso, hand_on_face
composition: closeup, bust_shot, full_body, low_angle, high_angle, centered, strong_diagonal, negative_space, simple_background
style: anime, realistic, semi_realistic, stylized, painterly, sketch, photo, illustration
practice_value: facial_expression, eye_shape, mouth_shape, hands, hair_shape, clothing_folds, gesture, anatomy, lighting, perspective, foreshortening
mood: gentle, intimate, tense, uncanny, energetic, lonely, dramatic, cute, serious
"""


class VlmTagger:
    def __init__(
        self,
        model: str | None = None,
        ollama_url: str | None = None,
        keep_alive: str | None = None,
    ) -> None:
        self.model = model or settings.vlm_model
        self.ollama_url = ollama_url or settings.ollama_url
        self.keep_alive = keep_alive or settings.vlm_keep_alive

    async def tag_image_url(self, image_url: str) -> dict:
        async with httpx.AsyncClient(timeout=120) as client:
            image_response = await client.get(image_url)
            image_response.raise_for_status()

            image_b64 = self._prepare_image_base64(image_response.content)

            ollama_response = await client.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": ARTISTIC_TAG_PROMPT,
                    "images": [image_b64],
                    "stream": False,
                    "format": "json",
                    "keep_alive": self.keep_alive,
                    "options": {
                        "temperature": 0.1,
                    },
                },
            )
            ollama_response.raise_for_status()

        payload = ollama_response.json()
        text = payload["response"]

        return json.loads(text)

    def _prepare_image_base64(self, image_bytes: bytes) -> str:
        # Normalize to JPEG so random formats don't cause issues.
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=90)

        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    async def warmup(self) -> None:
        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": "",
                    "stream": False,
                    "keep_alive": self.keep_alive,
                },
            )
            response.raise_for_status()
