/**
 * Mock in-memory store for admin system settings and feature flags.
 * Replace with API calls when backend is ready.
 */

export type AdminSettingsState = {
  platform: {
    userRegistrationsEnabled: boolean;
    requireEmployerVerification: boolean;
    allowMessagingFreeUsers: boolean;
    limitApplicationsPerJobSeeker: number | null; // null = no limit
  };
  featureFlags: {
    messagingEnabled: boolean;
    premiumFeaturesEnabled: boolean;
    strictModerationMode: boolean;
  };
  limits: {
    maxJobsPerEmployer: number;
    maxMessagesPerDay: number; // 0 = unlimited
  };
};

let state: AdminSettingsState = {
  platform: {
    userRegistrationsEnabled: true,
    requireEmployerVerification: false,
    allowMessagingFreeUsers: true,
    limitApplicationsPerJobSeeker: 50,
  },
  featureFlags: {
    messagingEnabled: true,
    premiumFeaturesEnabled: true,
    strictModerationMode: false,
  },
  limits: {
    maxJobsPerEmployer: 20,
    maxMessagesPerDay: 100,
  },
};

function cloneState(): AdminSettingsState {
  return JSON.parse(JSON.stringify(state));
}

/** Get current settings. Returns a copy. */
export function getAdminSettings(): AdminSettingsState {
  return cloneState();
}

/** Update platform setting: user registrations enabled/disabled. */
export function setUserRegistrationsEnabled(enabled: boolean): void {
  state.platform.userRegistrationsEnabled = enabled;
}

/** Update platform setting: require employer verification before posting jobs. */
export function setRequireEmployerVerification(required: boolean): void {
  state.platform.requireEmployerVerification = required;
}

/** Update platform setting: allow messaging for free users. */
export function setAllowMessagingFreeUsers(allow: boolean): void {
  state.platform.allowMessagingFreeUsers = allow;
}

/** Update platform setting: limit applications per job seeker (null = no limit). */
export function setLimitApplicationsPerJobSeeker(value: number | null): void {
  state.platform.limitApplicationsPerJobSeeker = value;
}

/** Update feature flag: messaging enabled. */
export function setMessagingEnabled(enabled: boolean): void {
  state.featureFlags.messagingEnabled = enabled;
}

/** Update feature flag: premium features enabled. */
export function setPremiumFeaturesEnabled(enabled: boolean): void {
  state.featureFlags.premiumFeaturesEnabled = enabled;
}

/** Update feature flag: strict moderation mode. */
export function setStrictModerationMode(enabled: boolean): void {
  state.featureFlags.strictModerationMode = enabled;
}

/** Update limit: max jobs per employer. */
export function setMaxJobsPerEmployer(value: number): void {
  state.limits.maxJobsPerEmployer = Math.max(0, Math.floor(value));
}

/** Update limit: max messages per day (0 = unlimited). */
export function setMaxMessagesPerDay(value: number): void {
  state.limits.maxMessagesPerDay = Math.max(0, Math.floor(value));
}
