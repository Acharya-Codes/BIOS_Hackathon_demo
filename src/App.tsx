import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle, Send, X } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ChildrenPage from "./pages/ChildrenPage";
import RemindersPage from "./pages/RemindersPage";
import TransferPage from "./pages/TransferPage";
import ChildDetailPage from "./components/ChildDetailPage";
import WorkspaceShell, { type WorkspacePage } from "./components/WorkspaceShell";
import type { ChildRecord, ReminderRecord } from "./types";
import { loadChildRecords, loadReminderRecords } from "./utils/localState";
import { saveChild } from "./utils/childStorage";
import { saveReminder } from "./utils/reminderStorage";
import { getNextDose } from "./utils/childStatus";
import { assessMissRisk } from "./utils/risk";

interface ReminderTarget {
  child: ChildRecord;
  vaccineName: string;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<WorkspacePage>("dashboard");
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [registeredChild, setRegisteredChild] = useState<ChildRecord | null>(null);
  const [startInRegister, setStartInRegister] = useState(false);
  const [search, setSearch] = useState("");
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSentChildId, setReminderSentChildId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");

  function enterWorkspace(child?: ChildRecord) {
    try {
      const records = loadChildRecords();
      if (child) {
        const combined = [child, ...records.filter((item) => item.id !== child.id)];
        saveChild(child);
        setChildren(combined);
        setSelectedChild(child);
      } else {
        setChildren(records);
        setSelectedChild(null);
      }
      setReminders(loadReminderRecords());
      setStorageError("");
      setAuthenticated(true);
      setStartInRegister(false);
      setActivePage("dashboard");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not load local demo records.");
    }
  }

  function updateChild(updated: ChildRecord) {
    try {
      saveChild(updated);
      setChildren((current) => current.map((child) => child.id === updated.id ? updated : child));
      if (selectedChild?.id === updated.id) setSelectedChild(updated);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update the child's record.");
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function startReminder(child: ChildRecord, vaccineName: string) {
    setReminderTarget({ child, vaccineName });
    setSendingReminder(false);
  }

  function sendReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reminderTarget || sendingReminder) return;
    setSendingReminder(true);
    window.setTimeout(() => {
      const record: ReminderRecord = {
        id: `RM-${Date.now().toString(36).toUpperCase()}`,
        childId: reminderTarget.child.id,
        childName: reminderTarget.child.name,
        phone: reminderTarget.child.guardianPhone,
        vaccineName: reminderTarget.vaccineName,
        sentAt: new Date().toISOString(),
        status: "Sent",
      };
      try {
        saveReminder(record);
        setReminders((current) => [record, ...current]);
        setReminderSentChildId(record.childId);
        setReminderTarget(null);
        showToast(`Reminder preview logged for ${record.childName}'s family`);
      } catch (error) {
        setSendingReminder(false);
        setToast(error instanceof Error ? error.message : "Could not save reminder history.");
      }
    }, 900);
  }

  function openChild(child: ChildRecord) {
    setSelectedChild(child);
    setActivePage("dashboard");
  }

  function pullRecord(child: ChildRecord): boolean {
    try {
      saveChild(child);
      setChildren((current) => current.some((record) => record.id === child.id)
        ? current.map((record) => record.id === child.id ? child : record)
        : [child, ...current]);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save the transferred record.");
      return false;
    }
  }

  if (storageError) {
    return (
      <main className="storage-error-page">
        <div className="storage-error-card"><span className="error-mark">!</span><h1>Local records need attention.</h1><p>{storageError}</p><button className="primary-button" onClick={() => { setStorageError(""); setAuthenticated(false); }} type="button">Return to sign in</button></div>
      </main>
    );
  }

