from pydantic import BaseModel, HttpUrl


class ImageTagRequest(BaseModel):
    image_url: HttpUrl


class BatchImageTagItem(BaseModel):
    image_id: str
    image_url: HttpUrl


class BatchImageTagRequest(BaseModel):
    images: list[BatchImageTagItem]


class TagCandidate(BaseModel):
    name: str
    confidence: float | None = None


class ImageTagResponse(BaseModel):
    tags: list[TagCandidate]


class BatchImageTagResult(BaseModel):
    image_id: str
    tags: list[TagCandidate]


class BatchImageTagResponse(BaseModel):
    results: list[BatchImageTagResult]


class ArtisticTagRequest(BaseModel):
    image_url: HttpUrl


class ArtisticTagResponse(BaseModel):
    expression: list[str]
    pose: list[str]
    composition: list[str]
    style: list[str]
    practice_value: list[str]
    mood: list[str]
    notes: str | None = None
