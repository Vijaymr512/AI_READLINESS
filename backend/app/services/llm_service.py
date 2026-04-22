import os
import json
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Clients
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_prompt(summary_data):
    return f"""
You are an expert AI system.

Analyze the following software project summary and return STRICT JSON only.

DATA:
{json.dumps(summary_data)}

Return ONLY valid JSON:
{{
  "summary": "Short evaluation",
  "risks": ["Top risks"],
  "recommendations": ["Top actions"],
  "verdict": "Ready / Not Ready"
}}
"""


def generate_ai_report(report_data):

    # 🔥 Reduce input size
    summary_data = {
        "score": report_data.get("score"),
        "status": report_data.get("status"),
        "top_risks": [
            r.get("name") if isinstance(r, dict) else str(r)
            for r in report_data.get("risks", [])[:3]
        ],
        "blockers": report_data.get("blockers", []),
    }

    prompt = build_prompt(summary_data)

    # =========================
    # 🧠 TRY GROQ FIRST
    # =========================
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()
        return parse_json(content)

    except Exception as e:
        print("⚠️ Groq failed:", str(e))

    # =========================
    # 🔁 FALLBACK → OPENAI
    # =========================
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",   # cost-efficient + fast
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()
        return parse_json(content)

    except Exception as e:
        print("❌ OpenAI fallback failed:", str(e))

        return {
            "summary": "AI generation failed",
            "risks": [],
            "recommendations": [],
            "verdict": "Unknown"
        }


def parse_json(content):
    try:
        if content.startswith("```"):
            content = content.strip("```").strip("json").strip()
        return json.loads(content)
    except:
        return {
            "summary": content,
            "risks": [],
            "recommendations": [],
            "verdict": "Unknown"
        }