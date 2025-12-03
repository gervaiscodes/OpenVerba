import { useState, useEffect, useRef } from 'react';
import { PlayIcon } from './icons/PlayIcon';

interface PronunciationPracticeProps {
  targetText: string;
  language: string;
  onComplete?: (score: number) => void;
  isRecording?: boolean;
}

// Simple Levenshtein distance for scoring
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[.,!?;:]/g, '').trim();

  if (s1 === s2) return 100;
  if (s1.length === 0) return 0;
  if (s2.length === 0) return 0;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) { track[0][i] = i; }
  for (let j = 0; j <= s2.length; j += 1) { track[j][0] = j; }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

export function PronunciationPractice({ targetText, language, onComplete, isRecording: externalIsRecording }: PronunciationPracticeProps) {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalIsRecording;
  const setIsRecording = externalIsRecording !== undefined ? (() => {}) : setInternalIsRecording;
  const [transcript, setTranscript] = useState('');
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Combine accumulated transcript with current session
        const currentTranscript = finalTranscript || interimTranscript;
        const fullTranscript = accumulatedTranscript
          ? accumulatedTranscript + ' ' + currentTranscript
          : currentTranscript;
        setTranscript(fullTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError(event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setError('Speech recognition not supported in this browser.');
    }
  }, [accumulatedTranscript]);


  useEffect(() => {
    if (!isRecording && transcript) {
      const calculatedScore = calculateSimilarity(targetText, transcript);
      setScore(calculatedScore);
      if (onComplete) onComplete(calculatedScore);
    }
  }, [isRecording, transcript, targetText, onComplete]);

  // Reset accumulated transcript when target text changes (new sentence)
  useEffect(() => {
    setAccumulatedTranscript('');
    setTranscript('');
    setScore(null);
  }, [targetText]);

  // Handle recording state changes from parent
  useEffect(() => {
    if (externalIsRecording === undefined) return; // Only respond to external control

    if (isRecording) {
      // Only clear if starting completely fresh (no accumulated transcript)
      if (!accumulatedTranscript) {
        setTranscript('');
        setScore(null);
        setError(null);
      }
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start recording:", e);
        setError("Failed to start recording. Please try again.");
      }
    } else {
      // When stopping, save the current transcript to accumulated
      if (transcript) {
        setAccumulatedTranscript(transcript);
      }
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error("Failed to stop recording:", e);
      }
    }
  }, [isRecording, externalIsRecording]);

  return (
    <div className="pronunciation-practice">
      <div style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#e4e4e7' }}>
        {targetText}
      </div>

      <div style={{ flex: 1 }}>
        {isRecording ? (
          <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Listening... {transcript}</span>
        ) : transcript ? (
           <span style={{ color: '#a1a1aa' }}>You said: "{transcript}"</span>
        ) : (
          <span style={{ color: '#71717a' }}>Click record and speak...</span>
        )}
      </div>

      {score !== null && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: score > 80 ? '#4ade80' : score > 50 ? '#fbbf24' : '#ef4444'
          }}>
            {score}%
          </span>
          <span style={{ color: '#a1a1aa' }}>accuracy</span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
