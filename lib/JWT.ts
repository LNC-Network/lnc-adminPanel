import { jwtVerify as joseVerify } from "jose";

export interface JWTPayload {
  [key: string]: string;
}

async function tokenVerify(token: string, secret: string | Uint8Array) {
  try {
    const secretBuffer =
      typeof secret === "string" ? new TextEncoder().encode(secret) : secret;

    const result = await joseVerify(token, secretBuffer);

    return result.payload;
  } catch (error) {
    if (error instanceof Error) {
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
// server side token validation
export async function isValidToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    await tokenVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
