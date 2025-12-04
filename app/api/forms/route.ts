import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// GET - Fetch all forms or a specific form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (formId) {
      // Fetch specific form with submissions
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (formError) {
        return NextResponse.json(
          { error: "Form not found" },
          { status: 404 }
        );
      }

      // Fetch submissions for this form
      const { data: submissions, error: subError } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });

      if (subError) {
        console.error("Submissions fetch error:", subError);
      }

      return NextResponse.json({
        form,
        submissions: submissions || [],
      });
    }

    // Fetch all forms
    const { data: forms, error } = await supabase
      .from("forms")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Forms fetch error:", error);
      // Return empty array if table doesn't exist
      if (error.code === "PGRST205" || error.message?.includes("Could not find")) {
        return NextResponse.json({ forms: [] });
      }
      return NextResponse.json(
        { error: "Failed to fetch forms" },
        { status: 400 }
      );
    }

    return NextResponse.json({ forms: forms || [] });
  } catch (error) {
    console.error("Get forms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new form
export async function POST(request: NextRequest) {
  try {
    const { name, description, fields, createdBy } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Form name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("forms")
      .insert({
        name,
        description: description || "",
        fields: fields || [],
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create form error:", error);
      return NextResponse.json(
        { error: "Failed to create form" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      form: data,
    });
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing form
export async function PATCH(request: NextRequest) {
  try {
    const { formId, name, description, fields, isActive } = await request.json();

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from("forms")
      .update(updateData)
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      console.error("Update form error:", error);
      return NextResponse.json(
        { error: "Failed to update form" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      form: data,
    });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a form
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("forms")
      .delete()
      .eq("id", formId);

    if (error) {
      console.error("Delete form error:", error);
      return NextResponse.json(
        { error: "Failed to delete form" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
