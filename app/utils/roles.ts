export const ROLE_HIERARCHY = {
  'admin': 3,
  'moderator': 2,
  'contributor': 1,
} as const

export type RoleType = keyof typeof ROLE_HIERARCHY

export function getHighestRole(roles: Array<{ name: string }>) {
  if (!roles.length) return 'member'
  
  return roles.reduce((highest, current) => {
    const currentRank = ROLE_HIERARCHY[current.name as RoleType] || 0
    const highestRank = ROLE_HIERARCHY[highest as RoleType] || 0
    return currentRank > highestRank ? current.name : highest
  }, 'member' as string)
}