/**
 * Type definitions for frontend ONLY. Type defs for client <-> server communication are in
 * the dto folder (shared between client and server)
 */

export interface AuthContextValue {
  // undefined means login status still loading, null means not logged in
  userId: string | null | undefined;
  handleLogin: (credentialResponse: any) => void;
  handleLogout: () => void;
}
