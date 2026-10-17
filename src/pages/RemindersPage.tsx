import { motion } from "framer-motion";
import { BellRing, Check, Clock3, MessageCircle, Phone } from "lucide-react";
import type { ReminderRecord } from "../types";

export default function RemindersPage({ reminders }: { reminders: ReminderRecord[] }) {
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="reminders-page" initial={{ opacity: 0, y: 12 }} transition={{ duration: .3 }}>
      <div className="page-title-row">
        <div><span className="eyebrow">FAMILY FOLLOW-UP</span><h1>Reminders</h1><p>A thoughtful nudge can make the next visit easier.</p></div>
        <div className="reminder-stat"><span><BellRing size={17} /></span><strong>{reminders.length}</strong><small>sent from this device</small></div>
      </div>
      <section className="panel-card reminder-history-card">
        <div className="section-heading"><div><span className="eyebrow">MESSAGE HISTORY</span><h2>Sent reminders</h2></div><span className="history-status"><span /> On this device</span></div>
        {reminders.length === 0 ? (
          <div className="reminder-empty">
            <span><MessageCircle size={22} /></span><h3>No reminders yet</h3>
            <p>When you send a family a reminder from a child&apos;s record, it will show up here.</p>
          </div>
        ) : (
          <div className="reminder-list">
            {reminders.map((item, index) => (
              <motion.article animate={{ opacity: 1, y: 0 }} className="reminder-row" initial={{ opacity: 0, y: 8 }} key={item.id} transition={{ delay: index * .04 }}>
                <span className="reminder-message-icon"><MessageCircle size={17} /></span>
                <div className="reminder-copy"><strong>{item.childName}<span> · {item.vaccineName}</span></strong><p>{item.phone}</p></div>
                <div className="reminder-time"><Clock3 size={14} /><span>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.sentAt))}</span></div>
                <span className="reminder-sent"><Check size={13} /> {item.status}</span>
              </motion.article>
            ))}
          </div>
        )}
        <div className="reminder-disclaimer"><Phone size={14} /><span>Demo mode: messages are previewed and logged here; no SMS is sent.</span></div>
      </section>
    </motion.div>
  );
}
