import Link from "next/link";

import { Brand } from "@/components/brand";

export const metadata = { title: "Terms of Use | BeatXray" };

export default function TermsPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Brand />
        <Link className="btn" href="/">
          Home
        </Link>
      </nav>
      <article className="card" style={{ maxWidth: 900, margin: "48px auto" }}>
        <div className="tag">Product notice</div>
        <h1>BeatXray Terms of Use</h1>
        <p className="notice">Effective date: August 15, 2026. This product notice requires review and approval by the ZeroHype Organization’s legal representative before public launch.</p>
        <h2>Educational purpose and authorized use</h2>
        <p>
          BeatXray provides AI-assisted analysis of rendered audio to support music-production education. You may upload only audio that you own or are authorized to submit for this purpose. You are responsible for obtaining all necessary rights, permissions, and consents.
        </p>
        <h2>What BeatXray produces</h2>
        <p>
          Results can include estimated stems, tempo, key, chord windows, arrangement sections, MIDI material, and DAW-oriented import assets. These results are estimates from rendered audio. They are not the original multitrack session, not a recovered plugin chain, and not a guarantee of musical or technical accuracy.
        </p>
        <h2>Prohibited use</h2>
        <p>
          Do not use BeatXray to infringe copyright, evade access controls, impersonate creators, distribute unauthorized material, or represent estimates as an original artist’s session data. Do not upload unlawful, harmful, or rights-restricted material unless you have the required authorization.
        </p>
        <h2>Subscriptions and access</h2>
        <p>
          Subscription payments, cancellations, and billing updates are handled through the hosted billing interface when enabled. Access and monthly analysis limits are enforced according to the plan configured for your account. Paid-plan prices, features, and tax treatment must be confirmed in the checkout flow before payment.
        </p>
        <h2>Availability and changes</h2>
        <p>
          BeatXray may change, suspend, or discontinue features to protect users, comply with law, or maintain the service. The service does not guarantee uninterrupted processing or preservation of files beyond the documented retention policy.
        </p>
        <h2>Contact and finalization</h2>
        <p>
          A production legal contact, governing-law clause, business address, data-retention period, and counsel-approved limitation-of-liability language must be added before this notice is treated as final public terms.
        </p>
      </article>
    </main>
  );
}
