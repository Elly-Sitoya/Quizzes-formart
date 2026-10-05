import React, { useState } from 'react';
import SegmentIntro from './SegmentIntro.jsx';
import AudioChunkPlayer from '../components/AudioChunkPlayer.jsx';
import QuestionPanel from '../components/QuestionPanel.jsx';
import ProgressIndicator from '../components/ProgressIndicator.jsx';
import ResultsScreen from '../components/ResultsScreen.jsx';
import {
  getSegment,
  startSession,
  submitAnswer,
  finishSession,
  getResults,
} from '../api/client.js';

// Statically known while the app only ever shows one segment per session.
// Once there's a "list all segments" endpoint, this can be fetched instead.
const AVAILABLE_SEGMENTS = [
  { slug: 'tense-overview-time-concept', label: 'Tense Overview & Time Concept' },
  { slug: 'modalverben', label: 'Modalverben — Present, Past & Alternatives' },
];

// Orchestrates the whole session state machine:
// intro -> loading -> in_progress (per chunk: play -> awaiting_answer -> submitted)
//        -> finishing -> finished (results)
export default function QuizSession() {
  const [phase, setPhase] = useState('intro'); // intro | loading | in_progress | finishing | finished | error
  const [error, setError] = useState(null);

  const [segment, setSegment] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(AVAILABLE_SEGMENTS[0].slug);

  const [chunkIndex, setChunkIndex] = useState(0);
  const [canAnswer, setCanAnswer] = useState(false);

  const [results, setResults] = useState(null);

  const handleStart = async () => {
    setPhase('loading');
    setError(null);
    try {
      const { segment: seg, chunks: chks } = await getSegment(selectedSlug);
      const session = await startSession(seg.id);
      setSegment(seg);
      setChunks(chks);
      setSessionId(session.id);
      setChunkIndex(0);
      setCanAnswer(false);
      setPhase('in_progress');
    } catch (err) {
      setError(err.message);
      setPhase('intro');
    }
  };

  const handlePlaybackEnd = () => setCanAnswer(true);

  const handleAnswerSubmit = async (answersMap) => {
    const currentChunk = chunks[chunkIndex];
    try {
      // Submit every question's answer for this chunk.
      await Promise.all(
        currentChunk.questions.map((q) => submitAnswer(sessionId, q.id, answersMap[q.id]))
      );

      const isLastChunk = chunkIndex === chunks.length - 1;
      if (isLastChunk) {
        setPhase('finishing');
        await finishSession(sessionId);
        const finalResults = await getResults(sessionId);
        setResults(finalResults);
        setPhase('finished');
      } else {
        setChunkIndex((i) => i + 1);
        setCanAnswer(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestart = () => {
    setPhase('intro');
    setSegment(null);
    setChunks([]);
    setSessionId(null);
    setChunkIndex(0);
    setCanAnswer(false);
    setResults(null);
    setError(null);
  };

  if (phase === 'intro' || phase === 'loading') {
    return (
      <SegmentIntro
        segment={segment}
        onStart={handleStart}
        loading={phase === 'loading'}
        error={error}
        availableSegments={AVAILABLE_SEGMENTS}
        selectedSlug={selectedSlug}
        onSelectSlug={setSelectedSlug}
      />
    );
  }

  if (phase === 'finished' && results) {
    return <ResultsScreen results={results} onRestart={handleRestart} />;
  }

  if (phase === 'finishing') {
    return <p className="status-text">Ergebnis wird berechnet…</p>;
  }

  const currentChunk = chunks[chunkIndex];

  return (
    <div className="quiz-session">
      <ProgressIndicator current={chunkIndex + 1} total={chunks.length} />

      <AudioChunkPlayer chunk={currentChunk} onPlaybackEnd={handlePlaybackEnd} />

      <QuestionPanel
        key={currentChunk.id}
        questions={currentChunk.questions}
        disabled={!canAnswer}
        onSubmit={handleAnswerSubmit}
      />

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
