import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Check, ChevronRight, HeartHandshake, MapPin, MessageCircle, MoveRight, Phone, QrCode, ShieldAlert, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ChildRecord } from "../types";
import { DEVELOPMENT_MILESTONES } from "../data/milestones";
import { assessMissRisk } from "../utils/risk";
import { ageInMonths, formatAge } from "../utils/dates";
import { doseStatusLabel, formatDoseDate, getChildDoses, getNextDose } from "../utils/childStatus";
import ProgressRing from "./ProgressRing";

interface ChildDetailPageProps {
  child: ChildRecord;
  onBack: () => void;
  onChildChange: (child: ChildRecord) => void;
  onSendReminder: (child: ChildRecord, vaccineName: string) => void;
  reminderSent: boolean;
}

export default function ChildDetailPage({ child, onBack, onChildChange, onSendReminder, reminderSent }: ChildDetailPageProps) {
  const [showQr, setShowQr] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");
  const ageMonths = ageInMonths(child.dateOfBirth);
  const doses = useMemo(() => getChildDoses(child), [child]);
  const risk = assessMissRisk(child);
  const dueDose = getNextDose(child);
  const milestones = DEVELOPMENT_MILESTONES.filter((item) => {
    const targetAge = Number(item.ageGroup.match(/\d+/)?.[0] ?? 0);
    return targetAge <= Math.max(4, Math.ceil(ageMonths / 3) * 3);
  });
  const completedMilestones = milestones.filter((item) => child.milestonesMet.includes(item.id)).length;
  const progress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const grouped = new Map<string, typeof milestones>();
  for (const milestone of milestones) grouped.set(milestone.ageGroup, [...(grouped.get(milestone.ageGroup) ?? []), milestone]);

  function markGiven(vaccineId: string) {
    const today = new Date().toISOString().slice(0, 10);
    onChildChange({
      ...child,
      vaccinesGiven: [...new Set([...child.vaccinesGiven, vaccineId])],
      vaccineDates: { ...child.vaccineDates, [vaccineId]: today },
    });
  }

  function toggleMilestone(milestoneId: string) {
    const next = child.milestonesMet.includes(milestoneId)
      ? child.milestonesMet.filter((id) => id !== milestoneId)
      : [...child.milestonesMet, milestoneId];
    onChildChange({ ...child, milestonesMet: next });
  }

  function simulateMigration() {
    const destination = child.currentVillage === "Madanapalle" ? "Bommireddipalle" : "Madanapalle";
    onChildChange({
      ...child,
      previousVillage: child.currentVillage,
      previousDistrict: child.currentDistrict,
      currentVillage: destination,
      currentDistrict: destination === "Madanapalle" ? "Annamayya" : "Chittoor",
      migrated: true,
      missedVisits: child.missedVisits + 1,
    });
    setMigrationMessage(`Record moved to ${destination}. Risk score recalculated.`);
    window.setTimeout(() => setMigrationMessage(""), 3600);
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="detail-page" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.3 }}>
      <button className="back-link" onClick={onBack} type="button"><ArrowLeft size={17} /> Back to dashboard</button>
      <section className="detail-hero card-surface">
        <div className="detail-avatar">{child.name.slice(0, 1).toUpperCase()}</div>
        <div className="detail-identity">
          <div className="detail-name-line"><h1>{child.name}</h1>{child.migrated && <span className="status-badge migrated-badge"><MoveRight size={13} /> Migrated</span>}</div>
          <p>{formatAge(child.dateOfBirth)} <span>·</span> Child ID <strong>{child.id}</strong></p>
          <div className="detail-guardian">
            <span><HeartHandshake size={15} /> {child.guardianName}</span>
            <a href={`tel:${child.guardianPhone}`}><Phone size={14} /> {child.guardianPhone}</a>
          </div>
          <div className="detail-location"><MapPin size={15} /><span>{child.currentVillage}, {child.currentDistrict}</span>{child.previousVillage !== child.currentVillage && <><MoveRight size={14} /><span className="previous-place">From {child.previousVillage}, {child.previousDistrict}</span></>}</div>
        </div>
        <div className="detail-actions">
          <button className="outline-button" onClick={() => setShowQr(true)} type="button"><QrCode size={16} /> Show QR</button>
          <button className="primary-button detail-reminder-button" onClick={() => onSendReminder(child, dueDose?.dose.name ?? "next vaccine")} type="button"><MessageCircle size={16} /> Send reminder</button>
        </div>
      </section>

      <div className="detail-columns">
        <div className="detail-main-column">
          <section className="panel-card timeline-panel">
            <div className="section-heading">
              <div><span className="eyebrow">IMMUNISATION RECORD</span><h2>Vaccination timeline</h2></div>
              <span className="section-count">{child.vaccinesGiven.length} of {doses.length} recorded</span>
            </div>
            <div className="timeline-list">
              {doses.map(({ dose, dueDate, status }, index) => {
                const givenDate = child.vaccineDates?.[dose.id];
                return (
                  <article className={`timeline-item dose-${status}`} key={dose.id}>
                    <div className="timeline-rail"><span className="timeline-marker">{status === "given" ? <Check size={13} strokeWidth={3} /> : <span />}</span>{index < doses.length - 1 && <span className="timeline-line" />}</div>
                    <div className="timeline-content">
                      <div className="timeline-dose-main">
                        <div><h3>{dose.name}</h3><p>{dose.ageLabel} <span>·</span> {status === "given" ? `Given ${givenDate ? formatDoseDate(new Date(`${givenDate}T00:00:00`)) : "date not recorded"}` : `Due ${formatDoseDate(dueDate)}`}</p></div>
                        <span className={`status-badge dose-badge ${status}`}><span />{doseStatusLabel(status)}</span>
                      </div>
                      {status === "overdue" || status === "due-soon" ? (
                        <button className="mark-given-button" onClick={() => markGiven(dose.id)} type="button"><Check size={14} /> Mark as given</button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel-card milestones-panel">
            <div className="section-heading">
              <div><span className="eyebrow">GROWING TOGETHER</span><h2>Development milestones</h2></div>
              <ProgressRing value={progress} label="milestones observed" size={62} />
            </div>
            <p className="milestone-note">A gentle check-in, not a test. Every child grows at their own pace.</p>
            {[...grouped.entries()].map(([ageGroup, entries]) => (
              <div className="milestone-group" key={ageGroup}>
                <h3>{ageGroup}</h3>
                <div className="milestone-list">
                  {entries.map((item) => (
                    <label className="milestone-check" key={item.id}>
                      <input checked={child.milestonesMet.includes(item.id)} onChange={() => toggleMilestone(item.id)} type="checkbox" />
                      <span className="milestone-box"><Check size={12} /></span>
                      <span className="milestone-text"><strong>{item.title}</strong><small>{item.area}</small></span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="detail-aside">
          <motion.section animate={{ scale: [1, 1.015, 1] }} className="risk-card" key={risk.score} transition={{ duration: .35 }}>
            <div className="risk-card-header"><span className="risk-icon"><ShieldAlert size={19} /></span><span className="risk-label">MISS-RISK SCORE</span><span className={`risk-level ${risk.score >= 60 ? "high" : risk.score >= 30 ? "medium" : "low"}`}>{risk.score >= 60 ? "High" : risk.score >= 30 ? "Watch" : "Low"}</span></div>
            <div className="risk-score-row"><strong>{risk.score}</strong><span>/ 100</span></div>
            <div aria-label={`Risk score ${risk.score} out of 100`} className="risk-meter"><span style={{ width: `${risk.score}%` }} /></div>
            <h3>Why this score?</h3>
            <ul>{risk.reasons.map((reason) => <li key={reason}><span />{reason}</li>)}</ul>
            <p className="risk-explanation">This rule-based score combines overdue days, recent migration, and missed visits to help prioritise follow-up.</p>
          </motion.section>

          <section className="next-dose-card">
            <div className="next-dose-top"><span className="next-dose-icon"><CalendarDays size={17} /></span><span>NEXT DOSE</span></div>
            <h3>{dueDose?.dose.name ?? "Schedule complete"}</h3>
            {dueDose && <p>{dueDose.status === "overdue" ? `Was due ${formatDoseDate(dueDose.dueDate)}` : dueDose.status === "due-soon" ? `Due ${formatDoseDate(dueDose.dueDate)}` : `Coming up ${formatDoseDate(dueDose.dueDate)}`}</p>}
            <button onClick={() => dueDose && onSendReminder(child, dueDose.dose.name)} type="button">Send family a reminder <ChevronRight size={15} /></button>
            {reminderSent && <span className="sent-inline"><Check size={13} /> Reminder sent</span>}
          </section>

          <section className="migration-card">
            <div className="migration-header"><span><MapPin size={16} /></span><strong>Family on the move?</strong></div>
            <p>See how Kavach keeps this record connected when a family relocates.</p>
            <button onClick={simulateMigration} type="button"><Sparkles size={15} /> Simulate migration</button>
            <AnimatePresence>{migrationMessage && <motion.p animate={{ opacity: 1, height: "auto" }} className="migration-message" exit={{ opacity: 0 }} initial={{ opacity: 0, height: 0 }}><Check size={13} />{migrationMessage}</motion.p>}</AnimatePresence>
          </section>
        </aside>
      </div>

      {showQr && <QrModal child={child} onClose={() => setShowQr(false)} />}
    </motion.div>
  );
}

function QrModal({ child, onClose }: { child: ChildRecord; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section animate={{ opacity: 1, scale: 1 }} aria-labelledby="qr-title" aria-modal="true" className="qr-modal" initial={{ opacity: 0, scale: .95 }} role="dialog">
        <button aria-label="Close QR code" className="modal-close" onClick={onClose} type="button">×</button>
        <div className="qr-modal-icon"><QrCode size={20} /></div>
        <h2 id="qr-title">{child.name}&apos;s portable record</h2>
        <p>Scan to identify this child&apos;s record on this device.</p>
        <QRCodeSVG bgColor="#FFFFFF" fgColor="#1E2761" level="M" size={180} value={`kavach://child/${child.id}`} />
        <strong>{child.id}</strong>
      </motion.section>
    </div>
  );
}