  return (
    <>
      {!authenticated ? (
        <AuthPage
          initialTab={startInRegister ? "register" : "signin"}
          onSignIn={() => enterWorkspace()}
          onRegistered={(child) => setRegisteredChild(child)}
          onContinue={() => enterWorkspace(registeredChild ?? undefined)}
        />
      ) : (
        <WorkspaceShell
          activePage={selectedChild ? "dashboard" : activePage}
          onNavigate={(page) => { setSelectedChild(null); setActivePage(page); }}
          onLogout={() => { setAuthenticated(false); setSelectedChild(null); setSearch(""); }}
          onRegister={() => { setAuthenticated(false); setRegisteredChild(null); setStartInRegister(true); }}
          onSearch={setSearch}
          reminderCount={reminders.length}
          search={search}
        >
          {selectedChild ? (
            <ChildDetailPage
              child={children.find((child) => child.id === selectedChild.id) ?? selectedChild}
              onBack={() => setSelectedChild(null)}
              onChildChange={updateChild}
              onSendReminder={startReminder}
              reminderSent={reminderSentChildId === selectedChild.id}
            />
          ) : activePage === "dashboard" ? (
            <DashboardPage
              children={children.filter((child) => {
                const query = search.trim().toLowerCase();
                return !query || child.name.toLowerCase().includes(query) || child.id.toLowerCase().includes(query);
              })}
              onNavigate={setActivePage}
              onOpenChild={openChild}
              onSendReminder={startReminder}
              reminders={reminders}
            />
          ) : activePage === "children" ? (
            <ChildrenPage children={children} onOpenChild={openChild} onSearch={setSearch} search={search} />
          ) : activePage === "reminders" ? (
            <RemindersPage reminders={reminders} />
          ) : (
            <TransferPage children={children} onOpenChild={openChild} onPullRecord={pullRecord} />
          )}
        </WorkspaceShell>
      )}

      <AnimatePresence>
        {reminderTarget && <ReminderModal key="reminder-modal" onClose={() => setReminderTarget(null)} onSubmit={sendReminder} sending={sendingReminder} target={reminderTarget} />}
        {toast && <motion.div animate={{ opacity: 1, y: 0 }} className="app-toast" exit={{ opacity: 0, y: 8 }} initial={{ opacity: 0, y: 8 }} role="status"><Check size={16} />{toast}</motion.div>}
      </AnimatePresence>
    </>
  );
}

function ReminderModal({ target, sending, onClose, onSubmit }: { target: ReminderTarget; sending: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const nextDose = getNextDose(target.child);
  const risk = assessMissRisk(target.child);
  const healthCentre = `${target.child.currentVillage} Primary Health Centre`;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (!sending && event.target === event.currentTarget) onClose(); }}>
      <motion.section animate={{ opacity: 1, scale: 1 }} aria-labelledby="reminder-modal-title" aria-modal="true" className="reminder-modal" initial={{ opacity: 0, scale: .96 }} role="dialog">
        <button aria-label="Close reminder preview" className="modal-close" disabled={sending} onClick={onClose} type="button"><X size={17} /></button>
        <span className="reminder-modal-icon"><MessageCircle size={20} /></span>
        <span className="eyebrow">A GENTLE NUDGE</span>
        <h2 id="reminder-modal-title">Preview family reminder</h2>
        <p className="reminder-modal-subtitle">To {target.child.guardianName} · {target.child.guardianPhone}</p>
        <div className="phone-preview">
          <div className="phone-preview-top"><span className="phone-contact-avatar">{target.child.guardianName.slice(0, 1)}</span><span><strong>{target.child.guardianName}</strong><small>SMS preview</small></span></div>
          <p className="sms-bubble">{target.child.name}&apos;s {target.vaccineName} vaccine is {nextDose?.status === "overdue" ? "overdue" : "due"}. Please visit the {healthCentre} for the next dose. We&apos;re here to help keep {target.child.name}&apos;s health record up to date. — Kavach health team</p>
          <small className="preview-caption">Preview only — no message is sent</small>
        </div>
        <form onSubmit={onSubmit}>
          <button className="primary-button send-sms-button" disabled={sending} type="submit">
            {sending ? <><span className="sending-dots"><i /><i /><i /></span> Saving reminder…</> : <><Send size={16} /> Log reminder as sent</>}
          </button>
        </form>
        <p className="sms-note"><Check size={13} /> Message will be added to the local reminder history.</p>
        {risk.score >= 50 && <span className="sms-context">Priority follow-up · risk score {risk.score}</span>}
      </motion.section>
    </div>
  );
}
