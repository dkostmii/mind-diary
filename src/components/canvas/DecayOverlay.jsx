import { getDecay } from '../../engine/decay';
import useNodeStore from '../../store/useNodeStore';

// Text atoms always have a minimum blur in the feed so they're hinted at
// but require opening the detail to read fully.
const TEXT_MIN_BLUR = 1.5;

export default function DecayOverlay({ node, sharp = false, children }) {
  const nodes = useNodeStore((s) => s.nodes);
  const { opacity, blur } = getDecay(node, nodes);

  const isTextAtom = node.level === 'atom' && node.type === 'text';
  const effectiveBlur = isTextAtom ? Math.max(TEXT_MIN_BLUR, blur) : blur;

  return (
    <div
      style={{
        opacity: sharp ? 1 : opacity,
        filter: sharp ? 'none' : (effectiveBlur > 0.5 ? `blur(${effectiveBlur}px)` : 'none'),
        transition: 'opacity 0.3s, filter 0.3s',
      }}
    >
      {children}
    </div>
  );
}
