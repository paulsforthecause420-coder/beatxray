import Link from "next/link";
import { AudioLines, FileAudio, SlidersHorizontal } from "lucide-react";

import { Brand } from "@/components/brand";

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav">
        <Brand />
        <Link className="btn" href="/login">
          Sign in
        </Link>
      </nav>
      <section className="hero">
        <h1>
          SEE INSIDE
          <br />
          THE BEAT.
        </h1>
        <h2>Beat &gt;X&lt; Ray</h2>
        <p>
          Turn authorized audio into explainable production intelligence and creator-controlled mastering guidance. Inspect stems, tempo, key, arrangement, dynamics, clipping, stereo behavior and a recommended mastering starting chain.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/login">
            Analyze and master
          </Link>
          <a className="btn" href="#process">
            See the process
          </a>
        </div>
        <p className="notice">
          BeatXray produces estimates and assisted-mastering recommendations from rendered audio. It does not recover an original session or guarantee release-platform loudness. Upload only material you own or are authorized to process.
        </p>
      </section>
      <section id="process" className="grid">
        <div className="card">
          <FileAudio />
          <h3>Upload</h3>
          <p>Audio uploads directly to protected object storage instead of passing through the web server.</p>
        </div>
        <div className="card">
          <AudioLines />
          <h3>Analyze</h3>
          <p>The processing worker separates stems and extracts musical structure, tempo, key, and arrangement clues.</p>
        </div>
        <div className="card">
          <SlidersHorizontal />
          <h3>Master with control</h3>
          <p>Review explainable peak, dynamics, clipping and stereo findings before approving any future processing settings.</p>
        </div>
      </section>
      <footer className="footer">
        <span>© 2026 ZeroHype Organization</span>
        <span>
          <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · BeatXray.com · ZeroHype.org
        </span>
      </footer>
    </main>
  );
}
