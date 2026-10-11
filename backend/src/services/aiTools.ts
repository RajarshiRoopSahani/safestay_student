import { z } from "zod";
import { prisma } from "../config/prisma";
import { AiTool } from "./aiClient";
import { compareProperties, findProperties, searchInputSchema } from "./aiDataService";

export const AI_TOOLS: AiTool[] = [
  {
    name: "search_properties",
    description:
      "Search SafeStay properties in the database. Use 'type' for hostel/PG/room/flat, and 'q' only for an area, city or property name. Use collegeName to get distances from a college. Returns real data only.",
    input_schema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Area, city or property name, e.g. 'Aliganj'" },
        maxRent: { type: "integer", description: "Maximum monthly rent in INR" },
        minRent: { type: "integer" },
        type: { type: "string", enum: ["HOSTEL", "PG", "ROOM", "FLAT"] },
        roomType: { type: "string", enum: ["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"] },
        mealsIncluded: { type: "boolean" },
        wifi: { type: "boolean" },
        ac: { type: "boolean" },
        attachedBathroom: { type: "boolean" },
        parking: { type: "boolean" },
        cctvListed: { type: "boolean" },
        furnished: { type: "boolean" },
        availableOnly: { type: "boolean" },
        collegeName: { type: "string", description: "Full or partial college name (use list_colleges first if unsure)" },
        maxDistanceKm: { type: "number", description: "Only works together with collegeName" },
        sort: { type: "string", enum: ["rent_asc", "rating_desc", "nearest", "reviews_desc"] },
        limit: { type: "integer", description: "1 to 8, default 5" },
      },
    },
  },
  {
    name: "compare_properties",
    description: "Compare 2 to 4 properties side by side. Use ids returned by search_properties.",
    input_schema: {
      type: "object",
      properties: { propertyIds: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } },
      required: ["propertyIds"],
    },
  },
  {
    name: "list_colleges",
    description: "List the colleges known to SafeStay (names and cities).",
    input_schema: { type: "object", properties: {} },
  },
];

const compareSchema = z.object({ propertyIds: z.array(z.string()).min(2).max(4) });

export async function runTool(name: string, input: unknown): Promise<unknown> {
  if (name === "search_properties") {
    const parsed = searchInputSchema.safeParse(input ?? {});
    if (!parsed.success) return { error: "Invalid search input", details: parsed.error.flatten().fieldErrors };
    return findProperties(parsed.data);
  }
  if (name === "compare_properties") {
    const parsed = compareSchema.safeParse(input ?? {});
    if (!parsed.success) return { error: "Provide 2 to 4 propertyIds" };
    return compareProperties(parsed.data.propertyIds);
  }
  if (name === "list_colleges") {
    const colleges = await prisma.college.findMany({ select: { name: true, city: true }, orderBy: { name: "asc" } });
    return { colleges };
  }
  return { error: `Unknown tool: ${name}` };
}
