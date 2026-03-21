export default function FixedHeader({ className, children }) {
  return (
    <header className={`shrink-0 ${className || ''}`}>
      {children}
    </header>
  );
}
