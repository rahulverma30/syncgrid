/**
 * Example feature - Contacts
 * Shows how to structure feature-based architecture
 */

// This directory would contain all contact-related components, hooks, and logic
// Features are organized by domain/feature area for scalability

export const CONTACTS_FEATURE = {
  // Feature routes
  routes: {
    list: '/dashboard/crm/contacts',
    detail: (id: string) => `/dashboard/crm/contacts/${id}`,
    new: '/dashboard/crm/contacts/new',
  },

  // Feature constants
  defaults: {
    pageSize: 20,
    sortBy: 'createdAt',
  },
};
