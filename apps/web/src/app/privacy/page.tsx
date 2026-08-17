import Link from "next/link";

import { Brand } from "@/components/brand";

export const metadata = { title: "Privacy Notice | BeatXray" };

export default function PrivacyPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Brand />
        <Link className="btn" href="/">
          Home
        </Link>
      </nav>
      <article className="card" style={{ maxWidth: 900, margin: "48px auto" }}>
        <div className="tag">Privacy</div>
        <h1>BeatXray Privacy Notice</h1>
        <p className="notice">Effective date: August 17, 2026</p>

        <h2>1. Who operates BeatXray</h2>
        <p>
          BeatXray is operated by Paul Bollinger, an Illinois sole proprietor located in Madison County, Illinois.
          This Notice explains how BeatXray collects, uses, discloses, retains, and protects personal information when
          you use the website, account dashboard, subscriptions, and audio-analysis service.
        </p>

        <h2>2. Information collected</h2>
        <p>Depending on how you use BeatXray, the service may process:</p>
        <ul>
          <li>Account information, including your email address, user identifier, and authentication records.</li>
          <li>
            Content you provide, including uploaded audio, filenames, selected DAW, analysis settings, support
            communications, and generated results.
          </li>
          <li>
            Service records, including job status, timestamps, file size and type, usage totals, error information,
            audit events, and security or request logs.
          </li>
          <li>
            Billing records supplied by Stripe, including customer and subscription identifiers, plan, status, and
            renewal information. BeatXray does not store complete payment-card numbers.
          </li>
          <li>
            Basic technical information sent by your browser or hosting infrastructure, such as IP address, device or
            browser information, requested pages, and security signals.
          </li>
        </ul>

        <h2>3. How information is used</h2>
        <p>
          BeatXray uses information to authenticate users; accept and process authorized uploads; create and deliver
          analysis results; enforce plan limits; process subscriptions; provide support; prevent fraud, abuse, and
          security incidents; troubleshoot and improve reliability; comply with law; and enforce the Terms of Use.
        </p>

        <h2>4. Uploaded audio and AI training</h2>
        <p>
          Uploaded audio and generated results are stored in private, user-scoped storage and accessed as needed to
          perform the analysis you request, provide downloads, secure the service, and resolve support issues. BeatXray
          does not use uploaded audio, stems, or analysis results to train AI models unless you later provide separate,
          explicit opt-in consent.
        </p>

        <h2>5. Service providers</h2>
        <p>
          BeatXray uses service providers to operate the service, including Supabase for authentication, database, and
          private object storage; Vercel for website and serverless hosting; Stripe for checkout, subscriptions, and
          billing; Cloudflare for DNS, security, and email routing; and enabled audio-processing infrastructure for
          requested analysis. These providers may process information only as needed to provide their services and
          under their applicable agreements and privacy terms.
        </p>

        <h2>6. When information is disclosed</h2>
        <p>
          BeatXray does not sell personal information and does not use it for targeted advertising. Information may be
          disclosed to operating providers; when required by law or valid legal process; to investigate fraud, abuse,
          infringement, or security threats; to protect users, BeatXray, or others; with your direction or consent; or
          as part of a merger, financing, acquisition, reorganization, or transfer of the service, subject to appropriate
          protections and notice where required.
        </p>

        <h2>7. Cookies and similar technologies</h2>
        <p>
          BeatXray uses necessary cookies and similar storage for authentication, sessions, security, and essential
          service operation. BeatXray does not use advertising cookies at launch. Third-party checkout pages may use
          technologies governed by the provider&apos;s own notice.
        </p>

        <h2>8. Retention and deletion</h2>
        <p>
          You may delete eligible terminal analysis jobs through the dashboard. Source audio and generated artifacts
          are scheduled for automatic deletion 30 days after a job becomes complete, failed, or cancelled; scheduled
          deletion is generally completed during the following daily cleanup cycle. Account information is retained
          while the account remains active and is deleted or deidentified after a verified deletion request, subject to
          necessary exceptions. Transaction, subscription, fraud-prevention, security, audit, dispute, and legal records
          may be retained longer when reasonably necessary. Residual copies may remain briefly in protected backups
          until ordinary backup rotation completes.
        </p>

        <h2>9. Your choices and privacy requests</h2>
        <p>
          You may request access to, correction of, deletion of, or a portable copy of your account information by
          emailing legal@beatxray.com. BeatXray may verify your identity before acting. Requests will be acknowledged and
          handled within 30 days when reasonably possible. Information may be retained where required for billing,
          fraud prevention, security, dispute resolution, or legal compliance. You may appeal a denied request by
          replying to the decision. Depending on where you live, applicable law may provide additional rights.
        </p>

        <h2>10. Security</h2>
        <p>
          BeatXray uses administrative, technical, and organizational safeguards designed to protect information,
          including private storage, access controls, encrypted network connections, user-scoped authorization, and
          restricted server credentials. No system is completely secure, and BeatXray cannot guarantee absolute
          security. Please report suspected account or data-security issues to legal@beatxray.com.
        </p>

        <h2>11. International processing</h2>
        <p>
          BeatXray and its providers may process information in the United States and other locations where they
          operate. Privacy laws in those locations may differ from those where you live. BeatXray uses provider
          agreements and other appropriate safeguards where required.
        </p>

        <h2>12. Adults only</h2>
        <p>
          BeatXray is intended only for people who are at least 18 years old. The service is not directed to children,
          and BeatXray does not knowingly collect personal information from anyone under 18. If you believe a minor has
          provided information, contact legal@beatxray.com.
        </p>

        <h2>13. Changes to this Notice</h2>
        <p>
          BeatXray may update this Notice to reflect service, legal, or security changes. The effective date will be
          revised, and additional notice will be provided when required or when a change materially affects how personal
          information is handled.
        </p>

        <h2>14. Contact</h2>
        <p>
          Privacy questions and requests may be sent to{" "}
          <a href="mailto:legal@beatxray.com">legal@beatxray.com</a>.
        </p>
      </article>
    </main>
  );
}
