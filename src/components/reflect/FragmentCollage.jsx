import FragmentCard from './FragmentCard';

export default function FragmentCollage({ fragments, selectedIds = new Set(), onToggle }) {
  if (!fragments || fragments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 max-w-7xl mx-auto">
      {fragments.map((fragment) => (
        <FragmentCard
          key={fragment.id}
          fragment={fragment}
          selected={selectedIds.has(fragment.id)}
          onClick={onToggle ? () => onToggle(fragment.id) : undefined}
        />
      ))}
    </div>
  );
}
