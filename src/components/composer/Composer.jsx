import { useCallback } from 'react';
import { Send, Combine, Plus } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { decomposeEntry } from '../../engine/decompose';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import SharedComposer from '../shared/Composer';

function buildAttachments(images, location) {
  const attachments = [];
  for (const img of (images || [])) {
    attachments.push({ type: 'photo', data: img });
  }
  if (location) {
    attachments.push({
      type: 'location',
      name: location.name || '',
      lat: location.lat,
      lng: location.lng,
    });
  }
  return attachments;
}

export default function Composer({ disabled = false }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const addNodes = useNodeStore((s) => s.addNodes);
  const combineNodes = useNodeStore((s) => s.combineNodes);
  const addChildrenToNode = useNodeStore((s) => s.addChildrenToNode);
  const refreshCreatedAt = useNodeStore((s) => s.refreshCreatedAt);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const clear = useSelectionStore((s) => s.clear);

  const isCombining = selectedIds.length >= 2;
  const singleSelected = selectedIds.length === 1
    ? nodes.find(n => n.id === selectedIds[0])
    : null;
  const isAddingToOne = !!singleSelected;

  const handleSubmit = useCallback(async (text, images, location) => {
    const attachments = buildAttachments(images, location);

    if (isCombining) {
      await combineNodes(selectedIds, text || null, attachments);
      clear();
      return;
    }

    if (singleSelected) {
      // Stamp selected node sharp first so dissolution can't remove it
      await refreshCreatedAt(singleSelected.id);
      // Create atoms from composer input
      const newAtoms = decomposeEntry(text, attachments);
      if (newAtoms.length === 0) return;
      await addNodes(newAtoms);
      const newAtomIds = newAtoms.map(a => a.id);

      if (singleSelected.level === 'atom') {
        // Atom selected → combine it with the new atoms into a molecule
        await combineNodes([singleSelected.id, ...newAtomIds], null);
      } else {
        // Molecule selected → add new atoms as children
        await addChildrenToNode(singleSelected.id, newAtomIds);
      }
      clear();
      return;
    }

    // Normal mode: decompose into atoms
    const atoms = decomposeEntry(text, attachments);
    if (atoms.length > 0) {
      await addNodes(atoms, { fromComposer: true });
    }
  }, [addNodes, combineNodes, addChildrenToNode, refreshCreatedAt, selectedIds, clear, isCombining, singleSelected]);

  const hasSelection = isCombining || isAddingToOne;

  let placeholder, buttonLabel, buttonIcon;
  if (isCombining) {
    placeholder = t('combine.notePlaceholder');
    buttonLabel = t('combine.confirm');
    buttonIcon = Combine;
  } else if (isAddingToOne) {
    placeholder = t('combine.notePlaceholder');
    buttonLabel = t('detail.addHere');
    buttonIcon = Plus;
  } else {
    placeholder = t('composer.placeholder');
    buttonLabel = t('composer.send');
    buttonIcon = Send;
  }

  return (
    <SharedComposer
      placeholder={placeholder}
      buttonLabel={buttonLabel}
      buttonIcon={buttonIcon}
      onSubmit={handleSubmit}
      allowEmpty={isCombining}
      disabled={disabled}
    />
  );
}
