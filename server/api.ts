import express, { Request, Response } from "express";
import { Socket as SocketIO } from "socket.io";

import { DesignMetadataDto, ServerCPDto } from "../dto/dto";
import { login, logout } from "./auth";
import { layersolverHandler } from "./layersolver";
import CP, { ICP } from "./models/cp";
import DesignMetadata from "./models/designMetadata";
import User from "./models/user";
import socketManager from "./server-socket";

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

router.post("/login", login);

router.post("/logout", logout);

router.get("/whoami", (req: Request, res: Response) => {
  if (!req.user) {
    res.send({});
    return;
  }
  res.send(req.user);
});

router.post("/layersolver", layersolverHandler);

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
    const designs = await DesignMetadata.find({
      creatorID: req.user._id,
    }).lean();
    const creator = await User.findById(req.user._id).lean(); // Get creator's name

    if (!creator) {
      res.status(404).send({ msg: "Creator not found" });
      return;
    }

    // Combine design data with the creator's name
    const designsWithName: Array<DesignMetadataDto> = designs.map((design) => ({
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
    const newCP = new CP({
      vertices_coords: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      edges_vertices: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
      edges_assignment: ["B", "B", "B", "B"],
      edges_foldAngle: [0, 0, 0, 0],
    });
    const cpDocument: ICP = await newCP.save();
    const cpID = cpDocument._id;

    const newDesign = new DesignMetadata({
      ...req.body,
      creatorID: req.user._id,
      dateCreated: new Date(),
      dateLastModified: new Date(),
      writeAccess: [req.user._id],
      readAccess: [req.user._id],
      cpID: cpID,
    });

    await newDesign.save();
    res.status(201).send(newDesign);
  } catch (error) {
    console.error("Failed to create new design:", error);
    res.status(500).send({ msg: "Failed to create new design" });
  }
});

router.get("/designs/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.status(401).send({ msg: "Unauthorized" });
    return;
  }

  // TODO: consider outlining into its own function
  const metadata = await DesignMetadata.find({
    cpID: req.params.id,
  });
  if (!metadata || !metadata[0].readAccess.includes(req.user._id)) {
    res.status(403).send({ msg: "Forbidden" });
    return;
  }

  const design = await CP.findById(req.params.id);
  if (!design) {
    res.status(404).send({ msg: "Design not found" });
    return;
  }

  const designDtoObj = design as ServerCPDto;
  res.send(designDtoObj);
});

router.post("/designs/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.status(401).send({ msg: "Unauthorized" });
    return;
  }

  const metadata = await DesignMetadata.find({
    cpID: req.params.id,
  });
  if (!metadata || !metadata[0].writeAccess.includes(req.user._id)) {
    res.status(403).send({ msg: "Forbidden" });
    return;
  }

  const design = await CP.findById(req.params.id);
  if (!design) {
    res.status(404).send({ msg: "Design not found" });
    return;
  }

  // Update the design with the new data
  design.vertices_coords = req.body.vertices_coords;
  design.edges_vertices = req.body.edges_vertices;
  design.edges_assignment = req.body.edges_assignment;
  design.edges_foldAngle = req.body.edges_foldAngle;
  await design.save();
  // Update the metadata with the new data
  metadata[0].dateLastModified = new Date();
  await metadata[0].save();

  res.send(design);
});

router.delete("/designs/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    // not logged in
    res.status(401).send({ msg: "Unauthorized" });
    return;
  }

  const design = await DesignMetadata.findById(req.params.id);
  if (!design || design.creatorID !== req.user._id) {
    res.status(403).send({ msg: "Forbidden" });
    return;
  }

  const cp = await CP.findById(design.cpID);
  await design.deleteOne();
  await cp?.deleteOne();
  res.send({ msg: "Design deleted" });
});

// anything else falls to this "not found" case
router.all("*", (req: Request, res: Response) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

export default router;
