"use client";
import { useEffect, useRef, useState } from "react";

export function VoiceRecorder({ onTranscript }: { onTranscript?: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      onTranscript?.(t);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [onTranscript]);

  if (!supported) return null;

  function toggle() {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      recRef.current.start();
      setListening(true);
    }
  }

  return (
    <button
      onClick={toggle}
      type="button"
      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
        listening
          ? "bg-red-500 text-white animate-pulse"
          : "gold-grad text-black"
      }`}
    >
      {listening ? "● Listening…" : "🎤 Speak instead"}
    </button>
  );
}
