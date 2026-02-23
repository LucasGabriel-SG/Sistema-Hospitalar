import { useCallback, useRef } from 'react';

export const useSpeech = () => {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  if (typeof window !== 'undefined') {
    synthRef.current = window.speechSynthesis;
  }

  const speak = useCallback((text: string, rate: number = 0.9) => {
    if (!synthRef.current) return;
    
    // Cancelar qualquer fala anterior
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Tentar encontrar uma voz em português
    const voices = synthRef.current.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  const isSpeaking = useCallback(() => {
    return synthRef.current?.speaking || false;
  }, []);

  return { speak, stop, isSpeaking };
};

export default useSpeech;
