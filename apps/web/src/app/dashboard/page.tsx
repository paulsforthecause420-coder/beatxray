import { redirect } from "next/navigation";

import { entitlementForUser } from "@/lib/billing/service";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import BillingControls from "./billing-controls";
import JobActions from "./job-actions";
import UploadForm from "./upload-form";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: jobs }, billing] = await Promise.all([
    supabase
      .from("analysis_jobs")
      .select("id,original_filename,daw,status,progress,created_at,result_path,error_message")
      .order("created_at", { ascending: false })
      .limit(20),
    entitlementForUser(user.id).catch(() => null),
  ]);
  const billingConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_STARTER && process.env.STRIPE_PRICE_PRO);

  return (
    <main className="shell">
      <nav className="nav">
        <Brand />
        <form action="/api/signout" method="post">
          <button className="btn">Sign out</button>
        </form>
      </nav>
      <section className="dashboard">
        <div className="dashboard-head">
          <div>
            <div className="tag">Production laboratory</div>
            <h1>Your X-Ray Sessions</h1>
          </div>
          <div className="status">{user.email}</div>
        </div>
        <BillingControls
          configured={billingConfigured}
          plan={billing?.plan ?? "free"}
          status={billing?.status ?? "inactive"}
          used={billing?.used ?? 0}
          limit={billing?.limit ?? 0}
        />
        <UploadForm />
        <div className="job-list">
          {(jobs || []).map((job) => (
            <article className="card job" key={job.id}>
              <div>
                <strong>{job.original_filename}</strong>
                <div className="notice">
                  {job.daw === "ableton" ? "Ableton Live" : "FL Studio"} · {new Date(job.created_at).toLocaleString()}
                </div>
                <div className="progress">
                  <span style={{ width: `${job.progress}%` }} />
                </div>
                {job.error_message && <div className="error">{job.error_message}</div>}
              </div>
              <div>
                <span className="status">{job.status}</span>
                <JobActions jobId={job.id} status={job.status} hasResult={Boolean(job.result_path)} />
              </div>
            </article>
          ))}
          {!jobs?.length && (
            <div className="card">
              <p className="notice">No sessions yet. Upload your first authorized track above.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
