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

// POST - Submit form data
export async function POST(request: NextRequest) {
  try {
    const { formId, data, submittedBy } = await request.json();

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    // Verify form exists
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, is_active")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Only check is_active if the column exists and is explicitly false
    if (form.is_active === false) {
      return NextResponse.json(
        { error: "This form is no longer accepting submissions" },
        { status: 400 }
      );
    }

    // Save submission
    const { data: submission, error } = await supabase
      .from("form_submissions")
      .insert({
        form_id: formId,
        data,
        submitted_by: submittedBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Submit form error:", error);
      return NextResponse.json(
        { error: "Failed to submit form" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Submit form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get submissions for a form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    const { data: submissions, error } = await supabase
      .from("form_submissions")
      .select(`
        *,
        users:submitted_by (
          id,
          display_name,
          email
        )
      `)
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Fetch submissions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      submissions: submissions || [],
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a submission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("form_submissions")
      .delete()
      .eq("id", submissionId);

    if (error) {
      console.error("Delete submission error:", error);
      return NextResponse.json(
        { error: "Failed to delete submission" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Delete submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
