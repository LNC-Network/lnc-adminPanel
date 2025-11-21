import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { uploadToCloudinary, isImageFile, isVideoFile } from "@/lib/cloudinary";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Upload media to chat
export async function POST(req: NextRequest) {
  try {
    // Verify authentication (support both cookie and header)
    const cookieStore = await cookies();
    let token = cookieStore.get("access_token")?.value;
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.sub;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string;
    const messageText = formData.get("message") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Validate file type (only images and videos)
    if (!isImageFile(file.type) && !isVideoFile(file.type)) {
      return NextResponse.json(
        { error: "Only images and videos are allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const cloudinaryFile = await uploadToCloudinary(
      buffer,
      `${Date.now()}-${file.name}`,
      file.type,
      'chat'
    );

    // Create chat message with attachment
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        group_id: groupId,
        user_id: userId,
        message: messageText || "",
        has_attachment: true,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Save attachment info
    const { data: attachment, error: attachmentError } = await supabase
      .from("chat_attachments")
      .insert({
        message_id: message.id,
        group_id: groupId,
        user_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        cloudinary_id: cloudinaryFile.publicId,
        url: cloudinaryFile.secureUrl,
        thumbnail_url: cloudinaryFile.thumbnailUrl,
        resource_type: cloudinaryFile.resourceType,
      })
      .select()
      .single();

    if (attachmentError) throw attachmentError;

    return NextResponse.json({
      message,
      attachment,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

// GET - Fetch attachments for a group
export async function GET(req: NextRequest) {
  try {
    // Verify authentication (support both cookie and header)
    const cookieStore = await cookies();
    let token = cookieStore.get("access_token")?.value;
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const { data: attachments, error } = await supabase
      .from("chat_attachments")
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          email
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error("Fetch attachments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}
