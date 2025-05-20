import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthenticatedRequestPayload {
  sub: string; // profile_id
  username: string;
  role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

export async function getProfileIdFromAuth(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET!
    ) as AuthenticatedRequestPayload;
    return decoded.sub; // Este es el profile_id
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
