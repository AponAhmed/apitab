export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/** A named set of variables, e.g. Development / Staging / Production. */
export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
  createdAt: number;
  updatedAt: number;
}
