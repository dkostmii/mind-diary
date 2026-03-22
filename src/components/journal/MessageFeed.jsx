import { useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import MessageCard from './MessageCard';
import EmptyState from './EmptyState';

export default function MessageFeed({ messages, onDelete, onEdit }) {
  const virtuosoRef = useRef(null);

  const itemContent = useCallback(
    (index) => {
      const msg = messages[index];
      return (
        <div className="px-4">
          <MessageCard message={msg} onDelete={onDelete} onEdit={onEdit} />
        </div>
      );
    },
    [messages, onDelete, onEdit]
  );

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="flex-1 min-h-0"
      totalCount={messages.length}
      itemContent={itemContent}
      followOutput="smooth"
      initialTopMostItemIndex={messages.length - 1}
    />
  );
}
