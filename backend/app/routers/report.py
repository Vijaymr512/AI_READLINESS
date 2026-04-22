from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, HTMLResponse
from app.storage import assessment_repo
from app.utils.auth_utils import get_current_user_id
from app.core.log_store import get_log_paths
from pydantic import BaseModel
import json, pathlib

router = APIRouter()

class BulkDelete(BaseModel):
    ids: list[str]

@router.get("/{report_id}")
async def get_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await assessment_repo.get_by_id(report_id, user_id)
    if not doc:
        raise HTTPException(404, "Report not found")
    return doc

@router.delete("/{report_id}")
async def delete_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    ok = await assessment_repo.delete_by_id(report_id, user_id)
    if not ok:
        raise HTTPException(404, "Report not found")
    return {"deleted": True}

@router.post("/bulk-delete")
async def bulk_delete(body: BulkDelete, user_id: str = Depends(get_current_user_id)):
    count = await assessment_repo.delete_many_by_ids(body.ids, user_id)
    return {"deleted": count}

@router.get("/{report_id}/download/text", response_class=PlainTextResponse)
async def download_report_text(report_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await assessment_repo.get_by_id(report_id, user_id)
    if not doc:
        raise HTTPException(404, "Report not found")
    paths = get_log_paths(report_id)
    if paths and pathlib.Path(paths["summary"]).exists():
        return PlainTextResponse(
            pathlib.Path(paths["summary"]).read_text(encoding="utf-8"),
            headers={"Content-Disposition": f'attachment; filename="report_{report_id[:8]}.txt"'},
        )
    lines = [
        "=" * 70,
        f"  APP READER REPORT — {doc.get('source_value', 'Unknown')}",
        "=" * 70,
        f"  Score  : {doc.get('score', '?')}/100  [{doc.get('status', '?')}]",
        "",
        "LAYER SCORES",
        "-" * 40,
    ]
    for layer, lscore in sorted((doc.get("layer_scores") or {}).items(), key=lambda x: x[1]):
        bar = "█" * (lscore // 10) + "░" * (10 - lscore // 10)
        flag = "✅" if lscore >= 70 else ("⚠️" if lscore >= 40 else "❌")
        lines.append(f"  {flag} {layer:<20} {bar}  {lscore:>3}/100")
    return PlainTextResponse(
        "\n".join(lines),
        headers={"Content-Disposition": f'attachment; filename="report_{report_id[:8]}.txt"'},
    )

@router.get("/{report_id}/download/json")
async def download_report_json(report_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await assessment_repo.get_by_id(report_id, user_id)
    if not doc:
        raise HTTPException(404, "Report not found")
    from fastapi.responses import JSONResponse
    return JSONResponse(
        content=doc,
        headers={"Content-Disposition": f'attachment; filename="report_{report_id[:8]}.json"'},
    )

@router.get("/{report_id}/download/html", response_class=HTMLResponse)
async def download_report_html(report_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Styled self-contained HTML report. Open in browser → Ctrl+P → Save as PDF.
    """
    doc = await assessment_repo.get_by_id(report_id, user_id)
    if not doc:
        raise HTTPException(404, "Report not found")

    score        = doc.get("score", 0)
    status       = doc.get("status", "Unknown")
    source       = doc.get("source_value", "Unknown")
    created      = str(doc.get("created_at", ""))
    summary_txt  = doc.get("executive_summary", "No summary available.")
    layer_scores = doc.get("layer_scores") or {}
    blockers     = doc.get("blockers") or []
    risks        = doc.get("risks") or []
    why80        = doc.get("why_not_80") or []
    capabilities = doc.get("capabilities") or {}

    STATUS_COLOR = {
        "Strong": "#22d3ee", "Moderate": "#fbbf24",
        "Weak": "#f97316", "Critical": "#f43f5e",
    }
    color = STATUS_COLOR.get(status, "#a855f7")

    layer_rows = ""
    for lname, lscore in sorted(layer_scores.items(), key=lambda x: x[1]):
        flag = "✅" if lscore >= 70 else ("⚠️" if lscore >= 40 else "❌")
        layer_rows += (
            f"<tr><td>{flag} {lname.replace('_',' ').title()}</td>"
            f"<td><div style='background:#1e2a3a;border-radius:6px;height:10px;width:180px'>"
            f"<div style='background:{color};height:10px;border-radius:6px;width:{lscore}%'></div></div></td>"
            f"<td style='font-weight:800;color:{color};font-family:monospace'>{lscore}/100</td></tr>"
        )

    blockers_html = "".join(
        f"<li style='color:#f43f5e'>⛔ {b}</li>" for b in blockers
    ) or "<li style='color:#22d3ee'>No hard blockers ✅</li>"

    risks_html = "".join(
        f"<li><strong>[{r.get('severity','?').upper()}]</strong> {r.get('name','?')} "
        f"— <em>{r.get('category','?')}</em></li>"
        for r in risks[:15]
    ) or "<li style='color:#22d3ee'>No risks detected ✅</li>"

    tips_html = "".join(f"<li>{t}</li>" for t in why80) or "<li style='color:#22d3ee'>Project is AI-ready! 🎉</li>"

    caps_html = " ".join(
        f'<span style="background:#22d3ee22;color:#22d3ee;padding:3px 10px;border-radius:99px;'
        f'font-size:0.8rem;border:1px solid #22d3ee44">{k}</span>'
        for k, v in capabilities.items() if v
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>AI Readiness Report — {source}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;600;800&display=swap');
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{background:#070e1f;color:#cdd9f0;font-family:'Inter',sans-serif;padding:32px;max-width:900px;margin:auto}}
  h1{{font-family:'Orbitron',sans-serif;font-size:1.8rem;color:{color};margin-bottom:6px}}
  h2{{font-family:'Orbitron',sans-serif;font-size:1rem;color:{color};margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid {color}33}}
  .score-box{{display:inline-block;font-family:'Orbitron',sans-serif;font-size:3rem;font-weight:900;color:{color};background:{color}12;border:2px solid {color}44;border-radius:20px;padding:16px 36px;margin:12px 0}}
  .badge{{display:inline-block;padding:4px 14px;border-radius:99px;font-size:0.75rem;font-weight:800;background:{color}22;color:{color};border:1px solid {color}44;margin-right:8px}}
  p{{color:#a0b4cc;line-height:1.8;margin-bottom:12px}}
  table{{width:100%;border-collapse:collapse;margin:8px 0}}
  td{{padding:9px 12px;border-bottom:1px solid #1e2a3a;font-size:0.88rem}}
  ul{{padding-left:22px;color:#a0b4cc;line-height:2}}
  .section{{background:#0c1628;border:1px solid #1e2a3a;border-radius:16px;padding:24px;margin-bottom:18px}}
  .print-note{{text-align:center;color:#2a4a6a;font-size:0.73rem;margin-top:32px}}
  @media print{{
    body{{background:#fff;color:#111;padding:20px}}
    .section{{background:#f8fafc;border-color:#e2e8f0}}
    h1,h2{{color:#1e3a5f}} td{{border-color:#e2e8f0}}
    .print-note{{display:none}}
  }}
</style>
</head>
<body>
  <div style="margin-bottom:28px">
    <h1>🔬 AI Readiness Report</h1>
    <p style="font-family:monospace;color:#5a7a9a;font-size:0.85rem;margin-top:4px">{source}</p>
    <p style="font-size:0.75rem;color:#3a5a7a;margin-top:2px">{created[:19] if created else ''}</p>
  </div>

  <div class="section">
    <div class="score-box">{score}<span style="font-size:1rem;opacity:0.5">/100</span></div>
    <span class="badge">{status} Readiness</span>
    <h2>Executive Summary</h2>
    <p>{summary_txt}</p>
    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">{caps_html}</div>
  </div>

  <div class="section">
    <h2>📊 Layer Scores</h2>
    <table><tbody>{layer_rows}</tbody></table>
  </div>

  <div class="section">
    <h2>⛔ Hard Blockers</h2>
    <ul>{blockers_html}</ul>
  </div>

  <div class="section">
    <h2>⚠️ Risk Register</h2>
    <ul>{risks_html}</ul>
  </div>

  <div class="section">
    <h2>🎯 Roadmap to AI-Ready (80+)</h2>
    <ul>{tips_html}</ul>
  </div>

  <p class="print-note">
    App Reader v2.0 — AI Readiness Assessment Platform<br>
    Press <strong>Ctrl+P</strong> → <strong>Save as PDF</strong>
  </p>
</body>
</html>"""

    return HTMLResponse(
        content=html,
        headers={"Content-Disposition": f'inline; filename="report_{report_id[:8]}.html"'},
    )

@router.get("/{report_id}/ai")
async def get_ai_report(report_id: str, user_id: str = Depends(get_current_user_id)):
    report = await assessment_repo.get_by_id(report_id, user_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report.get("ai_report", {})