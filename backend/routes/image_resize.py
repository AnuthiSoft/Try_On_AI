from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageOps
from io import BytesIO

router = APIRouter(prefix="/api/image", tags=["Image"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 10
MAX_DIMENSION = 2048


def resize_with_padding(img: Image.Image, width: int, height: int):
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    img = ImageOps.exif_transpose(img)

    return ImageOps.pad(
        img,
        (width, height),
        method=Image.BICUBIC,
        color=(0, 0, 0),
        centering=(0.5, 0.5),
    )


@router.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...)
):
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Invalid target size")

    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise HTTPException(status_code=400, detail="Target size too large")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large")

    try:
        img = Image.open(BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")

    resized = resize_with_padding(img, width, height)

    output = BytesIO()

    # ✅ JPEG cannot handle alpha
    if resized.mode == "RGBA":
        resized = resized.convert("RGB")

    resized.save(output, format="JPEG", quality=95, subsampling=0)

    # ✅ CRITICAL LINE (YOU WERE MISSING THIS)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": "inline; filename=resized.jpg"
        }
    )
