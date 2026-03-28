import { useState, useCallback } from 'react';
import { RotateCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { getStrength, getOpacity } from '../../engine/decay';
import useChatStore from '../../store/useChatStore';
import { useTranslation } from '../../i18n';

export default function MessageBubble({ message, onRetry }) {
  const { t } = useTranslation();
  const strengthenMessage = useChatStore((s) => s.strengthenMessage);
  const loading = useChatStore((s) => s.loading);
  const [pulse, setPulse] = useState(false);

  useChatStore((s) => s.decayTick);

  const strength = getStrength(message.lastInteractionTime, message.stability);
  const opacity = getOpacity(strength);

  const isUser = message.role === 'user';

  const handleClick = useCallback(() => {
    strengthenMessage(message.id);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  }, [message.id, strengthenMessage]);

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
        }}
        style={{ opacity }}
        className={`relative max-w-[80%] rounded-2xl px-3.5 py-2.5 cursor-pointer select-none
          transition-all duration-200
          ${pulse ? 'scale-[1.03] brightness-110' : ''}
          ${isUser
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-bl-md'
          }`}
      >
        <div className={`text-sm leading-relaxed break-words ${isUser ? 'markdown-user' : 'markdown-ai'}`}>
          <Markdown>{message.text}</Markdown>
        </div>
        {/* Strength bar */}
        <div className="mt-1.5 h-0.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500
              ${isUser ? 'bg-white/40' : 'bg-indigo-500/50'}`}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>
      {isUser && onRetry && (
        <button
          onClick={() => onRetry(message.id)}
          disabled={loading}
          className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-xs text-stone-400 dark:text-stone-500
            hover:text-indigo-500 dark:hover:text-indigo-400
            hover:bg-stone-100 dark:hover:bg-stone-800
            active:bg-stone-200 dark:active:bg-stone-700
            disabled:opacity-40 transition-colors"
        >
          <RotateCw size={14} />
          {t('composer.retry')}
        </button>
      )}
    </div>
  );
}
