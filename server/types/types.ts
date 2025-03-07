/**
 * Types for internal server use ONLY.
 * Types for transfer between frontend <-> backend are in the dto folder (shared between client and server),
 * and database types are defined in the corresponding model files.
 */

// extend Request object to include user property (used for auth)
declare module "express-serve-static-core" {
  interface Request {
    user?: IUser | null;
  }
}

export interface IGoogleUser {
  name: string;
  sub: string;
}

export interface ISession {
  user?: IUser | null;
}

export interface IUser {
  _id: string;
  name: string;
  googleid: string;
}

export interface ISocket {
  id: string;
  disconnect: () => void;
}
