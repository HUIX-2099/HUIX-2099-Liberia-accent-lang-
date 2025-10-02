import asyncio
import io
import os
from typing import Optional

from flask import Flask, jsonify, render_template, request, send_file
import edge_tts

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/voices")
def api_voices():
    try:
        voices = asyncio.run(edge_tts.list_voices())
        # Keep all voices; the frontend may filter. Return minimal fields commonly used.
        simplified = [
            {
                "ShortName": v.get("ShortName"),
                "Locale": v.get("Locale"),
                "Gender": v.get("Gender"),
                "DisplayName": v.get("DisplayName"),
                "StyleList": v.get("StyleList", []),
            }
            for v in voices
        ]
        return jsonify({"voices": simplified})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _guess_mimetype(fmt: str) -> str:
    f = fmt.lower()
    if "mp3" in f:
        return "audio/mpeg"
    if "wav" in f or "riff" in f:
        return "audio/wav"
    if "ogg" in f or "opus" in f:
        return "audio/ogg"
    if "webm" in f:
        return "audio/webm"
    return "application/octet-stream"


@app.post("/api/tts")
def api_tts():
    try:
        data = request.get_json(force=True) or {}
        text: str = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Missing 'text'"}), 400

        voice: str = data.get("voice") or "en-NG-AbeoNeural"  # West Africa English
        rate: Optional[str] = data.get("rate") or "+0%"
        pitch: Optional[str] = data.get("pitch") or "+0Hz"
        volume: Optional[str] = data.get("volume") or "+0%"
        audio_format: str = data.get("format") or "audio-24khz-48kbitrate-mono-mp3"

        async def synth() -> bytes:
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                pitch=pitch,
                volume=volume,
            )
            audio_bytes = bytearray()
            async for chunk in communicate.stream(format=audio_format):
                if chunk["type"] == "audio":
                    audio_bytes.extend(chunk["data"])
            return bytes(audio_bytes)

        audio = asyncio.run(synth())

        if not audio:
            return jsonify({"error": "No audio generated"}), 500

        mimetype = _guess_mimetype(audio_format)
        filename_ext = "mp3" if mimetype == "audio/mpeg" else (
            "wav" if mimetype == "audio/wav" else (
                "ogg" if mimetype == "audio/ogg" else "bin"
            )
        )
        return send_file(
            io.BytesIO(audio),
            mimetype=mimetype,
            as_attachment=False,
            download_name=f"tts.{filename_ext}",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
