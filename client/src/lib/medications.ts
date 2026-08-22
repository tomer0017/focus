/**
 * What is due today, and what has been ticked off.
 *
 * The boundary is the important part of this file. Nothing here calculates a
 * dose, judges a missed one, or knows anything about any substance. It turns
 * "07:00 and 21:00, weekdays only" into a list of times, and remembers which of
 * them the user pressed. A missed dose is simply not ticked — it is never
 * rendered as a failure, for the same reason a missed routine day is not.
 */
import { todayKey } from "./dateKey";
import type { Medication, MedicationDose } from "../types/health";

/** `YYYY-MM-DD@HH:MM` — a scheduled slot on a day, never a timestamp. */
export function doseKey(dayKey: string, time: string): string {
  return `${dayKey}@${time}`;
}

/** True when the medication is meant to be taken on this calendar day. */
export function isActiveOn(medication: Medication, dayKey: string): boolean {
  if (medication.status !== "active") return false;
  if (medication.startsOn && dayKey < medication.startsOn) return false;
  if (medication.endsOn && dayKey > medication.endsOn) return false;

  const weekdays = medication.weekdays ?? [];
  // Empty means every day. Making the user tick seven boxes for the common case
  // is the kind of small tax that stops a feature being used at all.
  if (weekdays.length === 0) return true;

  const [year, month, day] = dayKey.split("-").map(Number);
  return weekdays.includes(new Date(year, (month ?? 1) - 1, day ?? 1).getDay());
}

/** Every dose for one medication on one day, in time order. */
export function dosesOn(medication: Medication, dayKey: string): MedicationDose[] {
  if (!isActiveOn(medication, dayKey)) return [];

  return [...medication.times]
    .sort((a, b) => a.localeCompare(b))
    .map((time) => {
      const key = doseKey(dayKey, time);
      return {
        medicationId: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        withFood: medication.withFood,
        time,
        key,
        taken: medication.taken.includes(key),
      };
    });
}

/** Today's doses across every medication, earliest first. */
export function dosesForDay(
  medications: Medication[],
  dayKey: string = todayKey()
): MedicationDose[] {
  return medications
    .flatMap((medication) => dosesOn(medication, dayKey))
    .sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
}

/** Toggles one dose. Pure: the provider persists what comes back. */
export function toggleDose(medication: Medication, key: string): Medication {
  const taken = medication.taken.includes(key)
    ? medication.taken.filter((entry) => entry !== key)
    : [...medication.taken, key];
  return { ...medication, taken, updatedAt: new Date().toISOString() };
}

/**
 * True when the user asked to be told about a refill and that date has come.
 *
 * Stock is optional and entirely manual. Focus does not decrement a count when
 * a dose is ticked: it has no idea how many are in the box, and a number that
 * drifts out of step with reality is worse than no number.
 */
export function needsRefill(medication: Medication, now: Date = new Date()): boolean {
  if (medication.status !== "active") return false;
  return Boolean(medication.refillRemindAt && medication.refillRemindAt <= now.toISOString());
}

export function activeMedications(medications: Medication[]): Medication[] {
  return medications.filter((medication) => medication.status === "active");
}
