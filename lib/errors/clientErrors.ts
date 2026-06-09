/**
 * SyncGrid — Frontend Client Error Translator
 *
 * This utility translates raw API response error codes into
 * structured, user-friendly messages for toasts and inline display.
 *
 * Usage:
 *   const err = getClientError(apiResponse);
 *   toast.error(err.title, { description: err.description });
 *
 * Never show raw d.message or error.message directly to users.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ClientError {
  title: string;
  description: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

// ─────────────────────────────────────────────
// Error code → friendly message map
// ─────────────────────────────────────────────

const ERROR_MAP: Record<string, ClientError> = {
  // Auth — general
  UNAUTHORIZED: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again to continue.',
  },
  FORBIDDEN: {
    title: 'Access Denied',
    description:
      "You don't have permission to perform this action. Contact your administrator if you need access.",
  },

  // Auth — sign-in specific
  INVALID_CREDENTIALS: {
    title: 'Sign In Failed',
    description:
      'The email or password you entered is incorrect. Please double-check and try again.',
  },
  ACCOUNT_LOCKED: {
    title: 'Account Temporarily Locked',
    description:
      'Too many failed sign-in attempts. Your account has been locked for 15 minutes. Please try again later or reset your password.',
  },
  ACCOUNT_DISABLED: {
    title: 'Account Deactivated',
    description:
      'Your account has been deactivated. Please contact your administrator to restore access.',
  },
  RATE_LIMITED: {
    title: 'Too Many Attempts',
    description:
      'You have made too many sign-in attempts. Please wait 15 minutes before trying again.',
  },

  // Auth — registration
  EMAIL_TAKEN: {
    title: 'Email Already Registered',
    description:
      'An account with this email already exists. Try signing in instead, or use a different email address.',
  },
  WEAK_PASSWORD: {
    title: 'Password Too Weak',
    description:
      'Your password must be at least 8 characters and include a mix of letters and numbers.',
  },
  REGISTRATION_FAILED: {
    title: 'Could Not Create Account',
    description:
      "We couldn't create your account right now. Please check your details and try again.",
  },

  // Auth — password reset
  INVALID_TOKEN: {
    title: 'Link Invalid or Expired',
    description:
      'This reset link is no longer valid. Links expire after 1 hour. Please request a new one.',
  },
  TOKEN_EXPIRED: {
    title: 'Link Expired',
    description: 'This link has expired. Please go back and request a new password reset link.',
  },
  PASSWORD_MISMATCH: {
    title: 'Passwords Do Not Match',
    description: 'The passwords you entered do not match. Please re-enter them carefully.',
  },
  SAME_PASSWORD: {
    title: 'Password Already Used',
    description:
      'Your new password must be different from your current password. Please choose a new one.',
  },
  RESET_FAILED: {
    title: 'Password Reset Failed',
    description:
      "We couldn't update your password. The link may have already been used. Please request a new reset link.",
  },

  // Auth — invite
  INVITE_INVALID: {
    title: 'Invitation Invalid',
    description:
      'This invitation link is not valid. It may have already been used or the link is incorrect.',
  },
  INVITE_EXPIRED: {
    title: 'Invitation Expired',
    description:
      'This invitation has expired. Please ask your administrator to send a new invitation.',
  },
  INVITE_ALREADY_USED: {
    title: 'Invitation Already Accepted',
    description:
      'This invitation has already been used to create an account. Please sign in instead.',
  },

  // Not Found
  NOT_FOUND: {
    title: 'Not Found',
    description:
      'The item you are looking for could not be found. It may have been deleted or moved.',
  },

  // Validation
  VALIDATION_ERROR: {
    title: 'Form Validation Failed',
    description: 'Some fields contain invalid values. Please review your entries and try again.',
  },
  INVALID_JSON: {
    title: 'Invalid Request',
    description: 'The request could not be processed. Please refresh the page and try again.',
  },
  INVALID_ID: {
    title: 'Item Not Found',
    description: "We couldn't find the item you're looking for. It may have been deleted or moved.",
  },

  // Duplicate
  DUPLICATE_ERROR: {
    title: 'Already Exists',
    description:
      'A record with this information already exists. Please use a different value and try again.',
  },

  // Create / Update / Delete
  CREATE_ERROR: {
    title: 'Could Not Save',
    description: "We couldn't save your record. Please check the form for errors and try again.",
  },
  UPDATE_ERROR: {
    title: 'Could Not Update',
    description: "We couldn't save your changes. Please try again in a few moments.",
  },
  DELETE_ERROR: {
    title: 'Could Not Delete',
    description:
      "We couldn't delete this item right now. Please try again or contact support if the issue persists.",
  },
  ACTION_FAILED: {
    title: 'Action Failed',
    description: "We couldn't complete this action. Please try again.",
  },
  ACTION_ERROR: {
    title: 'Action Failed',
    description: 'Something went wrong while processing your request. Please try again.',
  },
  WON_ERROR: {
    title: 'Could Not Mark as Won',
    description:
      "We couldn't mark this deal as won. Please ensure the deal is linked to a Corporate Account and try again.",
  },

  // Query / Fetch
  FETCH_ERROR: {
    title: 'Could Not Load Data',
    description: 'We had trouble loading this data. Please refresh the page and try again.',
  },
  QUERY_ERROR: {
    title: 'Could Not Load Data',
    description: 'We had trouble fetching this information. Please try again.',
  },

  // Permissions / Access
  ROLE_ERROR: {
    title: 'Configuration Issue',
    description:
      'There is a configuration issue with your account roles. Please contact your administrator.',
  },
  BAD_REQUEST: {
    title: 'Invalid Request',
    description: 'The request was not valid. Please check your inputs and try again.',
  },

  // Conflict
  ALREADY_WON: {
    title: 'Deal Already Won',
    description: 'This deal has already been marked as won.',
  },

  // Server
  SERVER_ERROR: {
    title: 'Something Went Wrong',
    description: "We couldn't complete your request right now. Please try again in a few moments.",
  },
  INTERNAL_ERROR: {
    title: 'Something Went Wrong',
    description: "We couldn't complete your request right now. Please try again in a few moments.",
  },
  CONNECTION_ERROR: {
    title: 'Connection Problem',
    description:
      "We couldn't connect to the server. Please check your internet connection and try again.",
  },
};

// ─────────────────────────────────────────────
// Default fallback
// ─────────────────────────────────────────────

const DEFAULT_ERROR: ClientError = {
  title: 'Something Went Wrong',
  description:
    "We couldn't complete your request. Please try again. If the issue continues, contact support.",
};

// ─────────────────────────────────────────────
// Main translator
// ─────────────────────────────────────────────

/**
 * Translate a raw API response into a user-friendly error object.
 * Use the returned `title` and `description` in toasts and inline messages.
 */
