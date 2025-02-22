export interface User {
  _id: string;
}

export interface AuthContextValue {
  userId: string | undefined;
  handleLogin: (credentialResponse: any) => void;
  handleLogout: () => void;
}
