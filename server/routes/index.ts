import express from 'express';
import { Request, Response } from 'express';
const router = express.Router();

// Root path response
router.get("/", (req: Request, res: Response) => {
  res.status(200).send("Welcome to Your Website!");
});

router.get("/ping", (req: Request, res: Response) => {
  res.status(200).send("pong");
});

export default router;