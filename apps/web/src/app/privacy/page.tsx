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
        <div className="tag">Product notice</div>
        <h1>BeatXray Privacy Notice</h1>
        <p className="notice">Effective date: August 15, 2026. This notice requires review and approval by the ZeroHype Organization’s legal representative before public launch.</p>
        <h2>Information processed</h2>
        <p>
          BeatXray processes account information required for authentication, audio and filename information that you choose to upload, analysis-job records, generated results, and subscription identifiers supplied by the payment provider. Payment-card data is handled by the hosted payment provider and is not stored by BeatXray.
        </p>
        <h2>How uploaded audio is handled</h2>
        <p>
          Uploads and generated results are stored in private, user-scoped storage. Processing workers access the audio only to perform the requested analysis and create the requested output package. The product is designed so that browser users can access only their own jobs and storage objects.
        </p>
        <h2>Service providers</h2>
        <p>
          The product uses service providers for authentication, database and private object storage, web hosting, payment processing, and audio processing infrastructure. Their processing is limited to operating the service and is governed by the applicable agreements and configuration chosen by the service operator.
        </p>
        <h2>Your controls</h2>
        <p>
          You can manage your subscription through the hosted billing portal when it is enabled. BeatXray is being designed to allow users to delete their analysis data. Until the deletion workflow is enabled and documented, do not treat this notice as a final production retention commitment.
        </p>
        <h2>Required pre-launch additions</h2>
        <p>
          The service operator must add a legal contact, applicable privacy jurisdiction disclosures, final retention and deletion timelines, international-transfer disclosures where applicable, and a counsel-approved statement of user rights before public launch.
        </p>
      </article>
    </main>
  );
}
