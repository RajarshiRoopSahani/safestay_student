// Neutral wording only. One photo never labels a property as "bad".
export function photoCaption(p: { isOfficial: boolean; category: string; createdAt: Date }): string {
  if (p.isOfficial) return "Official Photo";
  if (p.category === "MAINTENANCE") return "Reported Maintenance Issue";
  const ageDays = (Date.now() - p.createdAt.getTime()) / 86400000;
  return ageDays <= 30 ? "Recent Community Upload" : "Community Photo";
}

export const PHOTO_NOTICE =
  "Community photos are shared by students and may not show the current condition. Please visit and verify the property personally before booking.";
