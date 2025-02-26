import express, { Request, Response } from "express";
import { Socket as SocketIO } from "socket.io";
import { login, logout } from "./auth";
import socketManager from "./server-socket";
import DesignMetadata from "./models/designMetadata";
import User from "./models/user";
import CP, { ICP } from "./models/cp"; // Import the CP model and interface
import { DesignMetadataDto } from "../dto/dto"; // Import the DTO type

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

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
    const socket: SocketIO | undefined = socketManager.getSocketFromSocketID(
      req.body.socketid,
    );
    if (!socket) {
      console.log("socket not found");
      res.status(404).send({ msg: "Socket not found" });
      return;
    }
    socketManager.addUser(req.user, socket);
  }
  res.send({});
});

router.get("/designs", async (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.status(401).send({ msg: "Unauthorized" });
    return;
  }

  try {
    const designs = await DesignMetadata.find({ creatorID: req.user._id }).lean();
    const creator = await User.findById(req.user._id).lean(); // Get creator's name

    if (!creator) {
      res.status(404).send({ msg: "Creator not found" });
      return;
    }

    // Combine design data with the creator's name
    const designsWithName: Array<DesignMetadataDto> = designs.map(design => ({
      ...design,
      creatorName: creator.name,
    }));

    res.send(designsWithName);

  } catch (error) {
    console.error("Failed to fetch designs:", error);
    res.status(500).send({ msg: "Failed to fetch designs" });
  }
});

router.post("/designs", async (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.status(401).send({ msg: "Unauthorized" });
    return;
  }

  try {
    // Validate request body
    const { name, description } = req.body;
    if (!name || !description) {
      res.status(400).send({ msg: "Name and description are required" });
      return;
    }

    // Create new document for the CP itself
    const newCP = new CP({});
    const cpDocument: ICP = await newCP.save();
    const cpID = cpDocument._id;

    const newDesign = new DesignMetadata({
      ...req.body,
      creatorID: req.user._id,
      dateCreated: new Date(),
      dateLastModified: new Date(),
      cpID: cpID,
    });

    await newDesign.save();
    res.status(201).send(newDesign);

  } catch (error) {
    console.error("Failed to create new design:", error);
    res.status(500).send({ msg: "Failed to create new design" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req: Request, res: Response) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

export default router;
