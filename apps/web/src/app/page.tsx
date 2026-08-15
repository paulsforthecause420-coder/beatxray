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
          Upload authorized audio and receive an AI-assisted educational production reconstruction: organized stems, tempo and key analysis, arrangement markers, MIDI-ready data, and a DAW-oriented project package for FL Studio or Ableton Live.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/login">
            X-Ray a song
          </Link>
          <a className="btn" href="#process">
            See the process
          </a>
        </div>
        <p className="notice">
          BeatXray produces estimates from rendered audio. It does not recover an original production session or plugin chain. Upload only material you own or are authorized to analyze.
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
          <h3>Reconstruct</h3>
          <p>Download a project package designed to help you study and rebuild production techniques inside your chosen DAW.</p>
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
