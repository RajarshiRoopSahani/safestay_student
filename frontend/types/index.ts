export type Role = "STUDENT" | "ADMIN";
export type PropertyType = "HOSTEL" | "PG" | "ROOM" | "FLAT";
export type RoomType = "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type PhotoCategory =
  | "ROOM" | "BATHROOM" | "BUILDING" | "COMMON_AREA" | "ENTRANCE"
  | "FURNITURE" | "SURROUNDINGS" | "MAINTENANCE" | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface Room {
  id: string;
  type: RoomType;
  rent: number;
  totalBeds: number;
  availableBeds: number;
}

export interface Photo {
  id: string;
  url: string;
  category: PhotoCategory;
  isOfficial: boolean;
  createdAt: string;
  label: string;
  aiObservation?: string | null;
}

export interface BuildingSummary {
  id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  description: string;
  buildingId: string | null;
  building: BuildingSummary | null;
  address: string;
  city: string;
  area: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
  rent: number;
  deposit: number;
  foodIncluded: boolean;
  wifi: boolean;
  ac: boolean;
  cooler: boolean;
  attachedBathroom: boolean;
  laundry: boolean;
  parking: boolean;
  cctv: boolean;
  furnished: boolean;
  electricityIncluded: boolean;
  waterInfo: string | null;
  rules: string | null;
  securityInfo: string | null;
  nearbyPlaces: string | null;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  amenities: string[];
  rooms: Room[];
  roomTypes: RoomType[];
  availableBeds: number;
  availability: "Available" | "Full";
  photos: Photo[];
  rating: number | null;
  reviewCount: number;
  ratingLabel: string;
  distanceKm: number | null;
  nearestCollege: { name: string; distanceKm: number } | null;
}

export interface College {
  id: string;
  name: string;
  city: string;
  distanceKm?: number;
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sort: string;
  reference: { type: "college" | "location"; name?: string; radiusKm: number | null } | null;
  results: Property[];
  nearby: {
    countsByType: Record<PropertyType, number>;
    buildings: { id: string; name: string; address: string; area: string; city: string }[];
    colleges: College[];
    note: string;
  };
}

export type ReportType =
  | "FAKE_PROPERTY" | "INCORRECT_INFO" | "MISLEADING_INFO"
  | "INAPPROPRIATE_PHOTO" | "SPAM" | "PRIVACY_ISSUE" | "OTHER";

export interface PropertyDetail extends Omit<Property, "photos"> {
  officialPhotos: Photo[];
  communityPhotos: Photo[];
}

export interface PropertyDetailResponse {
  property: PropertyDetail;
  nearbyColleges: College[];
  sameBuilding: Property[];
  similarNearby: Property[];
  notice: string;
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  verified: boolean;
  createdAt: string;
  label: string;
  status?: ModerationStatus;
}

export interface ReviewsResponse {
  rating: number | null;
  reviewCount: number;
  ratingLabel: string;
  distribution: Record<number, number>;
  total: number;
  page: number;
  totalPages: number;
  reviews: Review[];
  myReview: Review | null;
}

export interface RecommendationItem {
  property: { id: string; name: string };
  matchScore: number;
  reasons: string[];
  caveats: string[];
  explanation: string;
}

export interface RecommendationResponse {
  total: number;
  recommendations: RecommendationItem[];
  summary: string | null;
  note: string;
}

export interface Booking {
  id: string;
  roomType: RoomType;
  moveInDate: string;
  occupants: number;
  contactName: string;
  contactPhone: string;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
  property: { id: string; name: string; type: PropertyType; area: string; city: string; rent: number };
  user?: { id: string; name: string; email: string };
}

export interface MyPhoto {
  id: string;
  url: string;
  category: PhotoCategory;
  status: ModerationStatus;
  createdAt: string;
  property: { id: string; name: string };
}

export interface ChatProperty {
  id: string;
  name: string;
  type: PropertyType;
  area: string;
  city: string;
  rent: number;
  deposit: number;
  ratingNote: string;
  distanceKm: number | null;
  nearestCollege: { name: string; distanceKm: number } | null;
  availability: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  properties?: ChatProperty[];
}
