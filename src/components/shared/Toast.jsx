import { useState, useEffect } from 'react';

export default function Toast({ message, duration = 2500, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl
        bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-800
        text-sm shadow-lg transition-opacity duration-300
        ${visible ? 'opacity-90' : 'opacity-0'}`}
    >
      {message}
    </div>
  );
}
