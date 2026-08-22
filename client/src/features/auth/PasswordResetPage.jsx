import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../../app/api.js";

export function PasswordResetPage() {
  const [params]=useSearchParams(); const token=params.get("token"); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [forgot,forgotState]=useForgotPasswordMutation(); const [reset,resetState]=useResetPasswordMutation(); const state=token?resetState:forgotState;
  const submit=async(e)=>{e.preventDefault();try{if(token)await reset({token,password}).unwrap();else await forgot({email}).unwrap();}catch{/* shown */}};
  return <main className="reset-page"><section><Link className="brand" to="/"><span>p</span> plateful</Link><span className="kicker">Account recovery</span><h1>{token?"Choose a new password":"Forgot your password?"}</h1><p>{token?"Use at least eight characters with uppercase, lowercase, and a number.":"Enter your email and we’ll send a secure reset link if the account exists."}</p><form onSubmit={submit}>{token?<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" required minLength="8"/>:<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>}{state.error&&<div className="owner-error">{state.error.data?.message}</div>}{state.isSuccess&&<div className="reset-success">{token?"Password updated. You can now log in.":"Check your inbox for the next step."}</div>}<button disabled={state.isLoading}>{state.isLoading?"Please wait…":token?"Update password":"Send reset link"}</button></form><Link className="back-login" to="/login">← Back to login</Link></section></main>;
}
