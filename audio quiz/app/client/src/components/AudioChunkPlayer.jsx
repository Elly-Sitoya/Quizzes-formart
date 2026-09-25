import React, { useEffect, useRef, useState } from 'react';

// Plays one chunk's audio. If the chunk has a real `audio_url`, it plays
// that file. Otherwise (the prototype's default, since no recordings
// exist yet) it falls back to speaking the German `transcript` aloud via
// the browser's speech synthesis — a stand-in for real recorded audio.
export default function AudioChunkPlayer({ chunk, onPlaybackEnd, autoPlay = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const audioRef = useRef(null);

  const speak = () => {
    if (!chunk.audio_url) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chunk.transcript);
      utterance.lang = 'de-DE';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setHasPlayedOnce(true);
        onPlaybackEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    if (autoPlay) speak();
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunk.id]);

  return (
    <div className="audio-chunk-player">
      {chunk.audio_url && (
        <audio
          ref={audioRef}
          src={chunk.audio_url}
          onPlay={() => setIsPlaying(true)}
          onEnded={() => {
            setIsPlaying(false);
            setHasPlayedOnce(true);
            onPlaybackEnd?.();
          }}
        />
      )}

      <div className="audio-status">
        {isPlaying ? 'Wird abgespielt…' : hasPlayedOnce ? 'Wiedergabe beendet' : 'Bereit'}
      </div>

      <button type="button" className="btn btn-secondary" onClick={speak} disabled={isPlaying}>
        {hasPlayedOnce ? '🔁 Nochmal hören' : '▶️ Abspielen'}
      </button>

      {!chunk.audio_url && (
        <p className="audio-note">
          (Prototyp: German gesprochen per Browser-TTS statt einer echten Aufnahme.)
        </p>
      )}
    </div>
  );
}
