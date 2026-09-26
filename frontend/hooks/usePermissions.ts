import { useAuth } from './useAuth';

export function usePermissions() {
  const { dbUser } = useAuth();

  const hasPermission = (permissionCode: string): boolean => {
    if (!dbUser) return false;
    
    // SaaS Admins and Owners inherently have full access within their scope
    if (dbUser.userType === 'SAAS_ADMIN' || dbUser.userType === 'OWNER') {
      return true;
    }

    // Staff are evaluated strictly on their assigned role permissions
    const userPermissions: string[] = dbUser.permissions || [];
    
    // Check if the user has the exact permission
    return userPermissions.includes(permissionCode);
  };

  return { hasPermission };
}
