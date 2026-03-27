import { getDecay, computeBaseHalfLife } from './decay';

export function getStats(nodes) {
  const atoms = nodes.filter(n => n.level === 'atom');
  const molecules = nodes.filter(n => n.level === 'molecule');

  const baseHalfLife = computeBaseHalfLife();
  const aliveAtoms = atoms.filter(n => getDecay(n, baseHalfLife).retention > 0.5).length;
  const aliveMolecules = molecules.filter(n => getDecay(n, baseHalfLife).retention > 0.5).length;

  return {
    totalAtoms: atoms.length,
    totalMolecules: molecules.length,
    aliveAtoms,
    aliveMolecules,
    aliveRatio: atoms.length > 0
      ? Math.round((aliveAtoms / atoms.length) * 100) : 0,
  };
}