export function getClientError(response: ApiResponse | null | undefined): ClientError {
  if (!response) {
    return {
      title: 'Connection Problem',
      description:
        "We couldn't reach the server. Please check your internet connection and try again.",
    };
  }

  const code = response.error as string | undefined;

  if (code && ERROR_MAP[code]) {
    return ERROR_MAP[code];
  }

  // Return default
  return DEFAULT_ERROR;
}

/**
 * Get a network error message when fetch() itself throws (e.g., offline).
 */
export function getNetworkError(): ClientError {
  return {
    title: 'Connection Problem',
    description:
      "We couldn't reach the server. Please check your internet connection and try again.",
  };
}

/**
 * Translate a NextAuth `result.error` string into a user-friendly error.
 * NextAuth passes error strings like "CredentialsSignin", "AccountLocked", etc.
 * Use this on the login page instead of showing raw NextAuth error strings.
 */
export function getAuthError(nextAuthError: string | null | undefined): ClientError {
  if (!nextAuthError) return DEFAULT_ERROR;

  const normalized = decodeURIComponent(nextAuthError);

  // Map NextAuth built-in error strings
  if (
    normalized.includes('CredentialsSignin') ||
    normalized.includes('Invalid email or password')
  ) {
    return ERROR_MAP.INVALID_CREDENTIALS;
  }
  if (normalized.includes('Account is temporarily locked') || normalized.includes('locked')) {
    return ERROR_MAP.ACCOUNT_LOCKED;
  }
  if (normalized.includes('Too many login attempts') || normalized.includes('rate limit')) {
    return ERROR_MAP.RATE_LIMITED;
  }
  if (normalized.includes('disabled') || normalized.includes('deactivated')) {
    return ERROR_MAP.ACCOUNT_DISABLED;
  }
  if (
    normalized.includes('INVITE_EXPIRED') ||
    (normalized.includes('invitation') && normalized.includes('expired'))
  ) {
    return ERROR_MAP.INVITE_EXPIRED;
  }
  if (
    normalized.includes('INVITE_INVALID') ||
    (normalized.includes('invalid') && normalized.includes('invitation'))
  ) {
    return ERROR_MAP.INVITE_INVALID;
  }

  // Return generic sign-in failure
  return {
    title: 'Sign In Failed',
    description: 'We were unable to sign you in. Please check your credentials and try again.',
  };
}

// ─────────────────────────────────────────────
// Pre-built success messages
// ─────────────────────────────────────────────

