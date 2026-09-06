/**
 * Two layers of access control.
 *
 * 1. Permissions — what a user may *do*. A role carries a default set; an
 *    administrator can override any individual user's set from the Users page.
 * 2. Scope — what data a user may *see*. Either a single customer, a list of
 *    assigned sites, or everything. Scope is independent of permissions: an
 *    engineer may record service, but only on their own sites.
 */

export const PERMISSIONS = [
  { key: 'equipment.create', group: 'Equipment', label: 'Add equipment' },
  { key: 'equipment.edit', group: 'Equipment', label: 'Edit equipment details' },
  { key: 'equipment.delete', group: 'Equipment', label: 'Delete equipment' },
  { key: 'service.create', group: 'Service', label: 'Record service and inspections' },
  { key: 'request.create', group: 'Service', label: 'Raise service requests' },
  { key: 'labels.print', group: 'Records', label: 'Generate and print QR labels' },
  { key: 'reports.export', group: 'Records', label: 'Export reports' },
  { key: 'customers.manage', group: 'Administration', label: 'Manage customers and sites' },
  { key: 'users.manage', group: 'Administration', label: 'Manage user accounts' },
  { key: 'audit.view', group: 'Administration', label: 'View the audit trail' },
  { key: 'backup.manage', group: 'Administration', label: 'Back up and restore data' }
]

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key)

export const ROLES = ['Administrator', 'Manager', 'Service Engineer', 'Client User', 'Viewer']

export const ROLE_DEFAULTS = {
  Administrator: PERMISSION_KEYS,
  Manager: [
    'equipment.create', 'equipment.edit',
    'service.create', 'request.create',
    'labels.print', 'reports.export',
    'customers.manage', 'audit.view'
  ],
  'Service Engineer': ['service.create', 'labels.print', 'reports.export'],
  'Client User': ['request.create', 'reports.export'],
  Viewer: ['reports.export']
}

/** The set actually in force: an explicit override, else the role default. */
export function effectivePermissions(user) {
  if (!user || user.active === false) return []
  if (Array.isArray(user.permissions)) return user.permissions
  return ROLE_DEFAULTS[user.role] || []
}

export function hasPermission(user, key) {
  return effectivePermissions(user).includes(key)
}

/** True when the user's permissions differ from their role's defaults. */
export function isCustomised(user) {
  if (!Array.isArray(user?.permissions)) return false
  const base = ROLE_DEFAULTS[user.role] || []
  return user.permissions.length !== base.length ||
    user.permissions.some((p) => !base.includes(p))
}

export function describeScope(user, customerName) {
  if (!user) return ''
  if (user.scopeCustomer) return `Scoped to ${customerName || 'one customer'}`
  if (user.scopeSites?.length) return `Scoped to ${user.scopeSites.length} assigned sites`
  return 'Full access — all customers and sites'
}
