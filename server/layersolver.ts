import dotenv from "dotenv";
import tmp from "tmp"
import { writeFile } from "fs"
import { execFileSync } from "child_process"

import { NextFunction, Request, Response } from "express";

dotenv.config();

const layerOrderExe = process.env.LAYER_ORDER_EXE as string;

function layersolverHandler(req: Request, res: Response) {
  tmp.file((err, path, fd, cleanupCallback) => {
    if (err) {
      res.status(200).json({note: "Failed to write to allocate temp", err: err});
      cleanupCallback();
      return;
    }

    writeFile(fd, JSON.stringify(req.body), (err) => {
      if (err) {
        res.status(200).json({note: "Failed to write to temp", path: path, err: err});
        cleanupCallback();
        return;
      }

      let output = execFileSync(layerOrderExe, [path]);
      res.status(200).send(output);
      cleanupCallback();
    });
  });
}

export {layersolverHandler};
