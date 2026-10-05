// Picks the best available German voice for the browser's built-in speech
// synthesis engine. This exists because `utterance.lang = 'de-DE'` alone
// lets the browser fall back to whatever default voice it wants — on many
// systems that's a low-quality or even non-German voice, which is why the
// prototype's German narration sounded wrong. Explicitly selecting a known
// German voice fixes that.

let voicesReadyPromise = null;

function loadVoices() {
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    // Most browsers load the voice list asynchronously — it's empty on the
    // very first call. Wait for `voiceschanged`, with a timeout fallback in
    // case a browser never fires it.
    const handle = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handle);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handle);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });

  return voicesReadyPromise;
}

// Voice names known to read German well, in preference order, checked
// across common browsers/OSes (Chrome/Edge on Windows, macOS Safari).
// The first match found on the user's machine wins.
const PREFERRED_NAMES = [
  'google deutsch',
  'microsoft katja',
  'microsoft stefan',
  'microsoft conrad',
  'microsoft amala',
  'anna',
  'helena',
  'markus',
];

// Returns the best matching SpeechSynthesisVoice for German, or null if the
// browser has no German voice installed at all (callers should keep the
// `utterance.lang = 'de-DE'` fallback for that case).
export async function getGermanVoice() {
  const voices = await loadVoices();
  const germanVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('de'));

  if (germanVoices.length === 0) return null;

  for (const name of PREFERRED_NAMES) {
    const match = germanVoices.find((v) => v.name.toLowerCase().includes(name));
    if (match) return match;
  }

  // No named match — prefer an exact de-DE locale over other German
  // locales (de-AT, de-CH) before giving up and taking the first one.
  const exact = germanVoices.find((v) => v.lang.toLowerCase() === 'de-de');
  return exact ?? germanVoices[0];
}
