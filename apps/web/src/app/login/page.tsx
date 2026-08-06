"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [mode,setMode]=useState<"login"|"signup">("login"); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
  async function submit(e:FormEvent){ e.preventDefault(); setBusy(true); setError(""); const supabase=createClient();
    const result=mode==="login" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/auth/callback`}});
    setBusy(false); if(result.error){setError(result.error.message);return;} if(mode==="signup"){setError("Check your email to confirm your account.");return;} router.push("/dashboard"); router.refresh(); }
  return <main className="shell"><nav className="nav"><Brand/></nav><div className="auth-wrap"><section className="card auth-card"><h1>{mode==="login"?"Enter the lab":"Create your account"}</h1><p className="notice">Your workspace for song analysis and production reconstruction.</p><form className="form" onSubmit={submit}><label className="label">Email<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="label">Password<input className="input" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className={error.startsWith("Check")?"notice":"error"}>{error}</div>}<button className="btn primary" disabled={busy}>{busy?"Working…":mode==="login"?"Sign in":"Create account"}</button></form><button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Create an account":"I already have an account"}</button></section></div></main>
}
