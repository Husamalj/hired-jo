"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Radio } from "lucide-react";

export function VoiceRecorder({ onTranscript }: { onTranscript?: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSupported(true);
    const recorder = new SpeechRecognition();
    recorder.continuous = false;
    recorder.interimResults = false;
    recorder.lang = "en-US";
    recorder.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ");
      onTranscript?.(transcript);
    };
    recorder.onend = () => setListening(false);
    recRef.current = recorder;
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
      className={`h-12 shrink-0 rounded-2xl px-4 font-extrabold transition inline-flex items-center gap-2 ${
        listening
          ? "bg-red-400/15 border border-red-300/25 text-red-100"
          : "gold-grad text-black"
      }`}
    >
      {listening ? <Radio size={17} className="animate-pulse" /> : <Mic size={17} />}
      <span className="hidden sm:inline">{listening ? "Listening" : "Speak"}</span>
    </button>
  );
}
