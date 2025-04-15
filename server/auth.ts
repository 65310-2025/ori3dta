import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client, TokenPayload } from "google-auth-library";

import User from "./models/user";
import { IGoogleUser, ISession, IUser } from "./types/types";

// create a new OAuth client used to verify google sign-in
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// accepts a login token from the frontend, and verifies that it's legit
function verify(token: string): Promise<TokenPayload | undefined> {
  return client
    .verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    .then((ticket) => ticket.getPayload());
}

// gets user from DB, or makes a new account if it doesn't exist yet
function getOrCreateUser(user: IGoogleUser): Promise<IUser> {
  // the "sub" field means "subject", which is a unique identifier for each user
  return User.findOne({ googleid: user.sub }).then((existingUser) => {
    if (existingUser) return existingUser;

    const newUser = new User({
      name: user.name,
      googleid: user.sub,
    });

    return newUser.save();
  });
}

function login(req: Request, res: Response) {
  verify(req.body.token)
    .then((user) => {
      if (user) {
        return getOrCreateUser(user as IGoogleUser);
      } else {
        throw new Error("User verification failed");
      }
    })
    .then((user) => {
      // persist user in the session
      (req.session as ISession).user = user;
      res.send(user);
    })
    .catch((err) => {
      console.log(`Failed to log in: ${err}`);
      res.status(401).send({ err });
    });
}

function logout(req: Request, res: Response) {
  (req.session as ISession).user = undefined;
  res.send({});
}

function populateCurrentUser(req: Request, res: Response, next: NextFunction) {
  // simply populate "req.user" for convenience
  req.user = (req.session as ISession).user;
  next();
}

function ensureLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).send({ err: "not logged in" });
  }
  next();
}

export { login, logout, populateCurrentUser, ensureLoggedIn };
