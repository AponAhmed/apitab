export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * A named set of variables, e.g. Development / Staging / Production.
 * Environments are always local-only — they typically hold secrets
 * (tokens, API keys) and are never synced to the team server.
 */
export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
  createdAt: number;
  updatedAt: number;
}
