import { useState, useEffect, useRef } from "react";

export function useTypewriter(text: string, speed = 50) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;

    const type = () => {
      const index = indexRef.current;

      // Bezpečnost – nepřidá undefined
      if (index < text.length) {
        setDisplayed((prev) => prev + text[index]);
        indexRef.current++;
      }

      if (indexRef.current < text.length) {
        timeoutRef.current = window.setTimeout(type, speed);
      }
    };

    timeoutRef.current = window.setTimeout(type, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]);

  return displayed;
}
