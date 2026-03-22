import { useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Virtuoso } from 'react-virtuoso';
import MessageCard from './MessageCard';
import EmptyState from './EmptyState';
import EditModal from '../shared/EditModal';
import ConfirmModal from '../shared/ConfirmModal';

export default function MessageFeed({ messages, onDelete, onEdit }) {
  const virtuosoRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const editingMsg = editingId && messages.find((m) => m.id === editingId);
  const confirmingMsg = confirmingId && messages.find((m) => m.id === confirmingId);

  const itemContent = useCallback(
    (index) => {
      const msg = messages[index];
      return (
        <div className="px-4">
          <MessageCard
            message={msg}
            onEdit={setEditingId}
            onDelete={setConfirmingId}
          />
        </div>
      );
    },
    [messages]
  );

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <Virtuoso
        ref={virtuosoRef}
        className="flex-1 min-h-0"
        totalCount={messages.length}
        itemContent={itemContent}
        followOutput="smooth"
        initialTopMostItemIndex={messages.length - 1}
      />

      {editingMsg && createPortal(
        <EditModal
          open
          initialText={editingMsg.text}
          initialImages={editingMsg.images}
          initialLocation={editingMsg.location}
          onSave={(text, images, location) => { onEdit(editingId, text, images, location); setEditingId(null); }}
          onCancel={() => setEditingId(null)}
        />,
        document.body
      )}
      {confirmingMsg && createPortal(
        <ConfirmModal
          open
          onConfirm={() => { onDelete(confirmingId); setConfirmingId(null); }}
          onCancel={() => setConfirmingId(null)}
        />,
        document.body
      )}
    </>
  );
}
