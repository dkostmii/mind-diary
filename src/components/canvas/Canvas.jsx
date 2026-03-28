import { useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useChatStore from '../../store/useChatStore';
import MessageBubble from './MessageBubble';

function TypingIndicator() {
  return (
    <div className="flex justify-start px-3 pb-2">
      <div className="rounded-2xl rounded-bl-md bg-stone-200 dark:bg-stone-700 px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-stone-400 dark:bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function Canvas({ onRetry }) {
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const virtuosoRef = useRef(null);

  useEffect(() => {
    virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
  }, [messages.length, loading]);

  const renderItem = useCallback((index) => {
    const msg = messages[index];
    return (
      <div className="px-3 py-1">
        <MessageBubble message={msg} onRetry={onRetry} />
      </div>
    );
  }, [messages, onRetry]);

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="flex-1 min-h-0"
      totalCount={messages.length}
      itemContent={renderItem}
      followOutput="smooth"
      initialTopMostItemIndex={messages.length - 1}
      components={{
        Footer: loading ? TypingIndicator : undefined,
      }}
    />
  );
}
