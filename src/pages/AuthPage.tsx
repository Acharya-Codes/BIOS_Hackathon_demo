import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, ShieldCheck, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import HeroIllustration from "../components/HeroIllustration";
import RegisterForm from "../components/RegisterForm";
import SignInForm from "../components/SignInForm";
import type { ChildRecord } from "../types";
import { formatAge } from "../utils/dates";

interface AuthPageProps {
  initialTab?: AuthTab;
  onSignIn: () => void;
  onRegistered: (child: ChildRecord) => void;
  onContinue: () => void;
}

type AuthTab = "signin" | "register";

export default function AuthPage({ initialTab = "signin", onSignIn, onRegistered, onContinue }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [registeredChild, setRegisteredChild] = useState<ChildRecord | null>(null);

  function handleRegistered(child: ChildRecord) {
    setRegisteredChild(child);
    onRegistered(child);
  }

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

      <section aria-label="Sign in or register" className="auth-panel">
        <div className="mobile-brand">
          <span className="brand-mark"><Heart aria-hidden="true" fill="currentColor" size={17} /></span>
          <span>Kavach</span>
        </div>
        <div className="auth-card">
          <div aria-label="Account actions" className="tab-list" role="tablist">
            <button
              aria-selected={activeTab === "signin"}
              className={`tab-button${activeTab === "signin" ? " active" : ""}`}
              id="tab-signin"
              onClick={() => { setRegisteredChild(null); setActiveTab("signin"); }}
              role="tab"
              type="button"
            >
              Health worker sign in
            </button>
            <button
              aria-selected={activeTab === "register"}
              className={`tab-button${activeTab === "register" ? " active" : ""}`}
              id="tab-register"
              onClick={() => { setRegisteredChild(null); setActiveTab("register"); }}
              role="tab"
              type="button"
            >
              Register a child
            </button>
          </div>
          <div aria-labelledby={activeTab === "signin" ? "tab-signin" : "tab-register"} className="tab-panel" role="tabpanel">
            {registeredChild ? (
              <SuccessCard child={registeredChild} onClose={() => setRegisteredChild(null)} onContinue={onContinue} />
            ) : activeTab === "signin" ? (
              <SignInForm onSignIn={onSignIn} />
            ) : (
              <RegisterForm onRegistered={handleRegistered} />
            )}
          </div>
        </div>
        <p className="auth-footer">A kinder way to keep the record moving <span aria-hidden="true">·</span> Kavach demo</p>
      </section>
    </motion.main>
  );
}

function SuccessCard({ child, onClose, onContinue }: { child: ChildRecord; onClose: () => void; onContinue: () => void }) {
  return (
    <motion.section
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-live="polite"
      className="success-card"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <button aria-label="Back to sign in" className="success-back" onClick={onClose} type="button">
        <ArrowLeft aria-hidden="true" size={17} /> Back
      </button>
      <div className="success-symbol"><ShieldCheck aria-hidden="true" size={28} /></div>
      <span className="eyebrow">RECORD SAVED ON THIS DEVICE</span>
      <h2>{child.name}&apos;s record is ready.</h2>
      <p className="success-subtitle">{formatAge(child.dateOfBirth)} · A little record that can travel a long way.</p>
      <div className="qr-card">
        <QRCodeSVG
          aria-label={`QR code for child record ${child.id}`}
          bgColor="#FFFFFF"
          fgColor="#1E2761"
          level="M"
          size={148}
          value={`kavach://child/${child.id}`}
        />
        <div className="child-id">
          <span>CHILD ID</span>
          <strong>{child.id}</strong>
        </div>
      </div>
      <div className="success-details">
        <span>{child.guardianName}</span>
        <span>{child.currentVillage}, {child.currentDistrict}</span>
      </div>
      <div className="success-next">
        <span className="success-check"><ShieldCheck size={16} aria-hidden="true" /></span>
        <p>Your record is saved securely on this device and ready to follow the family.</p>
      </div>
      <button className="primary-button success-continue-button" onClick={onContinue} type="button">Open Kavach workspace <ShieldCheck size={16} /></button>
      <button className="quiet-button" onClick={onClose} type="button"><X aria-hidden="true" size={15} /> Close this record</button>
    </motion.section>
  );
}
