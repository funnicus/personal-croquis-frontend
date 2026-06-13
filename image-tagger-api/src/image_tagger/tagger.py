from io import BytesIO

import requests
import torch
from PIL import Image
from ram import get_transform
from ram import inference_ram as inference
from ram.models import ram_plus

from image_tagger.settings import settings


class RamPlusTagger:
    def __init__(self) -> None:
        self.device = self._resolve_device()
        self.transform = get_transform(image_size=settings.ram_image_size)

        self.model = ram_plus(
            pretrained=settings.ram_checkpoint_path,
            image_size=settings.ram_image_size,
            vit="swin_l",
        )

        self.model.eval()
        self.model = self.model.to(self.device)

    def _resolve_device(self) -> torch.device:
        if settings.device == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")

        return torch.device(settings.device)

    def tag_pil_image(self, image: Image.Image) -> list[str]:
        rgb_image = image.convert("RGB")

        transformed = self.transform(rgb_image)

        if not isinstance(transformed, torch.Tensor):
            raise TypeError(
                f"Expected transform to return torch.Tensor, got {type(transformed)}"
            )

        tensor = transformed.unsqueeze(0).to(self.device)

        with torch.inference_mode():
            result = inference(tensor, self.model)

        return self._parse_tags(result[0])

    def tag_image_url(self, image_url: str) -> list[str]:
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        image = Image.open(BytesIO(response.content))

        return self.tag_pil_image(image)

    def tag_image_bytes(self, image_bytes: bytes) -> list[str]:
        image = Image.open(BytesIO(image_bytes))
        return self.tag_pil_image(image)

    def _parse_tags(self, raw_tags: str) -> list[str]:
        return [tag.strip() for tag in raw_tags.split("|") if tag.strip()]