export const SUCCESS_MESSAGES = {
  // CRM
  dealCreated: {
    title: 'Deal Created',
    description: 'The sales opportunity has been added to your pipeline.',
  },
  dealUpdated: { title: 'Deal Updated', description: 'Your changes to the deal have been saved.' },
  dealDeleted: {
    title: 'Deal Deleted',
    description: 'The deal has been permanently removed from your pipeline.',
  },
  dealWon: {
    title: 'Deal Won! 🎉',
    description: 'The client account has been automatically provisioned.',
  },
  accountCreated: {
    title: 'Account Created',
    description: 'The corporate account has been registered.',
  },
  accountUpdated: { title: 'Account Updated', description: 'Account details have been saved.' },
  accountDeleted: {
    title: 'Account Deleted',
    description: 'The corporate account has been permanently removed.',
  },
  contactCreated: { title: 'Contact Created', description: 'The new contact has been added.' },
  contactUpdated: { title: 'Contact Saved', description: 'Contact information has been updated.' },
  contactDeleted: {
    title: 'Contact Deleted',
    description: 'The contact has been permanently removed.',
  },

  // Clients
  clientUpdated: {
    title: 'Client Updated',
    description: 'Client account details have been saved.',
  },
  clientNoteAdded: { title: 'Note Added', description: 'The account note has been logged.' },
  clientNoteUpdated: {
    title: 'Note Updated',
    description: 'The note has been updated and version history logged.',
  },
  clientContractAdded: {
    title: 'Contract Registered',
    description: 'The contract agreement has been saved.',
  },
  clientContactAdded: {
    title: 'Contact Registered',
    description: 'The new point of contact has been added.',
  },
  clientMeetingScheduled: {
    title: 'Meeting Scheduled',
    description: 'The sync meeting has been logged.',
  },
  clientCommunicationLogged: {
    title: 'Interaction Logged',
    description: 'The customer interaction has been recorded.',
  },
  clientDocumentUploaded: {
    title: 'Document Saved',
    description: 'The document has been added to the secure vault.',
  },
  clientMerged: {
    title: 'Records Merged',
    description: 'The duplicate client records have been merged successfully.',
  },

  // Finance
  invoiceCreated: {
    title: 'Invoice Created',
    description: 'Your invoice has been created and is ready to send.',
  },
  invoiceUpdated: { title: 'Invoice Updated', description: 'Invoice details have been saved.' },
  invoiceDeleted: {
    title: 'Invoice Deleted',
    description: 'The invoice has been permanently removed.',
  },
  invoiceSent: { title: 'Invoice Sent', description: 'The invoice has been sent to the client.' },
  expenseCreated: { title: 'Expense Logged', description: 'The expense has been recorded.' },
  expenseUpdated: { title: 'Expense Updated', description: 'Expense details have been saved.' },
  expenseDeleted: {
    title: 'Expense Deleted',
    description: 'The expense has been permanently removed.',
  },
  budgetUpdated: { title: 'Budget Updated', description: 'Budget settings have been saved.' },

  // Projects
  projectCreated: { title: 'Project Created', description: 'The new project has been set up.' },
  projectUpdated: { title: 'Project Updated', description: 'Project details have been saved.' },
  projectDeleted: {
    title: 'Project Deleted',
    description: 'The project has been permanently removed.',
  },
  milestoneAdded: {
    title: 'Milestone Added',
    description: 'The milestone has been added to the project.',
  },
  riskAdded: { title: 'Risk Logged', description: 'The risk has been recorded.' },
  documentUploaded: {
    title: 'Document Uploaded',
    description: 'The file has been added to the project.',
  },

  // Tasks
  taskCreated: { title: 'Task Created', description: 'The new task has been added.' },
  taskUpdated: { title: 'Task Updated', description: 'Your changes have been saved.' },
  taskDeleted: { title: 'Task Deleted', description: 'The task has been permanently removed.' },
  taskCompleted: {
    title: 'Task Completed',
    description: 'Great work! The task has been marked as complete.',
  },

  // HR / Employees
  employeeCreated: {
    title: 'Employee Added',
    description: 'The new team member profile has been created.',
  },
  employeeUpdated: { title: 'Employee Updated', description: 'Employee details have been saved.' },
  employeeDeleted: {
    title: 'Employee Removed',
    description: 'The employee record has been permanently removed.',
  },
  payrollRun: {
    title: 'Payroll Processed',
    description: 'The payroll run has been completed successfully.',
  },
  leaveApproved: { title: 'Leave Approved', description: 'The leave request has been approved.' },
  leaveRejected: { title: 'Leave Rejected', description: 'The leave request has been rejected.' },

  // Team / Settings
  memberInvited: {
    title: 'Invitation Sent',
    description: 'A secure invitation has been sent to the team member.',
  },
  memberRemoved: { title: 'Member Removed', description: 'The team member has been removed.' },
  settingsSaved: { title: 'Settings Saved', description: 'Your changes have been applied.' },
  roleCreated: { title: 'Role Created', description: 'The new role has been configured.' },
  roleUpdated: { title: 'Role Updated', description: 'Role permissions have been updated.' },
  roleDeleted: { title: 'Role Deleted', description: 'The role has been permanently removed.' },

  // Auth
  signedIn: { title: 'Welcome back!', description: "You've signed in successfully." },
  signedOut: { title: 'Signed Out', description: 'You have been signed out securely.' },
  workspaceCreated: {
    title: 'Account Created!',
    description: 'Your workspace has been set up. Welcome to SyncGrid.',
  },
  inviteAccepted: {
    title: 'Welcome Aboard! 🎉',
    description: 'Your account is ready. Redirecting you to your dashboard...',
  },
  passwordResetSent: {
    title: 'Reset Link Sent',
    description:
      "If an account exists for this email, you'll receive reset instructions within a few minutes. Check your inbox.",
  },
  passwordResetDone: {
    title: 'Password Updated',
    description:
      'Your password has been changed successfully. Please sign in with your new password.',
  },
} as const;

