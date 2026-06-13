import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Request, UploadFile
from typing_extensions import AsyncGenerator

from image_tagger.schemas import (
    ArtisticTagRequest,
    ArtisticTagResponse,
    BatchImageTagRequest,
    BatchImageTagResponse,
    BatchImageTagResult,
    ImageTagRequest,
    ImageTagResponse,
    TagCandidate,
)
from image_tagger.tagger import RamPlusTagger
from image_tagger.vlm_tagger import VlmTagger

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    app.state.tagger = RamPlusTagger()

    vlm_tagger = VlmTagger()
    try:
        await vlm_tagger.warmup()
    except Exception:
        logger.exception("VLM warmup failed")

    app.state.vlm_tagger = vlm_tagger

    yield


app = FastAPI(
    title="Image Tagger API",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/vlm")
async def vlm_health(request: Request):
    vlm_tagger: VlmTagger = request.app.state.vlm_tagger
    await vlm_tagger.warmup()
    return {
        "status": "ok",
        "model": vlm_tagger.model,
    }


@app.post("/tag", response_model=ImageTagResponse)
def tag_image(request: Request, body: ImageTagRequest):
    tagger: RamPlusTagger = request.app.state.tagger

    tags = tagger.tag_image_url(str(body.image_url))

    return ImageTagResponse(
        tags=[TagCandidate(name=tag, confidence=None) for tag in tags]
    )


@app.post("/tag-upload", response_model=ImageTagResponse)
async def tag_uploaded_image(
    request: Request,
    file: UploadFile = File(...),
):
    tagger: RamPlusTagger = request.app.state.tagger

    image_bytes = await file.read()
    tags = tagger.tag_image_bytes(image_bytes)

    return ImageTagResponse(
        tags=[TagCandidate(name=tag, confidence=None) for tag in tags]
    )


@app.post("/tag-batch", response_model=BatchImageTagResponse)
def tag_batch(request: Request, body: BatchImageTagRequest):
    tagger: RamPlusTagger = request.app.state.tagger

    results: list[BatchImageTagResult] = []

    for item in body.images:
        tags = tagger.tag_image_url(str(item.image_url))

        results.append(
            BatchImageTagResult(
                image_id=item.image_id,
                tags=[TagCandidate(name=tag, confidence=None) for tag in tags],
            )
        )

    return BatchImageTagResponse(results=results)


@app.post("/tag-artistic", response_model=ArtisticTagResponse)
async def tag_artistic(request: Request, body: ArtisticTagRequest):
    vlm_tagger: VlmTagger = request.app.state.vlm_tagger

    result = await vlm_tagger.tag_image_url(str(body.image_url))

    return ArtisticTagResponse(**result)
