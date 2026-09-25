import { useEffect, useRef, useState } from 'react';
import './QuestionForm.css';

const AUDIO_MODES = [
  { value: 'tts', label: '🔊 Computer voice', hint: 'Read aloud automatically from the sentence.' },
  { value: 'record', label: '🎙️ Record my voice', hint: "Speak the sentence using your own microphone." },
  { value: 'upload', label: '📁 Upload audio', hint: 'Attach an existing audio clip.' },
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

// Lets a trainer author one dictation question: the sentence learners must
// type (always required, since it doubles as the answer key) plus how that
// sentence should be voiced for them - read aloud by the computer, recorded
// live from the trainer's own microphone, or an existing audio file they
// already have. Used for both adding a brand new question and editing one
// that already exists.
export default function QuestionForm({ initial, onSave, onCancel }) {
  const isEditing = Boolean(initial);
  const [text, setText] = useState(initial?.text ?? '');
  const [audioMode, setAudioMode] = useState(initial?.audioMode ?? 'tts');
  const [audioData, setAudioData] = useState(initial?.audioData ?? null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState('');
  const [isPreviewingTts, setIsPreviewingTts] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const recordingSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  // Make sure the mic, any running timer, and any speech preview all stop
  // if the form disappears (cancel, save, or navigating away) mid-action.
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  const resetAudio = () => {
    setAudioData(null);
    setRecordError('');
  };

  const handleModeChange = (mode) => {
    if (mode === audioMode || isRecording) return;
    setAudioMode(mode);
    resetAudio();
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
        setAudioData(dataUrl);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await blobToDataUrl(file);
    setAudioData(dataUrl);
  };

  const handlePreviewTts = () => {
    if (!text.trim()) return;
    if (isPreviewingTts) {
      window.speechSynthesis.cancel();
      setIsPreviewingTts(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = 0.9;
    utterance.onend = () => setIsPreviewingTts(false);
    window.speechSynthesis.speak(utterance);
    setIsPreviewingTts(true);
  };

  const canSave = text.trim().length > 0 && (audioMode === 'tts' || Boolean(audioData));

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      text: text.trim(),
      audioMode,
      audioData: audioMode === 'tts' ? null : audioData,
    });
    if (!isEditing) {
      setText('');
      setAudioMode('tts');
      resetAudio();
    }
  };

  return (
    <div className="question-form">
      <label className="qf-label" htmlFor="qf-text">
        Sentence learners will type (this is also the answer key)
      </label>
      <textarea
        id="qf-text"
        className="qf-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type the exact sentence learners should hear and type..."
        rows={3}
      />

      <span className="qf-label">How should learners hear this sentence?</span>
      <div className="qf-mode-row">
        {AUDIO_MODES.map((mode) => (
          <button
            type="button"
            key={mode.value}
            className={`qf-mode-btn ${audioMode === mode.value ? 'active' : ''}`}
            onClick={() => handleModeChange(mode.value)}
            disabled={mode.value === 'record' && !recordingSupported}
            title={mode.value === 'record' && !recordingSupported ? 'Recording is not supported in this browser' : mode.hint}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="qf-mode-panel">
        {audioMode === 'tts' && (
          <div className="qf-tts-panel">
            <p className="qf-hint">The sentence above will be read aloud by the browser's built-in voice.</p>
            <button type="button" className="qf-preview-btn" onClick={handlePreviewTts} disabled={!text.trim()}>
              {isPreviewingTts ? '⏸ Stop preview' : '▶ Preview voice'}
            </button>
          </div>
        )}

        {audioMode === 'record' && (
          <div className="qf-record-panel">
            {!recordingSupported && (
              <p className="qf-error">Your browser doesn't support microphone recording.</p>
            )}
            {!audioData && !isRecording && recordingSupported && (
              <button type="button" className="qf-record-btn" onClick={startRecording}>
                ● Start recording
              </button>
            )}
            {isRecording && (
              <button type="button" className="qf-record-btn recording" onClick={stopRecording}>
                ■ Stop ({formatSeconds(recordSeconds)})
              </button>
            )}
            {audioData && !isRecording && (
              <div className="qf-audio-result">
                <audio controls src={audioData} />
                <button type="button" className="qf-secondary-btn" onClick={resetAudio}>
                  Re-record
                </button>
              </div>
            )}
            {recordError && <p className="qf-error">{recordError}</p>}
          </div>
        )}

        {audioMode === 'upload' && (
          <div className="qf-upload-panel">
            {!audioData && (
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="qf-file-input"
                onChange={handleFileUpload}
              />
            )}
            {audioData && (
              <div className="qf-audio-result">
                <audio controls src={audioData} />
                <button
                  type="button"
                  className="qf-secondary-btn"
                  onClick={() => {
                    resetAudio();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Choose a different file
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="qf-actions">
        {isEditing && (
          <button type="button" className="qf-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="qf-save-btn" onClick={handleSave} disabled={!canSave}>
          {isEditing ? 'Save changes' : 'Add question'}
        </button>
      </div>
    </div>
  );
}
