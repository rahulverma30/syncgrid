export interface DuplicateResult {
  clientId: string;
  name: string;
  clientType: string;
  healthScore: number;
  revenueContribution: number;
  confidence: number;
  matchReasons: string[];
}

/**
 * Clean domains out of slugs/urls
 */
function extractDomain(urlOrEmail: string): string {
  if (!urlOrEmail) return '';
  let cleaned = urlOrEmail.toLowerCase().trim();
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[1] || '';
  }
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
  return cleaned.split('/')[0] || '';
}

/**
 * Standard Levenshtein Distance for fuzzy name matches
 */
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const sa = a.toLowerCase().trim();
  const sb = b.toLowerCase().trim();

  if (sa.length === 0) return sb.length;
  if (sb.length === 0) return sa.length;

  for (let i = 0; i <= sb.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= sa.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= sb.length; i++) {
    for (let j = 1; j <= sa.length; j++) {
      if (sb.charAt(i - 1) === sa.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[sb.length][sa.length];
}

/**
 * Score two corporate clients for similarities
 */
export function scoreClientDuplicate(clientA: any, clientB: any): DuplicateResult | null {
  if (clientA._id.toString() === clientB._id.toString()) return null;

  let score = 0;
  const matchReasons: string[] = [];

  // 1. Company Name similarity check (fuzzy overlap)
  const nameA = clientA.name || '';
  const nameB = clientB.name || '';
  const levDist = getLevenshteinDistance(nameA, nameB);
  const maxLength = Math.max(nameA.length, nameB.length);
  const nameSim = maxLength > 0 ? (maxLength - levDist) / maxLength : 0;

  if (nameSim >= 0.85) {
    score += 55;
    matchReasons.push(`Fuzzy company names match (${Math.round(nameSim * 100)}% similarity)`);
  } else if (nameSim >= 0.7) {
    score += 30;
    matchReasons.push('Partial company name overlap');
  }

  // 2. Email matching checks
  const emailsA = clientA.emails || [];
  const emailsB = clientB.emails || [];
  const sharedEmails = emailsA.filter((email: string) =>
    emailsB.some((e: string) => e.toLowerCase().trim() === email.toLowerCase().trim())
  );
  if (sharedEmails.length > 0) {
    score += 50;
    matchReasons.push(`Shared contact email: "${sharedEmails[0]}"`);
  }

  // 3. Website / Domain check
  const domainA = extractDomain(clientA.website || '');
  const domainB = extractDomain(clientB.website || '');
  const isGeneric = (d: string) =>
    ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'].includes(d);
  if (domainA && domainB && domainA === domainB && !isGeneric(domainA)) {
    score += 45;
    matchReasons.push(`Shared company domain: "${domainA}"`);
  }

  // 4. Phone digits comparison
  const sanitizePhone = (p: string) => p.replace(/\D/g, '');
  const phonesA = (clientA.phones || []).map(sanitizePhone).filter(Boolean);
  const phonesB = (clientB.phones || []).map(sanitizePhone).filter(Boolean);
  const sharedPhones = phonesA.filter((phone: string) => phonesB.includes(phone));
  if (sharedPhones.length > 0) {
    score += 40;
    matchReasons.push('Shared point-of-contact phone numbers');
  }

  // Bound score max to 100
  const confidence = Math.min(100, score);

  if (confidence >= 40) {
    return {
      clientId: clientB._id.toString(),
      name: clientB.name,
      clientType: clientB.clientType,
      healthScore: clientB.healthScore,
      revenueContribution: clientB.revenueContribution,
      confidence,
      matchReasons,
    };
  }

  return null;
}
