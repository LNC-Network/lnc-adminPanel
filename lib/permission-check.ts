// Permission checking utilities that query the database
// Use these for server-side permission validation

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get all permissions for a user based on their roles
 * @param userId - The user's ID
 * @returns Array of permission codes (e.g., ['user.create', 'content.read'])
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    // Query to get all permissions for a user through their roles
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_permissions (
            permissions (
              code
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    // Flatten the nested structure and extract permission codes
    const permissions = new Set<string>();
    data?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.code) {
          permissions.add(rp.permissions.code);
        }
      });
    });

    return Array.from(permissions);
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return [];
  }
}

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permissionCode - Permission code (e.g., 'user.create')
 * @returns Boolean indicating if user has the permission
 */
export async function userHasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionCode);
}

/**
 * Check if a user has any of the specified permissions
 * @param userId - The user's ID
 * @param permissionCodes - Array of permission codes
 * @returns Boolean indicating if user has at least one permission
 */
export async function userHasAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionCodes.some(code => permissions.includes(code));
}

/**
 * Check if a user has all of the specified permissions
 * @param userId - The user's ID
 * @param permissionCodes - Array of permission codes
 * @returns Boolean indicating if user has all permissions
 */
export async function userHasAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionCodes.every(code => permissions.includes(code));
}

/**
 * Permission code constants for easy reference
 */
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Content permissions
  CONTENT_CREATE: 'content.create',
  CONTENT_READ: 'content.read',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',

  // Settings permissions
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',

  // Database permissions
  DATABASE_READ: 'database.read',
  DATABASE_WRITE: 'database.write',
} as const;

// Example usage in API routes:
/*
import { userHasPermission, PERMISSIONS } from '@/lib/permission-check';

export async function POST(request: Request) {
  const userId = getUserIdFromSession(request);
  
  // Check if user can create users
  if (!await userHasPermission(userId, PERMISSIONS.USER_CREATE)) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }
  
  // Proceed with user creation
  // ...
}
*/
