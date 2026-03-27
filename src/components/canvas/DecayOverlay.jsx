import { getDecay } from '../../engine/decay';

export default function DecayOverlay({ node, baseHalfLife, sharp = false, children }) {
  const { opacity, blur } = getDecay(node, baseHalfLife);
  return (
    <div
      style={{
        opacity: sharp ? 1 : opacity,
        filter: sharp ? 'none' : (blur > 0.5 ? `blur(${blur}px)` : 'none'),
        transition: 'opacity 0.3s, filter 0.3s',
      }}
    >
      {children}
    </div>
  );
}
