import asyncio
import json
import logging
import os
import tempfile
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.core.assessment_engine import run_assessment
from app.core.sandbox import check_zip_safety, SandboxError
from app.storage import assessment_repo
from app.utils.auth_utils import get_current_user_id

# 🔥 NEW IMPORT (LLM)
from app.services.llm_service import generate_ai_report

log = logging.getLogger(__name__)
router = APIRouter()

_SENTINEL = object()


@router.post("/run")
async def run(
    repo_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    user_id: str = Depends(get_current_user_id),
):
    if not repo_url and not file:
        raise HTTPException(400, "Provide repo_url or a ZIP file")

    zip_path = None
    if file:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        tmp.write(await file.read())
        tmp.close()
        zip_path = tmp.name

        try:
            check_zip_safety(zip_path)
        except SandboxError as e:
            os.unlink(zip_path)
            raise HTTPException(400, str(e))

    source_value = repo_url or (file.filename if file else "upload.zip")

    placeholder = await assessment_repo.create_assessment({
        "user_id": ObjectId(user_id),
        "source_value": source_value,
        "source_type": "git" if repo_url else "zip",
        "score": 0,
        "status": "Running",
    })
    result_id = placeholder["id"]

    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def progress_cb(stage: str, progress: int, message: str):
        loop.call_soon_threadsafe(
            queue.put_nowait,
            {"type": "progress", "stage": stage, "progress": progress, "message": message},
        )

    async def run_in_bg():
        try:
            # 🔹 STEP 1: Run your existing analysis
            result = await loop.run_in_executor(
                None,
                lambda: run_assessment(
                    zip_path=zip_path,
                    git_url=repo_url,
                    source_value=source_value,
                    user_id=user_id,
                    assessment_id=result_id,
                    progress_cb=progress_cb,
                ),
            )

            # 🔥 STEP 2: Call LLM (Groq) safely in executor
            try:
                llm_report = await loop.run_in_executor(
                    None,
                    lambda: generate_ai_report(result)
                )
            except Exception as e:
                log.warning(f"LLM failed: {e}")
                llm_report = "AI report generation failed."

            # 🔹 STEP 3: Save everything to DB
            await assessment_repo.update_assessment(result_id, {
                **result,
                "ai_report": llm_report,   # ✅ NEW FIELD
                "user_id": ObjectId(user_id),
                "status": result.get("status", "Complete"),
                "score": result.get("score", 0),
            })

            # 🔹 STEP 4: Send final response (with AI report)
            await queue.put({
                "type": "complete",
                "id": result_id,
                "ai_report": llm_report,   # ✅ send to frontend
                "static_report": result 
            })

        except Exception as exc:
            log.exception("Assessment failed")

            try:
                await assessment_repo.delete_by_id(result_id, user_id)
            except Exception:
                pass

            await queue.put({"type": "error", "message": str(exc)})

        finally:
            await queue.put(_SENTINEL)
            if zip_path and os.path.exists(zip_path):
                os.unlink(zip_path)

    async def event_stream():
        task = asyncio.create_task(run_in_bg())

        try:
            while True:
                item = await asyncio.wait_for(queue.get(), timeout=300)
                if item is _SENTINEL:
                    break
                yield f"data: {json.dumps(item)}\n\n"
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Analysis timed out (5 min)'})}\n\n"
        finally:
            task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )