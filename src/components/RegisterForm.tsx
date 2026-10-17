import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { DEVELOPMENT_MILESTONES } from "../data/milestones";
import { REGISTRATION_VACCINES } from "../data/uipSchedule";
import type { ChildRecord, Sex } from "../types";
import { dateMonthsAgo, toDateInputValue } from "../utils/dates";
import { createChildId, saveChild } from "../utils/childStorage";

interface RegisterFormProps {
  onRegistered: (child: ChildRecord) => void;
}

const EMPTY_FIELDS = {
  name: "",
  dateOfBirth: "",
  sex: "" as Sex | "",
  guardianName: "",
  guardianPhone: "",
  previousVillage: "",
  previousDistrict: "",
  currentVillage: "",
  currentDistrict: "",
};

export default function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [vaccinesGiven, setVaccinesGiven] = useState<string[]>([]);
  const [milestonesMet, setMilestonesMet] = useState<string[]>([]);
  const [migrated, setMigrated] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateField(field: keyof typeof EMPTY_FIELDS, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function toggleSelection(value: string, selected: string[], setter: (items: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function fillDemo() {
    setFields({
      name: "Meena",
      dateOfBirth: dateMonthsAgo(9),
      sex: "Female",
      guardianName: "Lakshmi",
      guardianPhone: "9876543210",
      previousVillage: "Kothapalli",
      previousDistrict: "Anantapur",
      currentVillage: "Madanapalle",
      currentDistrict: "Annamayya",
    });
    setVaccinesGiven(["bcg", "hep-b-0", "opv-0", "penta-1", "penta-2"]);
    setMilestonesMet(["sits-alone"]);
    setMigrated(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError("");
    const child: ChildRecord = {
      ...fields,
      sex: fields.sex as Sex,
      id: createChildId(),
      vaccinesGiven,
      milestonesMet,
      migrated,
      missedVisits: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      saveChild(child);
      onRegistered(child);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this child's record.");
    }
  }

  const today = toDateInputValue(new Date());

  return (
    <form className="auth-form register-form" onSubmit={handleSubmit}>
      <div className="form-intro register-intro">
        <span className="eyebrow">A RECORD THAT TRAVELS</span>
        <h2>Start a child&apos;s record.</h2>
        <p>Every detail helps the next health worker pick up right where you left off.</p>
      </div>

      <button className="demo-fill-button" onClick={fillDemo} type="button">
        <Sparkles aria-hidden="true" size={16} /> Fill with Meena&apos;s demo details
      </button>

      <fieldset className="form-section">
        <legend>About the child</legend>
        <div className="form-grid">
          <Field id="child-name" label="Child's name">
            <input autoComplete="off" id="child-name" onChange={(event) => updateField("name", event.target.value)} placeholder="Full name" required value={fields.name} />
          </Field>
          <Field id="child-dob" label="Date of birth">
            <input id="child-dob" max={today} onChange={(event) => updateField("dateOfBirth", event.target.value)} required type="date" value={fields.dateOfBirth} />
          </Field>
          <Field id="child-sex" label="Sex">
            <select id="child-sex" onChange={(event) => updateField("sex", event.target.value)} required value={fields.sex}>
              <option disabled value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other / prefer not to say</option>
            </select>
          </Field>
          <Field id="guardian-name" label="Guardian's name">
            <input autoComplete="name" id="guardian-name" onChange={(event) => updateField("guardianName", event.target.value)} placeholder="Parent or caregiver" required value={fields.guardianName} />
          </Field>
          <Field id="guardian-phone" label="Guardian's phone">
            <input autoComplete="tel" id="guardian-phone" inputMode="tel" onChange={(event) => updateField("guardianPhone", event.target.value)} pattern="[0-9]{7,15}" placeholder="Phone number (digits only)" required value={fields.guardianPhone} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Village details</legend>
        <div className="form-grid">
          <Field id="previous-village" label="Previous village">
            <input id="previous-village" onChange={(event) => updateField("previousVillage", event.target.value)} placeholder="Village" value={fields.previousVillage} />
          </Field>
          <Field id="previous-district" label="Previous district">
            <input id="previous-district" onChange={(event) => updateField("previousDistrict", event.target.value)} placeholder="District" value={fields.previousDistrict} />
          </Field>
          <Field id="current-village" label="Current village">
            <input id="current-village" onChange={(event) => updateField("currentVillage", event.target.value)} placeholder="Village" required value={fields.currentVillage} />
          </Field>
          <Field id="current-district" label="Current district">
            <input id="current-district" onChange={(event) => updateField("currentDistrict", event.target.value)} placeholder="District" required value={fields.currentDistrict} />
          </Field>
        </div>
        <label className="toggle-row">
          <span className="toggle-copy">
            <strong>Family recently migrated</strong>
            <span>Help the next health worker find this family.</span>
          </span>
          <input checked={migrated} onChange={(event) => setMigrated(event.target.checked)} type="checkbox" />
          <span aria-hidden="true" className="toggle-track" />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>Vaccines already given</legend>
        <p className="section-hint">Select all doses confirmed on the child&apos;s previous card.</p>
        <div className="check-grid">
          {REGISTRATION_VACCINES.map((dose) => (
            <CheckOption
              checked={vaccinesGiven.includes(dose.id)}
              key={dose.id}
              label={dose.name}
              onChange={() => toggleSelection(dose.id, vaccinesGiven, setVaccinesGiven)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Development milestones already met</legend>
        <p className="section-hint">A simple way to keep track of what you&apos;ve observed.</p>
        <div className="check-grid">
          {DEVELOPMENT_MILESTONES.map((milestone) => (
            <CheckOption
              checked={milestonesMet.includes(milestone.id)}
              key={milestone.id}
              label={`${milestone.title} · ${milestone.ageGroup}`}
              onChange={() => toggleSelection(milestone.id, milestonesMet, setMilestonesMet)}
            />
          ))}
        </div>
      </fieldset>

      {saveError && <p aria-live="assertive" className="error-notice">{saveError}</p>}
      <button className="primary-button submit-register" type="submit">
        Save child&apos;s record <ArrowRight aria-hidden="true" size={17} />
      </button>
      <p className="privacy-note">Your records stay on this device. No network connection needed.</p>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  children: ReactNode;
}

function Field({ id, label, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

interface CheckOptionProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

function CheckOption({ checked, label, onChange }: CheckOptionProps) {
  return (
    <label className={`check-option${checked ? " selected" : ""}`}>
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span aria-hidden="true" className="custom-check">{checked && <Check size={13} strokeWidth={3} />}</span>
      <span>{label}</span>
    </label>
  );
}
