/**
 * Role-based permissions for Age UK Bury
 * Maps each role to the nav paths they can access.
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  HANDYPERSON: 'handyperson',
  ACTIVITY_VOLUNTEER: 'activity_volunteer',
  BEFRIENDING_COORDINATOR: 'befriending_coordinator',
  INFORMATION_OFFICER: 'information_officer',
  FACILITIES_COORDINATOR: 'facilities_coordinator',
  FINANCE_OFFICER: 'finance_officer',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  handyperson: 'Handyperson',
  activity_volunteer: 'Activity Volunteer',
  befriending_coordinator: 'Befriending Coordinator',
  information_officer: 'Information & Advice Officer',
  facilities_coordinator: 'Facilities Coordinator',
  finance_officer: 'Finance Officer',
};

// Paths each role can access. 'admin' gets everything.
const ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: [
    '/', '/clients', '/prospects', '/jobs', '/calendar', '/activities',
    '/services', '/analytics', '/map', '/referrals', '/partners',
    '/grants', '/compliance', '/impact', '/staff', '/staff-calendar',
    '/timesheets', '/facilities', '/invoices', '/information', '/health',
    '/session-list', '/xero', '/partnerships',
  ],
  handyperson: [
    '/', '/jobs', '/calendar', '/clients', '/timesheets', '/referrals',
  ],
  activity_volunteer: [
    '/', '/session-list', '/activities', '/clients',
  ],
  befriending_coordinator: [
    '/', '/clients', '/referrals', '/activities', '/session-list', '/information',
  ],
  information_officer: [
    '/', '/clients', '/referrals', '/information', '/health', '/services',
  ],
  facilities_coordinator: [
    '/', '/facilities', '/calendar', '/staff-calendar', '/activities',
  ],
  finance_officer: [
    '/', '/invoices', '/grants', '/xero', '/suppliers', '/timesheets',
  ],
};

export function canAccess(userRole, path) {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes('*')) return true;
  // Check exact match or prefix match for nested routes
  return permissions.some(p => p === path || (p !== '/' && path.startsWith(p)));
}

export function getNavItemsForRole(role, allNavItems) {
  if (!role) return allNavItems;
  return allNavItems.filter(item => canAccess(role, item.path));
}