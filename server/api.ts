/*
|--------------------------------------------------------------------------
| api.ts -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

import express, { Request, Response } from "express";
import { Socket as SocketIO } from "socket.io";

// import authentication library
import { login, logout } from "./auth";

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
import socketManager from "./server-socket";

router.post("/login", login);
router.post("/logout", logout);
router.get("/whoami", (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.send({});
    return;
  }

  res.send(req.user);
});

router.post("/initsocket", (req: Request, res: Response) => {
  // do nothing if user not logged in
  if (req.user) {
    const socket : SocketIO | undefined = socketManager.getSocketFromSocketID(req.body.socketid);
    if (!socket) {
      console.log("socket not found");
      res.status(404).send({ msg: "socket not found" });
      return;
    }
    socketManager.addUser(req.user, socket);
  }
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// anything else falls to this "not found" case
router.all("*", (req: Request, res: Response) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

export default router;
