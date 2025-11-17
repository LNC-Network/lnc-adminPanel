// Role-based permissions configuration

export const ROLES = {
  SUPER_ADMIN: 'super admin',
  ADMISTATER: 'admistater',
  DEV_TEAM_ADMIN: 'dev team admin',
  SOCIAL_MEDIA_TEAM_ADMIN: 'social media team admin',
  PR_TEAM_ADMIN: 'pr & outreach team admin',
  DESIGN_TEAM_ADMIN: 'design team admin',
  DEV_MEMBER: 'dev member',
  SOCIAL_MEDIA_MEMBER: 'social media member',
  PR_MEMBER: 'pr & outreach member',
  DESIGN_MEMBER: 'design member',
} as const;

export const TEAMS = {
  DEV: 'dev',
  SOCIAL_MEDIA: 'social media',
  PR_OUTREACH: 'pr & outreach',
  DESIGN: 'design',
} as const;

// Map team admins to their teams
export const TEAM_ADMIN_MAP: Record<string, string> = {
  [ROLES.DEV_TEAM_ADMIN]: TEAMS.DEV,
  [ROLES.SOCIAL_MEDIA_TEAM_ADMIN]: TEAMS.SOCIAL_MEDIA,
  [ROLES.PR_TEAM_ADMIN]: TEAMS.PR_OUTREACH,
  [ROLES.DESIGN_TEAM_ADMIN]: TEAMS.DESIGN,
};

// Map team members to their teams
export const TEAM_MEMBER_MAP: Record<string, string> = {
  [ROLES.DEV_MEMBER]: TEAMS.DEV,
  [ROLES.SOCIAL_MEDIA_MEMBER]: TEAMS.SOCIAL_MEDIA,
  [ROLES.PR_MEMBER]: TEAMS.PR_OUTREACH,
  [ROLES.DESIGN_MEMBER]: TEAMS.DESIGN,
};

// Check if user is Super Admin
export function isSuperAdmin(roles: string[]): boolean {
  return roles.includes(ROLES.SUPER_ADMIN);
}

// Check if user is Admistater (view-only admin)
export function isAdmistater(roles: string[]): boolean {
  return roles.includes(ROLES.ADMISTATER);
}

// Check if user is any team admin
export function isTeamAdmin(roles: string[]): boolean {
  return roles.some(role => 
    role.endsWith('team admin')
  );
}

// Get user's team based on their role
export function getUserTeam(roles: string[]): string | null {
  // Check team admin roles first
  for (const role of roles) {
    if (role in TEAM_ADMIN_MAP) {
      return TEAM_ADMIN_MAP[role];
    }
  }
  
  // Check team member roles
  for (const role of roles) {
    if (role in TEAM_MEMBER_MAP) {
      return TEAM_MEMBER_MAP[role];
    }
  }
  
  return null;
}

// Check if user can edit/modify
export function canEdit(roles: string[]): boolean {
  // Only Super Admin and Team Admins can edit
  return isSuperAdmin(roles) || isTeamAdmin(roles);
}

// Check if user can view everything
export function canViewAll(roles: string[]): boolean {
  return isSuperAdmin(roles) || isAdmistater(roles);
}

// Check if user can access database
export function canAccessDatabase(roles: string[]): boolean {
  return isSuperAdmin(roles); // Only Super Admin can access database
}

// Check if user can access settings
export function canAccessSettings(roles: string[]): boolean {
  return isSuperAdmin(roles); // Only Super Admin can manage users
}

// Check if user can access tickets
export function canAccessTickets(roles: string[]): boolean {
  // Super Admin, Admistater, and Dev team members
  return isSuperAdmin(roles) || 
         isAdmistater(roles) || 
         roles.includes(ROLES.DEV_TEAM_ADMIN) ||
         roles.includes(ROLES.DEV_MEMBER);
}

// Check if user can manage chat groups
export function canManageChatGroups(roles: string[]): boolean {
  // Super Admin and Team Admins can create groups and add members
  return isSuperAdmin(roles) || isTeamAdmin(roles);
}

// Get team-specific access for content/forms
export function getTeamAccess(roles: string[]): {
  canView: boolean;
  canEdit: boolean;
  team: string | null;
} {
  const team = getUserTeam(roles);
  
  return {
    canView: canViewAll(roles) || team !== null,
    canEdit: canEdit(roles),
    team,
  };
}
