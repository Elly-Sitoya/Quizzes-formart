import { useEffect, useRef, useState } from 'react';
import './MultimediaModal.css';

const RATE_OPTIONS = [
  { value: 0.75, label: '0.75x — slower' },
  { value: 0.9, label: '0.9x — default' },
  { value: 1, label: '1x — normal' },
  { value: 1.25, label: '1.25x — faster' },
];

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// The "📽 multimedia files" modal - a fresh sentence's only route to getting
// audio attached. Two lighter-weight, "browse something existing" options
// sit on the left (audio bank, my library); three heavier, more committal
// actions sit on the right (upload, record, computer voice). Underneath,
// a separate AI route lets a trainer type/paste text and have it voiced
// instead, with the option to roll that same voice+speed out to every
// other still-silent sentence in the quiz.
export default function MultimediaModal({
  questionText,
  playbackRate,
  onAttach,
  onGenerateForAll,
  onClose,
}) {
  const [stub, setStub] = useState(null); // 'audio' | 'library' | null
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState('');
  const [aiText, setAiText] = useState(questionText || '');
  const [aiRate, setAiRate] = useState(playbackRate ?? 0.9);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generateForAll, setGenerateForAll] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);

  const recordingSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleComputerVoice = () => {
    onAttach('tts', null);
    onClose();
  };

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const dataUrl = await blobToDataUrl(blob);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onAttach('record', dataUrl);
        onClose();
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setRecordError('Microphone access was blocked or is unavailable.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioClick = () => {
    audioFileInputRef.current?.click();
  };

  const handleFileChosen = async (e, source = 'upload') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await blobToDataUrl(file);
    onAttach(source, dataUrl);
    onClose();
  };

  const handleGenerate = () => {
    if (!aiText.trim()) return;
    const utterance = new SpeechSynthesisUtterance(aiText.trim());
    utterance.rate = aiRate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    onAttach('tts', null);
    setHasGenerated(true);
  };

  const handleToggleGenerateForAll = () => {
    if (!hasGenerated) return;
    const next = !generateForAll;
    setGenerateForAll(next);
    if (next) onGenerateForAll({ rate: aiRate });
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2 className="mm-title">
            <svg className="mm-title-icon" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="115" cy="180" r="95" stroke="currentColor" strokeWidth="26" />
              <path d="M130 108 V205" stroke="currentColor" strokeWidth="26" strokeLinecap="round" />
              <path d="M130 108 C152 108 172 124 172 150" stroke="currentColor" strokeWidth="26" strokeLinecap="round" fill="none" />
              <circle cx="100" cy="216" r="30" fill="currentColor" />
              <path d="M320 90 H430 L480 140 V270 A20 20 0 0 1 460 290 H320 A20 20 0 0 1 300 270 V110 A20 20 0 0 1 320 90 Z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
              <path d="M430 90 V140 H480" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
              <line x1="335" y1="150" x2="360" y2="150" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
              <line x1="335" y1="185" x2="420" y2="185" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
              <line x1="335" y1="220" x2="450" y2="220" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
              <rect x="110" y="255" width="300" height="180" rx="20" stroke="currentColor" strokeWidth="24" />
              <path d="M235 300 L330 345 L235 390 Z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
            </svg>
            multimedia files
          </h2>
          <button type="button" className="mm-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mm-quick-row">
          <div className="mm-quick-left">
            <button
              type="button"
              className="mm-quick-btn mm-quick-small mm-quick-active"
              onClick={handleAudioClick}
            >
              <svg className="mm-btn-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="10" y="3" width="4" height="10" rx="2" />
                <path d="M6.7 9.3a1.5 1.5 0 0 1 0-2.12l4.24-4.24a1.5 1.5 0 0 1 2.12 0l4.24 4.24a1.5 1.5 0 1 1-2.12 2.12L12 6.12 8.82 9.3a1.5 1.5 0 0 1-2.12 0z" />
                <path d="M4 14.5a1.5 1.5 0 0 1 3 0V17a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5a1.5 1.5 0 0 1 3 0V17a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2.5z" />
              </svg>
              audio
            </button>
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              className="mm-hidden-input"
              onChange={(e) => handleFileChosen(e, 'audio')}
            />
            <button
              type="button"
              className="mm-quick-btn mm-quick-small"
              onClick={() => setStub('library')}
            >
              <svg className="mm-btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M2.5 10h18l-2 8a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5l-2-8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              my library
            </button>
          </div>

          <div className="mm-quick-right">
            <button
              type="button"
              className="mm-quick-btn mm-quick-large"
              onClick={handleUploadClick}
            >
              <svg className="mm-btn-icon" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="115" cy="180" r="95" stroke="currentColor" strokeWidth="26" />
                <path d="M130 108 V205" stroke="currentColor" strokeWidth="26" strokeLinecap="round" />
                <path d="M130 108 C152 108 172 124 172 150" stroke="currentColor" strokeWidth="26" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="216" r="30" fill="currentColor" />
                <path d="M320 90 H430 L480 140 V270 A20 20 0 0 1 460 290 H320 A20 20 0 0 1 300 270 V110 A20 20 0 0 1 320 90 Z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
                <path d="M430 90 V140 H480" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
                <line x1="335" y1="150" x2="360" y2="150" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="335" y1="185" x2="420" y2="185" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="335" y1="220" x2="450" y2="220" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <rect x="110" y="255" width="300" height="180" rx="20" stroke="currentColor" strokeWidth="24" />
                <path d="M235 300 L330 345 L235 390 Z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
              </svg>
              upload file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="mm-hidden-input"
              onChange={(e) => handleFileChosen(e, 'upload')}
            />
            {!isRecording ? (
              <button
                type="button"
                className="mm-quick-btn mm-quick-large"
                onClick={startRecording}
                disabled={!recordingSupported}
                title={!recordingSupported ? 'Recording is not supported in this browser' : undefined}
              >
                <svg className="mm-btn-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
                  <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
                </svg>
                record
              </button>
            ) : (
              <button
                type="button"
                className="mm-quick-btn mm-quick-large recording"
                onClick={stopRecording}
              >
                ■ stop ({formatSeconds(recordSeconds)})
              </button>
            )}
            <button type="button" className="mm-quick-btn mm-quick-large" onClick={handleComputerVoice}>
              <svg className="mm-btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
                <line x1="12" y1="4" x2="12" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="5" y="7" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="1.5" y="10" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <rect x="19.5" y="10" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="9" cy="12.5" r="1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="12.5" r="1" fill="currentColor" stroke="none" />
                <path d="M9 15.5c1 1 5 1 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </svg>
              Computer voice
            </button>
          </div>
        </div>
        {recordError && <p className="mm-error">{recordError}</p>}

        <div className="mm-button-gap" />

        <div className="mm-ai-box">
          <textarea
            className="mm-ai-textarea"
            placeholder="convert text to speech"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={3}
          />
          <div className="mm-ai-box-footer">
            <button
              type="button"
              className="mm-icon-round"
              onClick={() => setShowAiSettings((s) => !s)}
              title="Voice settings"
            >
              ⚙️
            </button>
            <button
              type="button"
              className="mm-generate-btn"
              onClick={handleGenerate}
              disabled={!aiText.trim()}
            >
              🔊 generate
            </button>
          </div>
          {showAiSettings && (
            <div className="mm-ai-settings">
              <label htmlFor="mm-rate">Speed</label>
              <select
                id="mm-rate"
                value={aiRate}
                onChange={(e) => setAiRate(Number(e.target.value))}
              >
                {RATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <label className={`mm-generate-all ${!hasGenerated ? 'disabled' : ''}`}>
          <input
            type="checkbox"
            checked={generateForAll}
            disabled={!hasGenerated}
            onChange={handleToggleGenerateForAll}
          />
          Generate for all empty fields
        </label>

        <button type="button" className="mm-cancel-btn" onClick={onClose}>
          Cancel
        </button>

        {stub && (
          <div className="mm-stub-overlay" onClick={() => setStub(null)}>
            <div className="mm-stub-modal" onClick={(e) => e.stopPropagation()}>
              <p>Coming soon.</p>
              <button type="button" className="mm-stub-close" onClick={() => setStub(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
