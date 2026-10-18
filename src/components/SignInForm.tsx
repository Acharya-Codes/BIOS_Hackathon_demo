import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";

export default function SignInForm({ onSignIn, onRegisterChild }: { onSignIn: () => void; onRegisterChild: () => void }) {
  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [rememberError, setRememberError] = useState("");

  useEffect(() => {
    try {
      const rememberedWorkerId = localStorage.getItem("kavach.workerId");
      if (rememberedWorkerId) setWorkerId(rememberedWorkerId);
    } catch {
      setRememberError("This browser could not read a remembered worker ID.");
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRememberError("");
    try {
      if (remember) {
        localStorage.setItem("kavach.workerId", workerId);
      } else {
        localStorage.removeItem("kavach.workerId");
      }
    } catch {
      setRememberError("Signed in for this demo, but this browser could not save your worker ID.");
    }
    setSignedIn(true);
    onSignIn();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-intro">
        <div className="form-intro-heading">
          <span className="eyebrow">WELCOME BACK</span>
          <button className="register-child-link" onClick={onRegisterChild} type="button">Register a child</button>
        </div>
        <h2>Your work, carried forward.</h2>
        <p>Sign in to continue caring for children in your community.</p>
      </div>
      <label className="field-label" htmlFor="worker-id">Health worker ID</label>
      <div className="input-wrap">
        <UserRound aria-hidden="true" size={18} />
        <input
          autoComplete="username"
          id="worker-id"
          onChange={(event) => setWorkerId(event.target.value)}
          placeholder="e.g. ANM-1042"
          required
          value={workerId}
        />
      </div>
      <label className="field-label" htmlFor="worker-pin">PIN</label>
      <div className="input-wrap">
        <LockKeyhole aria-hidden="true" size={18} />
        <input
          autoComplete="current-password"
          id="worker-pin"
          onChange={(event) => setPin(event.target.value)}
          placeholder="Enter your PIN"
          required
          type="password"
          value={pin}
        />
      </div>
      <label className="check-label remember-label">
        <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
        <span>Remember me on this device</span>
      </label>
      <button className="primary-button sign-in-button" type="submit">
        Sign in <ArrowRight aria-hidden="true" size={17} />
      </button>
      {rememberError && <p aria-live="assertive" className="error-notice">{rememberError}</p>}
      {signedIn && !rememberError && (
        <p aria-live="polite" className="inline-notice">Welcome, {workerId}. Your dashboard is the next part of this demo.</p>
      )}
      <p className="form-footnote">Demo mode: any worker ID and PIN will work.</p>
    </form>
  );
}
