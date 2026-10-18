import { motion } from "framer-motion";
import { Heart, ShieldCheck } from "lucide-react";
import HeroIllustration from "../components/HeroIllustration";
import SignInForm from "../components/SignInForm";

interface AuthPageProps {
  onSignIn: () => void;
}

export default function AuthPage({ onSignIn }: AuthPageProps) {
  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="auth-page"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <section aria-label="About Kavach" className="hero-panel">
        <div className="hero-orb hero-orb-blue" />
        <div className="hero-orb hero-orb-copper" />
        <a aria-label="Kavach home" className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><Heart aria-hidden="true" fill="currentColor" size={18} /></span>
          <span>Kavach</span>
        </a>
        <div className="hero-copy">
          <span className="hero-kicker"><ShieldCheck aria-hidden="true" size={15} /> A little more continuity, a lot more care</span>
          <h1>No child&apos;s vaccine history gets lost in a <em>move.</em></h1>
          <p>A portable health record that helps every health worker care with confidence, wherever a family calls home.</p>
        </div>
        <HeroIllustration />
        <div className="hero-caption">
          <span className="caption-dot" />
          <span>Every dose goes with them.</span>
          <span className="caption-rule" />
        </div>
        <div className="hero-footer">
          <span>Made for the journeys families make.</span>
          <span className="footer-decoration" aria-hidden="true">✳</span>
        </div>
      </section>

      <section aria-label="Health worker sign in" className="auth-panel">
        <div className="mobile-brand">
          <span className="brand-mark"><Heart aria-hidden="true" fill="currentColor" size={17} /></span>
          <span>Kavach</span>
        </div>
        <div className="auth-card">
          <div className="auth-content">
            <SignInForm onSignIn={onSignIn} />
          </div>
        </div>
        <p className="auth-footer">A kinder way to keep the record moving <span aria-hidden="true">·</span> Kavach demo</p>
      </section>
    </motion.main>
  );
}
