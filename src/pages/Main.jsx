import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import useNodeStore from '../store/useNodeStore';
import Canvas from '../components/canvas/Canvas';
import Composer from '../components/composer/Composer';
import LinkSheet from '../components/combine/LinkSheet';
import NodeDetail from '../components/detail/NodeDetail';
import EmptyState from '../components/shared/EmptyState';

export default function Main() {
  const nodes = useNodeStore((s) => s.nodes);
  const [detailNodeId, setDetailNodeId] = useState(null);
  const [linkParentId, setLinkParentId] = useState(null);

  const handleNodeDetail = (id) => {
    setDetailNodeId(id);
  };

  const handleAddHere = (parentId) => {
    setDetailNodeId(null);
    setLinkParentId(parentId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* App bar */}
      <header className="shrink-0 px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          Mind Diary
        </h1>
        <Link
          to="/settings"
          className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} />
        </Link>
      </header>

      {/* Canvas or empty state */}
      {nodes.length === 0 ? (
        <EmptyState />
      ) : (
        <Canvas onNodeDetail={handleNodeDetail} />
      )}

      {/* Composer (doubles as combine when items selected) */}
      <Composer />

      {/* Node detail modal */}
      {detailNodeId && (
        <NodeDetail
          nodeId={detailNodeId}
          onClose={() => setDetailNodeId(null)}
          onAddHere={handleAddHere}
        />
      )}

      {/* Link sheet */}
      <LinkSheet
        open={!!linkParentId}
        parentId={linkParentId}
        onClose={() => setLinkParentId(null)}
      />
    </div>
  );
}
