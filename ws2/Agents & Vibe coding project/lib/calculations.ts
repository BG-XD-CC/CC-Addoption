import type { TenureInfo, PromotionWindow, TenureBracket } from "@/types";

/**
 * Calculates the elapsed tenure from a hire date to now.
 * @param hireDate - The employee's hire date
 * @returns Years, months, and a human-readable display string
 */
export function calculateTenure(hireDate: Date): TenureInfo {
  const now = new Date();
  const hire = new Date(hireDate);

  let years = now.getFullYear() - hire.getFullYear();
  let months = now.getMonth() - hire.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (now.getDate() < hire.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  let display: string;
  if (years === 0) {
    display = months === 1 ? "1 month" : `${months} months`;
  } else if (months === 0) {
    display = years === 1 ? "1 year" : `${years} years`;
  } else {
    display = `${years}y ${months}m`;
  }

  return { years, months, display };
}

/**
 * Determines promotion eligibility and urgency based on years in role.
 *
 * Thresholds:
 * - **< 2 years**: "not-yet" (not eligible)
 * - **2–3 years**: "approaching" (eligible, promotion window opening)
 * - **3+ years**: "overdue" (eligible, promotion past due)
 *
 * @param hireDate - The employee's hire date
 * @returns Eligibility flag, years in role, and urgency level ("not-yet" | "approaching" | "overdue")
 */
export function getPromotionWindow(hireDate: Date): PromotionWindow {
  const { years } = calculateTenure(hireDate);
  const yearsInRole = years;

  if (yearsInRole < 2) {
    return { eligible: false, yearsInRole, urgency: "not-yet" };
  }
  if (yearsInRole >= 2 && yearsInRole < 3) {
    return { eligible: true, yearsInRole, urgency: "approaching" };
  }
  return { eligible: true, yearsInRole, urgency: "overdue" };
}

/**
 * Classifies an employee's tenure into a predefined bracket.
 * @param hireDate - The employee's hire date
 * @returns One of "<1 year", "1-3 years", "3-5 years", or "5+ years"
 */
export function getTenureBracket(hireDate: Date): TenureBracket {
  const { years } = calculateTenure(hireDate);
  if (years < 1) return "<1 year";
  if (years < 3) return "1-3 years";
  if (years < 5) return "3-5 years";
  return "5+ years";
}