// ─────────────────────────────────────────────
// Pre-built empty state configs
// ─────────────────────────────────────────────

export const EMPTY_STATES = {
  deals: {
    title: 'No deals yet',
    description: 'Add your first deal to start tracking your pipeline and forecast revenue.',
    badge: 'PIPELINE EMPTY',
  },
  dealSearch: {
    title: 'No deals match your search',
    description: "Try adjusting your search terms or filters to find what you're looking for.",
    badge: 'NO RESULTS',
  },
  accounts: {
    title: 'No corporate accounts yet',
    description: 'Add your first account to start managing pre-sale companies in your CRM.',
    badge: 'ACCOUNTS EMPTY',
  },
  contacts: {
    title: 'No contacts yet',
    description: 'Add your first contact or import from an existing account.',
    badge: 'CONTACTS EMPTY',
  },
  clients: {
    title: 'No clients yet',
    description: 'Convert a won deal to automatically provision a client, or add one manually.',
    badge: 'CLIENTS EMPTY',
  },
  invoices: {
    title: 'No invoices yet',
    description: 'Create your first invoice to start tracking billable revenue.',
    badge: 'INVOICES EMPTY',
  },
  expenses: {
    title: 'No expenses logged yet',
    description: 'Start logging expenses to track your company spending.',
    badge: 'EXPENSES EMPTY',
  },
  projects: {
    title: 'No projects yet',
    description: 'Create a project to start managing work, tasks, and milestones.',
    badge: 'PROJECTS EMPTY',
  },
  tasks: {
    title: 'No tasks yet',
    description: 'Create your first task to start tracking work.',
    badge: 'TASKS EMPTY',
  },
  taskSearch: {
    title: 'No tasks match your search',
    description: 'Try adjusting your filters or search terms.',
    badge: 'NO RESULTS',
  },
  employees: {
    title: 'No employees yet',
    description: 'Add your first team member to get started with HR management.',
    badge: 'TEAM EMPTY',
  },
  payroll: {
    title: 'No payroll records yet',
    description: 'Run your first payroll to start tracking salary disbursements.',
    badge: 'PAYROLL EMPTY',
  },
  notifications: {
    title: "You're all caught up!",
    description:
      "No new notifications right now. We'll let you know when something needs your attention.",
    badge: 'ALL CLEAR',
  },
  activity: {
    title: 'No activity yet',
    description: 'Activity will appear here as your team works on this record.',
    badge: 'NO ACTIVITY',
  },
  documents: {
    title: 'No documents yet',
    description: 'Upload your first document to get started.',
    badge: 'VAULT EMPTY',
  },
  notes: {
    title: 'No notes yet',
    description: 'Add a note to log important information about this account.',
    badge: 'NOTES EMPTY',
  },
  timeline: {
    title: 'No timeline events yet',
    description: 'Events will appear here as actions are taken on this record.',
    badge: 'TIMELINE EMPTY',
  },
  search: {
    title: 'No results found',
    description: 'Try different search terms or clear your filters to see more results.',
    badge: 'NO RESULTS',
  },
  generic: {
    title: 'Nothing here yet',
    description: 'Get started by creating your first record.',
    badge: 'EMPTY',
  },
} as const;

export type EmptyStateKey = keyof typeof EMPTY_STATES;
