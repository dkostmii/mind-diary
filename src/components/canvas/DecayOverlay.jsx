import { getDecay } from '../../engine/decay';

export default function DecayOverlay({ node, children }) {
  const { opacity, blur } = getDecay(node);
  return (
    <div
      style={{
        opacity,
        filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
        transition: 'opacity 0.5s, filter 0.5s',
      }}
    >
      {children}
    </div>
  );
}
