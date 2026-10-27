// The message a user signs to claim a name. Shared so the page and the claim route can't drift apart.
export const claimMessage = (label: string, parent: string, address: string, issuedAt: number): string =>
  `Claim ${label}.${parent}\nAddress: ${address}\nIssued: ${issuedAt}`
