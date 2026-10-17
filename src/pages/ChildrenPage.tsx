import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, ArrowUpRight, Baby, Search, SlidersHorizontal } from "lucide-react";
import type { ChildRecord } from "../types";
import { formatAge } from "../utils/dates";
import { getChildDoses, getNextDose } from "../utils/childStatus";
import { assessMissRisk } from "../utils/risk";

interface ChildrenPageProps {
  children: ChildRecord[];
  search: string;
  onSearch: (value: string) => void;
  onOpenChild: (child: ChildRecord) => void;
}

type SortOption = "risk" | "name" | "age";

export default function ChildrenPage({ children, search, onSearch, onOpenChild }: ChildrenPageProps) {
  const [filter, setFilter] = useState("All children");
  const [sort, setSort] = useState<SortOption>("risk");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...children].filter((child) => {
      const matchesSearch = !query || child.name.toLowerCase().includes(query) || child.id.toLowerCase().includes(query) || child.guardianName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filter === "Migrated") return child.migrated;
      if (filter === "At risk") return assessMissRisk(child).score >= 50;
      if (filter === "Overdue") return getChildDoses(child).some((item) => item.status === "overdue");
      return true;
    }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "age" ? new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime() : assessMissRisk(b).score - assessMissRisk(a).score);
  }, [children, filter, search, sort]);

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="children-page" initial={{ opacity: 0, y: 12 }} transition={{ duration: .3 }}>
      <div className="page-title-row">
        <div><span className="eyebrow">YOUR CARE CIRCLE</span><h1>Children <span className="title-count">{children.length}</span></h1><p>Every child&apos;s story, safely kept in one place.</p></div>
        <div className="list-insight"><Baby size={19} /><span>Portable records<br /><strong>ready to travel</strong></span></div>
      </div>
      <section className="panel-card children-table-card">
        <div className="table-toolbar">
          <div className="filter-chips">
            {["All children", "Overdue", "Migrated", "At risk"].map((item) => <button aria-pressed={filter === item} className={filter === item ? "filter-active" : ""} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}
          </div>
          <label className="table-search"><Search size={15} /><input aria-label="Filter children" onChange={(event) => onSearch(event.target.value)} placeholder="Filter list" value={search} /></label>
          <label className="sort-select"><SlidersHorizontal size={14} /><select aria-label="Sort children" onChange={(event) => setSort(event.target.value as SortOption)} value={sort}><option value="risk">Highest risk</option><option value="name">Name A–Z</option><option value="age">Youngest first</option></select><ArrowDownUp size={13} /></label>
        </div>
        <div className="table-scroll">
          <table className="children-table">
            <thead><tr><th>CHILD</th><th>GUARDIAN</th><th>VILLAGE</th><th>NEXT DOSE</th><th>STATUS</th><th>RISK</th><th><span className="sr-only">Open record</span></th></tr></thead>
            <tbody>
              {filtered.map((child, index) => {
                const next = getNextDose(child);
                const risk = assessMissRisk(child);
                return (
                  <tr key={child.id} onClick={() => onOpenChild(child)}>
                    <td><span className={`table-child-avatar avatar-${index % 5}`}>{child.name.slice(0, 1)}</span><span className="table-child-copy"><strong>{child.name}</strong><small>{formatAge(child.dateOfBirth)} · {child.id}</small></span></td>
                    <td><strong>{child.guardianName}</strong><small>{child.guardianPhone}</small></td>
                    <td><strong>{child.currentVillage}</strong><small>{child.currentDistrict}{child.migrated && <span className="migrated-dot" />}</small></td>
                    <td><strong>{next?.dose.name ?? "Schedule complete"}</strong><small>{next ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(next.dueDate) : "—"}</small></td>
                    <td>{next && <span className={`status-badge table-status ${next.status}`}><span />{next.status === "due-soon" ? "Due soon" : next.status === "overdue" ? "Overdue" : "Upcoming"}</span>}</td>
                    <td><span className={`risk-number ${risk.score >= 60 ? "high" : risk.score >= 30 ? "medium" : "low"}`}>{risk.score}</span></td>
                    <td><button aria-label={`Open ${child.name}'s record`} className="table-open-button" onClick={(event) => { event.stopPropagation(); onOpenChild(child); }} type="button"><ArrowUpRight size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty-state">No child records match this search and filter.</p>}
        </div>
        <div className="table-footer">Showing <strong>{filtered.length}</strong> of <strong>{children.length}</strong> child records <span>Records are stored on this device</span></div>
      </section>
    </motion.div>
  );
}
