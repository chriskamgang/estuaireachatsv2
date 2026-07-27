'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  language?: string; // 'fr-FR', 'en-US', etc.
}

// Typage minimal pour Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export default function VoiceTextarea({
  value,
  onChange,
  placeholder = 'Tapez ou dictez votre texte...',
  rows = 6,
  className = '',
  label,
  language = 'fr-FR',
}: VoiceTextareaProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        const separator = value.trim() ? ' ' : '';
        onChange(value + separator + finalTranscript);
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    textareaRef.current?.focus();
  }, [value, onChange, language]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Nettoyer a la destruction
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const baseClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value + (interimText ? ` ${interimText}` : '')}
          onChange={(e) => {
            // Retirer le texte interim si l'utilisateur tape manuellement
            const newVal = e.target.value.replace(interimText, '').trimEnd();
            onChange(newVal);
          }}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClass} pr-12 ${isListening ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'}`}
        />

        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Arreter la dictee' : 'Dicter (Chrome/Edge)'}
            className={`absolute right-2 bottom-2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              {isListening ? (
                // Stop icon
                <rect x="6" y="6" width="12" height="12" rx="1" />
              ) : (
                // Mic icon
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zm7.25 7a.75.75 0 0 0-1.5 0 4.75 4.75 0 0 1-9.5 0 .75.75 0 0 0-1.5 0 6.25 6.25 0 0 0 5.5 6.21V19H9a.75.75 0 0 0 0 1.5h6A.75.75 0 0 0 15 19h-2.25v-1.79A6.25 6.25 0 0 0 18.25 11z"/>
              )}
            </svg>
          </button>
        )}
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-xs text-red-500">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping" />
          Dictee en cours... Parlez maintenant. Cliquez sur le bouton rouge pour arreter.
        </div>
      )}

      {!isSupported && (
        <p className="text-xs text-gray-400">
          Dictee vocale disponible sur Chrome et Edge uniquement.
        </p>
      )}
    </div>
  );
}
