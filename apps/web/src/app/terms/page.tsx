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
        <div className="tag">Legal</div>
        <h1>BeatXray Terms of Use</h1>
        <p className="notice">Effective date: August 17, 2026</p>

        <h2>1. Operator and acceptance</h2>
        <p>
          BeatXray is operated by Paul Bollinger, an Illinois sole proprietor located in Madison County,
          Illinois. These Terms govern your access to and use of BeatXray. By creating an account, purchasing a
          subscription, or using the service, you agree to these Terms. If you do not agree, do not use BeatXray.
        </p>

        <h2>2. Eligibility and account security</h2>
        <p>
          You must be at least 18 years old and legally capable of entering a binding agreement. You must provide
          accurate account information, protect your sign-in credentials, and promptly notify BeatXray of suspected
          unauthorized access. You are responsible for activity conducted through your account unless prohibited by
          law.
        </p>

        <h2>3. Service and product disclaimer</h2>
        <p>
          BeatXray provides AI-assisted educational and creative analysis of rendered audio. Results may include
          estimated stems, tempo, key, chords, arrangement sections, MIDI material, and DAW-oriented assets. Results
          are estimates, not the original multitrack session or recovered plugin chain, and may contain errors,
          omissions, approximations, or incompatible settings. You must review outputs before relying on, publishing,
          or distributing them.
        </p>
        <p>
          BeatXray does not determine copyright ownership, grant music licenses, or guarantee that an intended use is
          lawful. You remain responsible for permissions and compliance with copyright, contract, platform, and other
          applicable requirements. BeatXray does not guarantee uninterrupted service, permanent file storage,
          compatibility with every DAW, version, or plugin, or any artistic, educational, or commercial outcome.
        </p>

        <h2>4. Uploaded content and permission to process it</h2>
        <p>
          You retain your rights in uploaded audio and generated results. You may upload only material you own or are
          authorized to submit for analysis. You grant BeatXray a limited, nonexclusive license to host, copy,
          process, analyze, and transmit the content only as necessary to provide, secure, and support the requested
          service. BeatXray will not use uploaded audio, stems, or analysis results to train AI models unless you later
          provide separate, explicit opt-in consent.
        </p>

        <h2>5. Prohibited use</h2>
        <p>
          You may not use BeatXray to infringe intellectual-property or privacy rights; upload unlawful, malicious, or
          unauthorized material; evade access controls; impersonate another person or creator; distribute unauthorized
          material; misrepresent estimated output as original session data; probe or disrupt the service; introduce
          malware; or use automated access that unreasonably burdens the service. BeatXray may remove content or
          restrict access when reasonably necessary to address abuse, security risks, legal demands, or violations of
          these Terms.
        </p>

        <h2>6. Subscriptions, cancellation, and refunds</h2>
        <p>
          Prices, features, taxes, and billing intervals are shown in Stripe Checkout before purchase. Monthly limits
          are enforced according to the plan associated with your account. You may cancel through the hosted Stripe
          billing portal at any time. Cancellation takes effect at the end of the current paid billing period, and
          access continues through that date. Charges already paid are nonrefundable and are not prorated, except where
          required by law or when BeatXray approves a refund for a verified billing or service failure. Cancellation
          does not itself delete your account or analysis data.
        </p>

        <h2>7. Data deletion and retention</h2>
        <p>
          You may delete eligible terminal analysis jobs through the dashboard. Source audio and generated artifacts
          are scheduled for automatic deletion 30 days after a job becomes complete, failed, or cancelled; scheduled
          deletion is generally completed during the following daily cleanup cycle. Limited transaction, security,
          fraud-prevention, audit, and legal records may be retained longer where reasonably necessary. The Privacy
          Notice provides additional details.
        </p>

        <h2>8. BeatXray property and feedback</h2>
        <p>
          BeatXray and its software, branding, interface, documentation, and service content are protected by
          applicable intellectual-property laws. These Terms do not transfer ownership of BeatXray technology to you.
          If you voluntarily provide feedback, BeatXray may use it without restriction or compensation, provided the
          use does not identify you publicly without permission.
        </p>

        <h2>9. Third-party services</h2>
        <p>
          BeatXray relies on third-party infrastructure and payment services. Those services may experience outages,
          change their functionality, or apply separate terms. BeatXray is not responsible for third-party products or
          conduct beyond its reasonable control, but this provision does not limit rights that cannot legally be
          waived.
        </p>

        <h2>10. Disclaimer of warranties</h2>
        <p>
          To the fullest extent permitted by law, BeatXray is provided “as is” and “as available,” without express or
          implied warranties, including warranties of merchantability, fitness for a particular purpose, title,
          noninfringement, accuracy, availability, or compatibility. Some jurisdictions do not permit certain warranty
          exclusions, so portions of this section may not apply to you.
        </p>

        <h2>11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, BeatXray and Paul Bollinger will not be liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages; lost profits, data, opportunities, or
          goodwill; or losses arising from unauthorized uploads, inaccurate analysis, incompatible software, service
          interruption, or third-party services. Total liability for claims relating to BeatXray will not exceed the
          greater of the amount you paid BeatXray during the 12 months preceding the claim or $100. These limits do not
          apply where prohibited by law and do not waive nonwaivable consumer rights.
        </p>

        <h2>12. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless BeatXray and Paul Bollinger from third-party claims,
          damages, and reasonable costs arising from your uploaded content, lack of required rights or permissions,
          unlawful use of the service, or material violation of these Terms. This obligation does not cover losses
          caused by BeatXray&apos;s unlawful conduct, gross negligence, or willful misconduct.
        </p>

        <h2>13. Governing law and disputes</h2>
        <p>
          Illinois law governs these Terms without regard to conflict-of-law rules. Before filing a claim, either party
          must send written notice to legal@beatxray.com and allow 30 days for informal resolution. Unresolved claims
          must be brought in an appropriate state or federal court serving Madison County, Illinois. Either party may
          bring an eligible claim in small-claims court.
        </p>

        <h2>14. Changes and general terms</h2>
        <p>
          BeatXray may update these Terms to reflect service, legal, or security changes. Material changes will be
          identified by a revised effective date and, when appropriate, additional notice. Continued use after an
          update takes effect constitutes acceptance of the revised Terms. If any provision is unenforceable, the
          remaining provisions remain effective. Failure to enforce a provision is not a waiver. You may not transfer
          these Terms without written permission; BeatXray may transfer them as part of a lawful reorganization or
          business transfer.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions, legal notices, and dispute notices may be sent to{" "}
          <a href="mailto:legal@beatxray.com">legal@beatxray.com</a>.
        </p>
      </article>
    </main>
  );
}
