// Shapes returned by the FanHub Org Auth API (data[0] of the response envelope).

export interface AuthOrganization {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// signin / signup payload — includes the organization.
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  organization: AuthOrganization;
}

// refresh payload — tokens only.
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
