// auth.ts
import { jwtVerify as joseVerify } from "jose";

export interface JWTPayload {
  [key: string]: any;
}

export interface JWTVerifyResult {
  payload: JWTPayload;
  protectedHeader: {
    alg: string;
    [key: string]: any;
  };
}

export async function jwtVerify(
  token: string,
  secret: string | Uint8Array
): Promise<JWTVerifyResult> {
  try {
    const secretBuffer =
      typeof secret === "string" ? new TextEncoder().encode(secret) : secret;

    const result = await joseVerify(token, secretBuffer);

    return {
      payload: result.payload as JWTPayload,
      protectedHeader: result.protectedHeader,
    };
  } catch (error) {
    const err = error as Error;

    if (err.name === "JWTExpired") {
      throw new Error("Token has expired");
    } else if (err.name === "JWTMalformed") {
      throw new Error("Token is malformed");
    } else if (err.name === "JWTInvalid") {
      throw new Error("Token signature is invalid");
    }

    throw new Error(
      `Token verification failed: ${err.message || "Unknown error"}`
    );
  }
}

export async function isValidToken(
  token: string,
  secret: string | Uint8Array
): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    return false;
  }
}

export default async function protectPath(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!token) return { success: false, error: "No token provided" };
    if (!secret) return { success: false, error: "JWT secret is missing" };

    const verified = await jwtVerify(token, secret);

    return {
      success: true,
      user: verified.payload,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}
