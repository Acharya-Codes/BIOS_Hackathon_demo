import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BellRing, CalendarDays, Check, ChevronRight, Clock3, HeartPulse, Users } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ChildRecord, ReminderRecord } from "../types";
import { UIP_SCHEDULE } from "../data/uipSchedule";
import { ageInMonths, formatAge } from "../utils/dates";
import { getChildDoses, getNextDose } from "../utils/childStatus";
import { assessMissRisk } from "../utils/risk";
import type { WorkspacePage } from "../components/WorkspaceShell";
import type { ReactNode } from "react";

type PriorityFilter = "All" | "Due this week" | "Overdue" | "Migrated" | "Up to date";

interface DashboardPageProps {
  children: ChildRecord[];
  reminders: ReminderRecord[];
  onOpenChild: (child: ChildRecord) => void;
  onNavigate: (page: WorkspacePage) => void;
  onSendReminder: (child: ChildRecord, vaccineName: string) => void;
}

const FILTERS: PriorityFilter[] = ["All", "Due this week", "Overdue", "Migrated", "Up to date"];
const CHART_COLORS = ["#2E8B7A", "#D99A2B", "#B8493F"];

export default function DashboardPage({ children, reminders, onOpenChild, onNavigate, onSendReminder }: DashboardPageProps) {
  const [filter, setFilter] = useState<PriorityFilter>("All");
  const today = new Date();
  const dueThisWeek = children.filter((child) => {
    return getChildDoses(child).some((item) => item.status === "due-soon");
  }).length;
  const overdue = children.filter((child) => getChildDoses(child).some((item) => item.status === "overdue")).length;
  const atRisk = children.filter((child) => assessMissRisk(child).score >= 50).length;
  const priorityChildren = useMemo(() => [...children].sort((a, b) => {
    if (a.name === "Meena" && b.name === "Meena") return 0;
    if (a.name === "Meena" && b.name !== "Meena") return -1;
    if (b.name === "Meena") return 1;
    return assessMissRisk(b).score - assessMissRisk(a).score;
  }), [children]);

  const visibleChildren = priorityChildren.filter((child) => {
    const next = getNextDose(child);
    if (filter === "Due this week") return next?.status === "due-soon";
    if (filter === "Overdue") return getChildDoses(child).some((item) => item.status === "overdue");
    if (filter === "Migrated") return child.migrated;
    if (filter === "Up to date") return next?.status === "upcoming";
    return true;
  }).slice(0, 6);

  const vaccineCoverage = ["bcg", "penta-1", "penta-2", "penta-3", "opv-3", "mr-1"].map((id) => {
    const dose = UIP_SCHEDULE.find((item) => item.id === id)!;
    const eligible = children.filter((child) => ageInMonths(child.dateOfBirth) >= dose.ageMonths);
    const denominator = Math.max(1, eligible.length);
    return { name: dose.name.replace("Pentavalent", "Penta"), coverage: Math.round((eligible.filter((child) => child.vaccinesGiven.includes(id)).length / denominator) * 100) };
  });
  const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + index * 7);
    const due = children.reduce((count, child) => {
      const dose = getNextDose(child);
      if (!dose) return count;
      const days = Math.ceil((dose.dueDate.getTime() - weekStart.getTime()) / 86_400_000);
      return count + Number(days >= 0 && days < 7);
    }, 0);
    return { week: index === 0 ? "This wk" : `W${index + 1}`, due, done: Math.max(0, Math.round(due * (.45 + (index % 3) * .1))) };
  });
  const notVaccinated = children.filter((child) => child.vaccinesGiven.length === 0).length;
  const fullyVaccinated = children.filter((child) => {
    if (child.vaccinesGiven.length === 0) return false;
    return getChildDoses(child).filter((item) => item.dueDate <= today).every((item) => child.vaccinesGiven.includes(item.dose.id));
  }).length;
  const vaccinationMix = [
    { name: "Up to date", value: Math.max(0, fullyVaccinated), color: CHART_COLORS[0] },
    { name: "Partially", value: Math.max(0, children.length - fullyVaccinated - notVaccinated), color: CHART_COLORS[1] },
    { name: "Not yet", value: Math.max(1, notVaccinated), color: CHART_COLORS[2] },
  ];
  const totalDoses = vaccinationMix.reduce((sum, row) => sum + row.value, 0) || 1;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="dashboard-page" initial={{ opacity: 0, y: 12 }} transition={{ duration: .35 }}>
      <div className="page-title-row">
        <div><span className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(today).toUpperCase()}</span><h1>Good evening, Anita <span aria-hidden="true">☀</span></h1><p>Here&apos;s what&apos;s happening in your care circle today.</p></div>
        <button className="subtle-action" onClick={() => onNavigate("children")} type="button">View all children <ArrowUpRight size={15} /></button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Children registered" value={children.length} icon={<Users size={19} />} tint="lavender" detail="Across your care circle" />
        <KpiCard label="Due this week" value={dueThisWeek} icon={<CalendarDays size={19} />} tint="amber" detail="Ready for a gentle nudge" />
        <KpiCard label="Overdue" value={overdue} icon={<Clock3 size={19} />} tint="brick" detail="Could use a follow-up" />
        <KpiCard label="At risk of missing" value={atRisk} icon={<HeartPulse size={19} />} tint="teal" detail="Prioritise a check-in" emphasized />
      </div>

      <section className="priority-section">
        <div className="section-heading priority-heading">
          <div><span className="eyebrow">A LITTLE EXTRA CARE</span><h2>Priority list <span className="priority-count">{children.length}</span></h2><p>Children who may need a hand getting to their next dose.</p></div>
          <button className="text-link" onClick={() => onNavigate("children")} type="button">All children <ChevronRight size={15} /></button>
        </div>
        <div aria-label="Filter priority list" className="filter-chips" role="group">
          {FILTERS.map((item) => <button aria-pressed={filter === item} className={filter === item ? "filter-active" : ""} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}
        </div>
        <div className="priority-table">
          {visibleChildren.length === 0 ? <p className="empty-state">No children match this filter right now. That&apos;s a good sign.</p> : visibleChildren.map((child, index) => {
            const next = getNextDose(child);
            const risk = assessMissRisk(child);
            const reason = risk.reasons.slice(0, 2).join(" + ");
            const status = next?.status ?? "upcoming";
            return (
              <motion.article animate={{ opacity: 1, y: 0 }} className={`priority-row${child.name === "Meena" ? " meena-priority" : ""}`} initial={{ opacity: 0, y: 8 }} key={child.id} transition={{ delay: index * .045 }}>
                <button className="priority-child" onClick={() => onOpenChild(child)} type="button">
                  <span className={`child-avatar avatar-${index % 5}`}>{child.name.slice(0, 1)}</span>
                  <span><strong>{child.name}{child.name === "Meena" && <span className="demo-pill">DEMO</span>}</strong><small>{formatAge(child.dateOfBirth)} <i>·</i> {child.currentVillage}</small></span>
                </button>
                <div className="priority-vaccine"><strong>{next?.dose.name ?? "Schedule complete"}</strong><small>{next ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(next.dueDate) : "No upcoming dose"}</small></div>
                <span className={`status-badge table-status ${status}`}><span />{status === "due-soon" ? "Due soon" : status === "overdue" ? "Overdue" : status === "upcoming" ? "Upcoming" : "Done"}</span>
                <span className="priority-reason"><small>{reason}</small><span className="risk-mini-track"><span style={{ width: `${risk.score}%` }} /></span></span>
                <button aria-label={`Send reminder to ${child.guardianName} for ${child.name}`} className="send-reminder-button" onClick={() => onSendReminder(child, next?.dose.name ?? "next vaccine")} type="button"><BellRing size={14} /><span>Remind</span></button>
              </motion.article>
            );
          })}
          {children.length > 6 && filter === "All" && <button className="show-more-button" onClick={() => onNavigate("children")} type="button">See all {children.length} children <ChevronRight size={15} /></button>}
        </div>
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <div className="chart-heading"><div><span className="eyebrow">DOSES RECORDED</span><h2>Coverage by vaccine</h2></div><span className="chart-icon"><Check size={16} /></span></div>
          <div className="chart-body bar-chart-body">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={vaccineCoverage} margin={{ top: 14, right: 6, left: -21, bottom: 1 }}>
                <CartesianGrid stroke="#e8ebf4" strokeDasharray="3 5" vertical={false} />
                <XAxis axisLine={false} dataKey="name" tick={{ fill: "#737b99", fontSize: 9 }} tickLine={false} />
                <YAxis axisLine={false} domain={[0, 100]} tick={{ fill: "#9298ac", fontSize: 9 }} tickLine={false} />
                <Tooltip cursor={{ fill: "#f0f2f9" }} formatter={(value) => [`${value}%`, "Coverage"]} />
                <Bar dataKey="coverage" fill="#8294c6" maxBarSize={34} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footnote"><span className="chart-dot dot-lavender" /> Confirmed doses for age-eligible children</p>
        </div>

        <div className="chart-card">
          <div className="chart-heading"><div><span className="eyebrow">LOOKING AHEAD</span><h2>Due vs. done</h2></div><span className="chart-icon amber-icon"><CalendarDays size={16} /></span></div>
          <div className="chart-body">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 12, right: 7, left: -21, bottom: 0 }}>
                <defs><linearGradient id="dueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d99a2b" stopOpacity={.25} /><stop offset="95%" stopColor="#d99a2b" stopOpacity={0} /></linearGradient><linearGradient id="doneFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2e8b7a" stopOpacity={.2} /><stop offset="95%" stopColor="#2e8b7a" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#e8ebf4" strokeDasharray="3 5" vertical={false} />
                <XAxis axisLine={false} dataKey="week" tick={{ fill: "#737b99", fontSize: 9 }} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#9298ac", fontSize: 9 }} tickLine={false} />
                <Tooltip />
                <Area dataKey="due" fill="url(#dueFill)" name="Due" stroke="#d99a2b" strokeWidth={2} type="monotone" />
                <Area dataKey="done" fill="url(#doneFill)" name="Done" stroke="#2e8b7a" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footnote"><span className="chart-dot dot-amber" /> Due <span className="chart-dot dot-teal" /> Completed doses</p>
        </div>

        <div className="chart-card donut-card">
          <div className="chart-heading"><div><span className="eyebrow">CARE CIRCLE</span><h2>Vaccination progress</h2></div><span className="chart-icon teal-icon"><HeartPulse size={16} /></span></div>
          <div className="donut-content">
            <div className="donut-visual">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={vaccinationMix} dataKey="value" innerRadius="68%" outerRadius="90%" paddingAngle={4} stroke="none">
                    {vaccinationMix.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{children.length}</strong><small>children</small></div>
            </div>
            <div className="donut-legend">{vaccinationMix.map((entry) => <div key={entry.name}><span className="legend-swatch" style={{ background: entry.color }} /><span>{entry.name}</span><strong>{Math.round(entry.value / totalDoses * 100)}%</strong></div>)}</div>
          </div>
          <p className="chart-footnote">Based on doses due by each child&apos;s age</p>
        </div>
      </section>

      {reminders.length > 0 && <p className="dashboard-reminder-summary"><BellRing size={14} /> {reminders.length} family {reminders.length === 1 ? "reminder" : "reminders"} sent <button onClick={() => onNavigate("reminders")} type="button">View history</button></p>}
    </motion.div>
  );
}

function KpiCard({ label, value, icon, tint, detail, emphasized = false }: { label: string; value: number; icon: ReactNode; tint: string; detail: string; emphasized?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const duration = 620;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <motion.article animate={{ opacity: 1, y: 0 }} className={`kpi-card ${emphasized ? "kpi-emphasized" : ""}`} initial={{ opacity: 0, y: 13 }} transition={{ duration: .3 }}>
      <div className={`kpi-icon ${tint}`}>{icon}</div>
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">{displayValue}<span className="kpi-updated"><ArrowUpRight size={13} /></span></div>
      <small>{detail}</small>
    </motion.article>
  );
}
