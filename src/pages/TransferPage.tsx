import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, ArrowRight, Check, FileText, LoaderCircle, MapPinned, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { ChildRecord } from "../types";
import { createTransferDemoRecord, TRANSFER_DEMO_ID } from "../data/transferRecord";

interface TransferPageProps {
  children: ChildRecord[];
  onOpenChild: (child: ChildRecord) => void;
  onPullRecord: (child: ChildRecord) => boolean;
}

export default function TransferPage({ children, onOpenChild, onPullRecord }: TransferPageProps) {
  const [childId, setChildId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChildRecord | null>(null);
  const [error, setError] = useState("");
  const [pulled, setPulled] = useState(false);

  function searchRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setPulled(false);
    window.setTimeout(() => {
      const query = childId.trim().toLowerCase();
      const record = children.find((child) =>
        child.id.toLowerCase() === query || (query === "kv-demo-meena" && child.name.toLowerCase() === "meena")) ??
        (query === TRANSFER_DEMO_ID.toLowerCase() ? createTransferDemoRecord() : undefined);
      setLoading(false);
      if (record) setResult(record);
      else setError("No matching record was found on this device. Check the child ID with the referring health worker.");
    }, 950);
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="transfer-page" initial={{ opacity: 0, y: 12 }} transition={{ duration: .3 }}>
      <div className="page-title-row">
        <div><span className="eyebrow">A RECORD THAT TRAVELS</span><h1>Transfer record</h1><p>Welcome a family into your care circle without starting over.</p></div>
      </div>
      <div className="transfer-layout">
        <section className="panel-card transfer-card">
          <span className="transfer-icon"><MapPinned size={20} /></span>
          <span className="eyebrow">PICK UP WHERE THEY LEFT OFF</span>
          <h2>Find a child&apos;s record.</h2>
          <p className="transfer-description">Enter the portable child ID shared by the family or their previous health worker.</p>
          <form className="transfer-form" onSubmit={searchRecord}>
            <label className="field-label" htmlFor="transfer-id">Child ID</label>
            <div className="transfer-input"><Search size={17} /><input autoComplete="off" id="transfer-id" onChange={(event) => setChildId(event.target.value)} placeholder="e.g. KV-DEMO-MEENA" required value={childId} /><button aria-label="Search child ID" type="submit"><ArrowRight size={17} /></button></div>
            <span className="transfer-hint">Try a transfer demo: <button onClick={() => setChildId(TRANSFER_DEMO_ID)} type="button">{TRANSFER_DEMO_ID}</button></span>
          </form>
          <div className="transfer-steps">
            <div><span className="step-index">01</span><p><strong>Enter ID</strong><small>Use the family&apos;s Kavach ID</small></p></div>
            <div><span className="step-index">02</span><p><strong>Review record</strong><small>Confirm child and vaccine history</small></p></div>
            <div><span className="step-index">03</span><p><strong>Continue care</strong><small>Record is ready in your care circle</small></p></div>
          </div>
          <p className="transfer-prototype-note"><Sparkles size={14} /> Demo prototype: transfer looks up locally stored synthetic records.</p>
        </section>

        <div className="transfer-result-area">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.section animate={{ opacity: 1 }} className="transfer-loading panel-card" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="loading">
                <LoaderCircle className="loading-spinner" size={36} /><h3>Looking for the record…</h3><p>Reconnecting the dots between care visits.</p>
                <div className="loading-dots"><span /><span /><span /></div>
              </motion.section>
            ) : result ? (
              <motion.section animate={{ opacity: 1, y: 0 }} className="transfer-found panel-card" initial={{ opacity: 0, y: 10 }} key="found">
                <span className="found-icon"><ShieldCheck size={21} /></span><span className="eyebrow">RECORD FOUND</span><h2>{result.name}&apos;s record</h2>
                <p>{result.guardianName} · {result.currentVillage}, {result.currentDistrict}</p>
                <div className="record-summary">
                  <span><FileText size={15} /><strong>{result.vaccinesGiven.length}</strong> doses recorded</span>
                  <span><MapPinned size={15} />{result.migrated ? "Moved from another village" : "Local care record"}</span>
                </div>
                {pulled ? <p className="pull-success"><Check size={15} /> Added to your care circle. Record is ready to view.</p> : <button className="primary-button pull-record-button" onClick={() => { if (onPullRecord(result)) setPulled(true); else setError("This record could not be saved to this device."); }} type="button"><ArrowDownToLine size={16} /> Pull full record</button>}
                {pulled && <button className="outline-button open-pulled-record" onClick={() => onOpenChild(result)} type="button">Open child record <ArrowRight size={15} /></button>}
              </motion.section>
            ) : error ? (
              <motion.section animate={{ opacity: 1, y: 0 }} className="transfer-error panel-card" initial={{ opacity: 0, y: 8 }} key="error">
                <span className="error-mark">!</span><h3>We couldn&apos;t find that ID</h3><p>{error}</p>
              </motion.section>
            ) : (
              <motion.section animate={{ opacity: 1 }} className="transfer-placeholder panel-card" initial={{ opacity: 0 }} key="placeholder">
                <div className="placeholder-path"><span><MapPinned size={20} /></span><i /><span><ShieldCheck size={20} /></span></div>
                <h3>Good care has no village boundary.</h3><p>A complete record gives you the context to keep a child&apos;s care on track.</p>
                <div className="placeholder-quote">“Her card travelled with the family. Now her care can, too.”</div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
