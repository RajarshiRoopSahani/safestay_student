import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const listSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]).optional(),
  type: z
    .enum(["FAKE_PROPERTY", "INCORRECT_INFO", "MISLEADING_INFO", "INAPPROPRIATE_PHOTO", "SPAM", "PRIVACY_ISSUE", "OTHER"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});

export async function adminListReports(req: Request, res: Response) {
  const { status, type, page, limit } = listSchema.parse(req.query);
  const where: Prisma.ReportWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        details: true,
        status: true,
        createdAt: true,
        reporter: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, area: true, isActive: true } },
        photo: { select: { id: true, url: true, status: true, category: true } },
        review: { select: { id: true, text: true, rating: true, status: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), reports });
}

export async function adminUpdateReport(req: Request, res: Response) {
  const id = String(req.params.id);
  const { status } = updateSchema.parse(req.body);

  const existing = await prisma.report.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Report not found");

  const report = await prisma.report.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
  res.json({ report, message: `Report marked ${status}` });
}
