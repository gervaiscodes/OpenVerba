import { useState, useEffect, useRef } from 'react';
import { calculateSimilarity } from '../lib/calculateSimilarity';
import { compareWords, type WordResult } from '../lib/compareWords';
import { Firework } from './Firework';

import { API_BASE_URL } from "../config/api";
import { useCoin } from "../context/CoinContext";
import { useStreak } from "../context/StreakContext";

interface PronunciationPracticeProps {
  targetText: string;
  language: string;
  words: { id: number; word: string }[];
  onComplete?: (score: number) => void;
  isRecording?: boolean;
}

export function PronunciationPractice({ targetText, language, words, onComplete, isRecording: externalIsRecording }: PronunciationPracticeProps) {
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalIsRecording;
  const setIsRecording = externalIsRecording !== undefined ? (() => {}) : setInternalIsRecording;
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const recognitionRef = useRef<any>(null);
  const completedWordIds = useRef<Set<number>>(new Set());
  const { increment } = useCoin();
  const { refreshStreak } = useStreak();

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

        // Iterate from 0 to get the full transcript of the current session
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
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
  }, []); // No dependencies needed as we don't use accumulatedTranscript anymore


  useEffect(() => {
    if (transcript) {
      const calculatedScore = calculateSimilarity(targetText, transcript);
      setScore(calculatedScore);

      if (!isRecording && onComplete) {
        onComplete(calculatedScore);
      }
    }
  }, [isRecording, transcript, targetText, onComplete]);

  // Update word results when transcript changes and handle completions
  useEffect(() => {
    if (transcript) {
      const results = compareWords(targetText, transcript);
      setWordResults(results);

      // Check for correct words and trigger completion
      results.forEach(result => {
        if (result.status === 'correct' && result.targetIndex !== undefined) {
          const word = words[result.targetIndex];
          if (word && !completedWordIds.current.has(word.id)) {
            completedWordIds.current.add(word.id);

            // Call API
            fetch(`${API_BASE_URL}/api/completions`, {
              method: "POST",
              credentials: 'include',
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ word_id: word.id, method: "speaking" }),
            })
              .then((res) => {
                if (res.ok) {
                  increment();
                  refreshStreak();
                }
              })
              .catch((e) => console.error("Failed to record speaking completion:", e));
          }
        }
      });
    } else {
      setWordResults([]);
    }
  }, [transcript, targetText, words, increment]);

  // Reset when target text changes (new sentence)
  useEffect(() => {
    setTranscript('');
    setScore(null);
    setWordResults([]);
    completedWordIds.current.clear();
  }, [targetText]);

  // Handle recording state changes from parent
  useEffect(() => {
    if (externalIsRecording === undefined) return; // Only respond to external control

    if (isRecording) {
      // Always start fresh when recording starts
      setTranscript('');
      setScore(null);
      setError(null);
      setWordResults([]);
      completedWordIds.current.clear();

      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start recording:", e);
        setError("Failed to start recording. Please try again.");
      }
    } else {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error("Failed to stop recording:", e);
      }
    }
  }, [isRecording, externalIsRecording]);

  return (
    <div className="pronunciation-practice">
      <div className="text-[0.9rem] sm:text-base mb-4 text-zinc-200">
        {targetText}
      </div>

      <div className="flex-1">
        {transcript ? (
           <div className="text-zinc-400">
             {isRecording && <span className="text-red-500 italic mr-2">Listening...</span>}
             You said: "
             {wordResults.map((w, i) => (
               <span
                 key={i}
                 className={`mr-1 relative inline-block ${
                   w.status === 'correct' ? 'text-green-400' : w.status === 'almost' ? 'text-amber-400' : 'text-red-500'
                 }`}
               >
                 {w.status === 'correct' && <Firework />}
                 {w.word}
               </span>
             ))}
             "
           </div>
        ) : isRecording ? (
          <span className="text-red-500 italic">Listening...</span>
        ) : (
          <span className="text-zinc-500">Click record and speak...</span>
        )}
      </div>

      {score !== null && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-2xl font-bold ${
            score > 80 ? 'text-green-400' : score > 50 ? 'text-amber-400' : 'text-red-500'
          }`}>
            {score}%
          </span>
          <span className="text-zinc-400">accuracy</span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
