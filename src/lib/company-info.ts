/**
 * Cooper Cricket business details. Single source of truth used by:
 *   - the proposal letterhead
 *   - the public approval page footer
 *   - the email sent to players
 *   - the login page footer
 *
 * Update values here and they propagate everywhere.
 */
export const COMPANY = {
  legalName: "Cooper Cricket Pty Ltd",
  tradingName: "Cooper Cricket",
  abn: "16 164 884 280",
  address: {
    line1: "1 Axford Street",
    suburb: "Northgate",
    state: "QLD",
    postcode: "4013",
    country: "Australia",
  },
  phone: "07 3267 0936",
  email: "info@coopercricket.com.au",
  website: "https://coopercricket.com.au",
  proposalValidityDays: 30,
} as const;

export function addressLines(): string[] {
  const { line1, suburb, state, postcode } = COMPANY.address;
  return [line1, `${suburb} ${state} ${postcode}`];
}

export function addressOneLine(): string {
  return `${COMPANY.address.line1}, ${COMPANY.address.suburb} ${COMPANY.address.state} ${COMPANY.address.postcode}`;
}
