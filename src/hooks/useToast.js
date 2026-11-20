import { useCallback, useEffect, useRef, useState } from 'react';

/** A short message shown at the bottom of the screen for a few seconds. */
export function useToast(duration = 2600) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  const notify = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), duration);
  }, [duration]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [message, notify];
}
