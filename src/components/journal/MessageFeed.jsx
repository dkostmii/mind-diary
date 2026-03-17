import { useEffect, useRef } from 'react';
import MessageCard from './MessageCard';
import EmptyState from './EmptyState';

export default function MessageFeed({ messages, onDelete, onEdit }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} onDelete={onDelete} onEdit={onEdit} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
