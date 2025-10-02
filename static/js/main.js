async function getVoices() {
  const res = await fetch('/api/voices');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.voices || [];
}

function pickDefaultVoice(voices) {
  // Prefer West African English if available
  const preferredLocales = ['en-NG', 'en-GH'];
  for (const loc of preferredLocales) {
    const v = voices.find(x => (x.Locale || '').startsWith(loc));
    if (v) return v.ShortName;
  }
  // Fallback to any English voice
  const en = voices.find(x => (x.Locale || '').startsWith('en-'));
  return en ? en.ShortName : (voices[0]?.ShortName || 'en-US-AriaNeural');
}

async function populateVoices() {
  const voiceSel = document.getElementById('voice');
  voiceSel.innerHTML = '<option>Loading voices…</option>';
  try {
    const voices = await getVoices();
    const groups = {};
    for (const v of voices) {
      const key = v.Locale || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    voiceSel.innerHTML = '';
    Object.keys(groups).sort().forEach(locale => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = locale;
      groups[locale].sort((a,b) => (a.ShortName||'').localeCompare(b.ShortName||''));
      for (const v of groups[locale]) {
        const opt = document.createElement('option');
        opt.value = v.ShortName;
        opt.textContent = `${v.ShortName} ${v.DisplayName ? '— ' + v.DisplayName : ''}`;
        optgroup.appendChild(opt);
      }
      voiceSel.appendChild(optgroup);
    });

    // set default
    const def = pickDefaultVoice(voices);
    voiceSel.value = def;
  } catch (e) {
    voiceSel.innerHTML = '<option>Failed to load voices</option>';
    console.error(e);
  }
}

async function synthesize() {
  const text = document.getElementById('text').value.trim();
  const voice = document.getElementById('voice').value;
  const rate = document.getElementById('rate').value;
  const pitch = document.getElementById('pitch').value;
  const volume = document.getElementById('volume').value;
  const format = document.getElementById('format').value;
  const status = document.getElementById('status');
  const player = document.getElementById('player');
  const download = document.getElementById('download');

  if (!text) { status.textContent = 'Please enter some text.'; return; }

  status.textContent = 'Synthesizing…';
  download.style.display = 'none';
  player.removeAttribute('src');

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate, pitch, volume, format }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    player.src = url;
    player.play().catch(() => {});

    // infer extension for download
    const mime = blob.type || 'audio/mpeg';
    let ext = 'mp3';
    if (mime.includes('wav')) ext = 'wav';
    else if (mime.includes('ogg')) ext = 'ogg';
    else if (mime.includes('webm')) ext = 'webm';

    download.href = url;
    download.download = `tts.${ext}`;
    download.style.display = 'inline-block';
    status.textContent = 'Ready.';
  } catch (e) {
    console.error(e);
    status.textContent = 'Error: ' + e.message;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  populateVoices();
  document.getElementById('speak').addEventListener('click', synthesize);
});
