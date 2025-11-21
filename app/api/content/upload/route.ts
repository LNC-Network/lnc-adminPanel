import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { uploadToCloudinary, isImageFile, isVideoFile } from "@/lib/cloudinary";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Upload content to Cloudinary
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
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file || !category || !title) {
      return NextResponse.json(
        { error: "File, title, and category are required" },
        { status: 400 }
      );
    }

    // Check file size (max 500MB for content uploads)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
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
      'content'
    );

    // Parse tags if provided
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Save to database
    const { data: content, error: dbError } = await supabase
      .from("content")
      .insert({
        user_id: userId,
        title,
        description,
        category,
        tags: parsedTags,
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

    if (dbError) throw dbError;

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Content upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload content" },
      { status: 500 }
    );
  }
}

// GET - Fetch all content
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.sub;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("content")
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          email
        )
      `)
      .eq("user_id", userId)  // Filter by logged-in user
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: content, error } = await query;

    if (error) throw error;

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Fetch content error:", error);
    
    // Handle JWT expiration
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: "jwt expired" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete content
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Soft delete (keep file in Cloudinary) - only allow users to delete their own content
    const { error } = await supabase
      .from("content")
      .update({ is_deleted: true })
      .eq("id", id)
      .eq("user_id", userId);  // Ensure user can only delete their own content

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete content error:", error);
    
    // Handle JWT expiration
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: "jwt expired" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to delete content" },
      { status: 500 }
    );
  }
}
