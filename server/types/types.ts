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
