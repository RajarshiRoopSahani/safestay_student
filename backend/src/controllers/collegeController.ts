import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function listColleges(_req: Request, res: Response) {
  const colleges = await prisma.college.findMany({ orderBy: { name: "asc" } });
  res.json({ colleges });
}
