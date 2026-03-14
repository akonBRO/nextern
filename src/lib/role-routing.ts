export const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  employer: '/employer/dashboard',
  advisor: '/advisor/dashboard',
  dept_head: '/dept/dashboard',
  admin: '/admin/dashboard',
} as const;

export type UserRole = keyof typeof ROLE_DASHBOARDS;
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

type RoutedUser = {
  role?: UserRole;
  verificationStatus?: VerificationStatus;
};

const PENDING_APPROVAL_ROLES: UserRole[] = ['employer', 'advisor', 'dept_head'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/verify-email'];

export function getDashboardForRole(role?: UserRole) {
  return role ? ROLE_DASHBOARDS[role] : '/';
}

export function requiresAdminApproval(role?: UserRole) {
  return !!role && PENDING_APPROVAL_ROLES.includes(role);
}

export function getDefaultAuthenticatedRoute(user: RoutedUser) {
  if (!user.role) return '/';
  if (requiresAdminApproval(user.role) && user.verificationStatus !== 'approved') {
    return '/pending-approval';
  }

  return getDashboardForRole(user.role);
}

function isSafeInternalPath(path?: string | null) {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

function isAuthOnlyRoute(path: string) {
  return AUTH_ONLY_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export function getPostLoginRedirect(user: RoutedUser, callbackUrl?: string | null) {
  const defaultRoute = getDefaultAuthenticatedRoute(user);
  const safeCallbackUrl = isSafeInternalPath(callbackUrl) ? callbackUrl : null;

  if (defaultRoute === '/pending-approval') {
    return defaultRoute;
  }

  if (safeCallbackUrl && !isAuthOnlyRoute(safeCallbackUrl)) {
    return safeCallbackUrl;
  }

  return defaultRoute;
}
