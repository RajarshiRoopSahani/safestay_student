import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten().fieldErrors });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large. Maximum size is 5 MB."
        : err.code === "LIMIT_UNEXPECTED_FILE"
        ? "Invalid upload. Send the image in a field named 'photo'."
        : "Invalid upload";
    return res.status(400).json({ error: message });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
}
