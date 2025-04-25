import { jwtVerify as joseVerify } from "jose";

export interface JWTPayload {
  [key: string]: string; // Optional: refine this based on expected payload properties
}

export async function jwtVerify(token: string, secret: string | Uint8Array) {
  try {
    // Use secret as Uint8Array
    const secretBuffer =
      typeof secret === "string" ? new TextEncoder().encode(secret) : secret;

    const result = await joseVerify(token, secretBuffer);

    return result.payload;
  } catch (error: unknown) {
    // Narrow the type of `error` to `Error`
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.name === "JWTExpired") throw new Error("Token expired");
      if (error.name === "JWTMalformed") throw new Error("Malformed token");
      if (error.name === "JWTInvalid")
        throw new Error("Invalid token signature");

      throw new Error(
        `Token verification failed: ${error.message || "Unknown error"}`
      );
    } else {
      throw new Error("Unknown error occurred during token verification");
    }
  }
}

export async function isValidToken(
  token: string,
  secret: string | Uint8Array
): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false; // Invalid token if error is thrown
  }
}

export default async function protectPath(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!token) return { success: false, error: "No token provided" };
  if (!secret) return { success: false, error: "JWT secret is missing" };

  try {
    const user = await jwtVerify(token, secret);
    return { success: true, user };
  } catch (e) {
    const error = e as Error;
    return { success: false, error: error.message || "Invalid token" };
  }
}
