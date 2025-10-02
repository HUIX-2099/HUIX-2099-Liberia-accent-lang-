# Liberian Accent TTS (Flask + edge-tts)

A lightweight Flask web app that uses Microsoft Edge TTS voices (via `edge-tts`) to synthesize speech approximating a Liberian English accent. The UI lets you pick voices, adjust rate/pitch/volume, choose audio formats, and play/download audio.

## Project Structure

- `app.py` — Flask server exposing `/` (UI), `/api/voices`, `/api/tts`.
- `templates/index.html` — UI markup.
- `static/js/main.js` — Frontend logic to load voices and synthesize.
- `requirements.txt` — Python dependencies.

## Prerequisites

- Python 3.9+ on Windows.
- Internet access (Edge TTS uses online voices).

## Quick Start

1. Create and activate a virtual environment (optional):

   PowerShell
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

3. Run the app:

   ```powershell
   python app.py
   ```

4. Open your browser to:

   - http://localhost:5000

## Usage Tips (Liberian-like Accent)

- Start with West African English voices such as:
  - `en-NG-AbeoNeural`, `en-NG-EzinneNeural` (Nigeria)
  - `en-GH-KofiNeural`, `en-GH-AkuaNeural` (Ghana)
- Adjust speech prosody:
  - Try `Rate`: `-5%` to `+5%` for more natural pacing.
  - Try slight `Pitch` changes (`-3Hz` or `+3Hz`).
- Use text that reflects Liberian English idioms (e.g., “How your body?”) for more authentic-sounding results.

## API

- `GET /api/voices` → Returns available voices with basic fields.
- `POST /api/tts` body:
  ```json
  {
    "text": "Hello there",
    "voice": "en-NG-AbeoNeural",
    "rate": "+0%",
    "pitch": "+0Hz",
    "volume": "+0%",
    "format": "audio-24khz-48kbitrate-mono-mp3"
  }
  ```
  Responds with audio bytes (Content-Type depends on chosen format).

## Notes

- Voice availability can change; the app lists whatever Microsoft currently exposes.
- If audio doesn’t play, try a different format (e.g., `riff-24khz-16bit-mono-pcm` for WAV).
- This app does not require Azure keys; it relies on public Edge voices used by the `edge-tts` library.