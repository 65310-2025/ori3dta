/**
 * Type definitions for frontend ONLY. Type defs for client <-> server communication are in
 * the dto folder (shared between client and server)
 */

export interface AuthContextValue {
  userId: string | undefined;
  handleLogin: (credentialResponse: any) => void;
  handleLogout: () => void;
}
