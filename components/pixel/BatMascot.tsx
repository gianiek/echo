export default function BatMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`mascot ${className}`} aria-hidden="true">
      <span className="eye eye--l" />
      <span className="eye eye--r" />
    </div>
  );
}
