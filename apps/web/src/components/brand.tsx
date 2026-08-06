import Link from "next/link";
export function Brand() {
  return <Link href="/" aria-label="Beat X Ray home">
    <div className="brand">BEAT <span className="brand-x">&gt;X&lt;</span> RAY</div>
    <div className="tag">A product of ZeroHype Organization</div>
  </Link>;
}
