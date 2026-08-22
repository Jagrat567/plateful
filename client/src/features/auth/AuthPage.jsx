import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation, useRegisterMutation } from "../../app/api.js";
import { sessionReceived } from "./authSlice.js";

function fieldError(error) {
  return error?.data?.message ?? "Something went wrong. Please try again.";
}

// eslint-disable-next-line react/prop-types
export function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = typeof location.state?.from === "string" ? location.state.from : "/";
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const requestState = isLogin ? loginState : registerState;
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  if (user) return <Navigate to={destination} replace />;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = isLogin ? { email: form.email, password: form.password } : form;
      const response = await (isLogin ? login(body) : register(body)).unwrap();
      dispatch(sessionReceived(response.data));
      navigate(destination, { replace: true });
    } catch { /* RTK Query exposes the response below. */ }
  };

  return <main className="auth-page">
    <section className="auth-art"><Link className="brand auth-brand" to="/"><span>p</span> plateful</Link><div><span className="kicker light">Your table is waiting</span><h1>{isLogin ? "Welcome back, foodie." : "Great meals start here."}</h1><p>Save your favourites, reorder in seconds, and track every delicious delivery.</p></div><div className="auth-food" aria-hidden="true">🍲</div></section>
    <section className="auth-panel"><div className="auth-form-wrap"><Link className="mobile-auth-brand brand" to="/"><span>p</span> plateful</Link><span className="kicker">{isLogin ? "Good to see you again" : "Join the neighbourhood"}</span><h2>{isLogin ? "Log in to Plateful" : "Create your account"}</h2><p>{isLogin ? "Enter your details to continue." : "Your next favourite meal is one account away."}</p>
      <form className="auth-form" onSubmit={submit}>
        {!isLogin && <><label htmlFor="name">Full name</label><input id="name" name="name" value={form.name} onChange={update} placeholder="Aarav Sharma" autoComplete="name" required minLength="2"/><label htmlFor="phone">Phone number</label><input id="phone" name="phone" value={form.phone} onChange={update} placeholder="9876543210" autoComplete="tel" required/></>}
        <label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required/>
        <label htmlFor="password">Password</label><input id="password" name="password" type="password" value={form.password} onChange={update} placeholder={isLogin ? "Enter your password" : "8+ chars, uppercase and a number"} autoComplete={isLogin ? "current-password" : "new-password"} required minLength="8"/>{isLogin && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
        {requestState.error && <div className="auth-error" role="alert">{fieldError(requestState.error)}</div>}
        <button className="auth-submit" disabled={requestState.isLoading}>{requestState.isLoading ? "Please wait…" : (isLogin ? "Log in" : "Create account")}</button>
      </form>
      <p className="auth-switch">{isLogin ? "New to Plateful?" : "Already have an account?"} <Link to={isLogin ? "/signup" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link></p>
      {!isLogin && <small className="auth-terms">By creating an account, you agree to our Terms and Privacy Policy.</small>}
    </div></section>
  </main>;
}
