import accessData from '../access.json';

export interface AccessConfig {
  roles: Record<string, string[]>;
  users: Record<string, string | string[]>;
  defaultRole: string;
}

export const accessConfig: AccessConfig = accessData as AccessConfig;

export function getAllowedPages(config: AccessConfig, email: string): string[] {
  const entry = config.users[email.toLowerCase()];
  const userRoles: string[] = entry
    ? (Array.isArray(entry) ? entry : [entry])
    : [config.defaultRole];
  const pages = new Set<string>();
  for (const role of userRoles) {
    for (const page of config.roles[role] ?? []) {
      pages.add(page);
    }
  }
  return [...pages];
}

export function isEmailAllowed(config: AccessConfig, email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return lowerEmail in config.users || !!config.defaultRole;
}
