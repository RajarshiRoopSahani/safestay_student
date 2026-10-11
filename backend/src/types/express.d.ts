declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "STUDENT" | "OWNER" | "ADMIN" };
    }
  }
}
export {};
