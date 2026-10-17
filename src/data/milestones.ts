export interface DevelopmentMilestone {
  id: string;
  title: string;
  ageGroup: string;
  area: "Motor" | "Speech" | "Social";
}

// Suggested observations for tracking; they are not a diagnostic checklist.
export const DEVELOPMENT_MILESTONES: DevelopmentMilestone[] = [
  { id: "holds-head", title: "Holds head steady", ageGroup: "By 4 months", area: "Motor" },
  { id: "reaches-toy", title: "Reaches for a nearby toy", ageGroup: "By 6 months", area: "Motor" },
  { id: "rolls-over", title: "Rolls from tummy to back", ageGroup: "By 6 months", area: "Motor" },
  { id: "sits-supported", title: "Sits with support", ageGroup: "By 6 months", area: "Motor" },
  { id: "sits-alone", title: "Sits without support", ageGroup: "By 9 months", area: "Motor" },
  { id: "moves-objects", title: "Passes an object between hands", ageGroup: "By 9 months", area: "Motor" },
  { id: "babbles", title: "Babbles or copies sounds", ageGroup: "By 6 months", area: "Speech" },
  { id: "responds-name", title: "Looks when called by name", ageGroup: "By 9 months", area: "Speech" },
  { id: "understands-no", title: "Pauses briefly at “no”", ageGroup: "By 9 months", area: "Speech" },
  { id: "smiles", title: "Smiles at familiar people", ageGroup: "By 4 months", area: "Social" },
  { id: "laughs", title: "Enjoys a familiar game", ageGroup: "By 6 months", area: "Social" },
  { id: "plays-peekaboo", title: "Enjoys peekaboo", ageGroup: "By 9 months", area: "Social" },
];
