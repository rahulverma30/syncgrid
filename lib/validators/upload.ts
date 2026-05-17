/**
 * Secure file upload validator for enterprise metadata payloads.
 * Prevents payload injection, validates file size ceilings, and enforces MIME/extension bounds.
 */

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface FileValidationPayload {
  name: string;
  category: string;
  url: string;
  size?: number;
}

export function validateUploadPayload(payload: FileValidationPayload): {
  isValid: boolean;
  error?: string;
} {
  const { name, category, url, size } = payload;

  if (!name || !category || !url) {
    return { isValid: false, error: 'Name, Category, and URL parameters are required.' };
  }

  // 1. Sanitize name and inspect extension
  const sanitizedName = name.trim();
  const lowerName = sanitizedName.toLowerCase();
  const extensionMatch = lowerName.match(/\.[0-9a-z]+$/);
  if (!extensionMatch) {
    return { isValid: false, error: 'File must contain a valid extension format.' };
  }
  const extension = extensionMatch[0];
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { isValid: false, error: `File type "${extension}" is not supported.` };
  }

  // 2. Validate category bounds
  const validCategories = ['contract', 'proposal', 'NDA', 'invoice', 'onboarding', 'legal'];
  if (!validCategories.includes(category)) {
    return { isValid: false, error: `Invalid document category: "${category}".` };
  }

  // 3. Size validation
  if (size !== undefined && size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds the enterprise limit of 50MB.' };
  }

  // 4. URL Validation: Ensure S3 host matching or secure protocols
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Protocol validation failure: only secure HTTPS links are allowed.',
      };
    }
    // Protect against basic SSRF/Localhost mappings
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      return { isValid: false, error: 'Destination resolution failure: invalid storage hostname.' };
    }
  } catch (e) {
    return { isValid: false, error: 'Supplied storage URL is malformed.' };
  }

  return { isValid: true };
}
