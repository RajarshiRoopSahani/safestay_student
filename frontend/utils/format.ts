export function formatRent(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDistance(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  return `${km} km`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PROPERTY_TYPE_LABEL: Record<string, string> = {
  HOSTEL: "Hostel",
  PG: "PG",
  ROOM: "Room",
  FLAT: "Flat",
};

export const ROOM_TYPE_LABEL: Record<string, string> = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TRIPLE: "Triple",
  DORMITORY: "Dormitory",
};

export const PHOTO_CATEGORY_LABEL: Record<string, string> = {
  ROOM: "Room",
  BATHROOM: "Bathroom",
  BUILDING: "Building",
  COMMON_AREA: "Common area",
  ENTRANCE: "Entrance",
  FURNITURE: "Furniture",
  SURROUNDINGS: "Surroundings",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

export const REPORT_TYPE_LABEL: Record<string, string> = {
  FAKE_PROPERTY: "Fake property",
  INCORRECT_INFO: "Incorrect information",
  MISLEADING_INFO: "Misleading information",
  INAPPROPRIATE_PHOTO: "Inappropriate photo",
  SPAM: "Spam",
  PRIVACY_ISSUE: "Privacy issue",
  OTHER: "Other",
};

// Move-in dates are stored as plain dates (UTC midnight), so show them in UTC to avoid off-by-one days.
export function formatDateUtc(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
