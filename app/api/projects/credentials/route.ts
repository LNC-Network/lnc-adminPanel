import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET - Fetch credentials for a project (after password verification)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check user roles from JWT payload
    const roles = decoded.roles || [];
    const allowedRoles = ["dev_member", "dev_admin", "super admin", "admistater"];
    
    if (!roles.some((role: string) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Fetch credentials
    const { data: credentials, error: credError } = await supabase
      .from("env_credentials")
      .select("id, key, value, description, created_at, created_by")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (credError) {
      throw credError;
    }

    // Decrypt credential values before sending
    const decryptedCredentials = (credentials || []).map((cred) => ({
      ...cred,
      value: decrypt(cred.value),
    }));

    return NextResponse.json({ credentials: decryptedCredentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new credential (all dev team members can add)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check user roles from JWT payload
    const roles = decoded.roles || [];
    const allowedRoles = ["dev_member", "dev_admin", "super admin"];
    
    if (!roles.some((role: string) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { projectId, key, value, description } = await req.json();

    if (!projectId || !key || !value) {
      return NextResponse.json({ error: "Project ID, key, and value are required" }, { status: 400 });
    }

    // Encrypt credential value before storing
    const encryptedValue = encrypt(value);

    // Add credential
    const { data: credential, error: createError } = await supabase
      .from("env_credentials")
      .insert([{ project_id: projectId, key, value: encryptedValue, description, created_by: decoded.sub }])
      .select("id, key, value, description, created_at")
      .single();

    if (createError) {
      throw createError;
    }

    // Decrypt value before returning
    const decryptedCredential = {
      ...credential,
      value: decrypt(credential.value),
    };

    return NextResponse.json({ 
      message: "Credential added successfully",
      credential: decryptedCredential
    });
  } catch (error) {
    console.error("Error adding credential:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete credential (dev_admin, super admin only)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check user roles from JWT payload
    const roles = decoded.roles || [];
    const allowedRoles = ["dev_admin", "super admin"];
    
    if (!roles.some((role: string) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Only dev_admin and super admin can delete credentials" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 });
    }

    // Delete credential
    const { error: deleteError } = await supabase
      .from("env_credentials")
      .delete()
      .eq("id", credentialId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: "Credential deleted successfully" });
  } catch (error) {
    console.error("Error deleting credential:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
