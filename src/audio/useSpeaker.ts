import { useEffect, useState } from 'react';
import { speaker } from './speaker';

/** The text currently being read aloud, or null. Re-renders on change. */
export function useSpeaking(): string | null {
  const [speaking, setSpeaking] = useState<string | null>(speaker.speaking);
  useEffect(() => speaker.subscribe((s) => setSpeaking(s.speaking)), []);
  return speaking;
}
