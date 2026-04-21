from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_ai_report(data):
    """
    Generate structured AI report in JSON format
    """

    prompt = f"""
You are a senior AI architect.

Analyze the given system assessment data and return a STRICT JSON response.

DO NOT return markdown.
DO NOT return explanation.
ONLY return valid JSON.

Required JSON format:

{{
  "summary": "string",
  "risks": ["string", "string"],
  "recommendations": ["string", "string"],
  "verdict": "Ready | Needs Improvement | Not Ready"
}}

SYSTEM DATA:
{json.dumps(data)}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except Exception:
        # fallback if model messes up
        return {
            "summary": content,
            "risks": [],
            "recommendations": [],
            "verdict": "Unknown"
        }