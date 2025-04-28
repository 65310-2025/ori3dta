import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import http from "http";
import mongoose from "mongoose";
import path from "path";

import api from "./api";
import { populateCurrentUser } from "./auth";
import socketManager from "./server-socket";
import { checkRoutes, checkSetup } from "./validator";

checkSetup();

dotenv.config();

// TODO change connection URL after setting up your team database
const mongoConnectionURL = process.env.MONGO_SRV as string;
// TODO change database name to the name you chose
const databaseName = "Cluster0";

// mongoose 7 warning
mongoose.set("strictQuery", false);

mongoose
  .connect(mongoConnectionURL, { dbName: databaseName })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

const app = express();
app.use(checkRoutes);

// Set up request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// allow us to process POST requests
app.use(express.json());

// set up a session, which will persist login data across requests
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
  }),
);

// this checks if the user is logged in, and populates "req.user"
app.use(populateCurrentUser);

app.use("/api", api);

// load the compiled react files, which will serve /index.html and /bundle.js
const reactPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(reactPath));

// for all other routes, render index.html and let react router handle it
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(reactPath, "index.html"), (err: any) => {
    if (err) {
      console.log("Error sending client/dist/index.html:", err.status || 500);
      res
        .status(err.status || 500)
        .send(
          "Error sending client/dist/index.html - have you run `npm run build`?",
        );
    }
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  if (status === 500) {
    console.log("The server errored when processing a request!");
    console.log(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});

// hardcode port to 3000 for now
const port = 3000;
const server = http.createServer(app);
socketManager.init(server);

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
