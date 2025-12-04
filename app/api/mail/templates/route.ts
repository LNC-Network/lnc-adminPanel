import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch email templates
export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates: templates || [] });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create email template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, body: emailBody } = body;

    if (!name || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    // Extract variables from body ({{variable}} format)
    const variableMatches = emailBody.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(
      variableMatches.map((match: string) => 
        match.replace(/\{\{/g, "").replace(/\}\}/g, "")
      )
    )];

    const { data: template, error } = await supabase
      .from("email_templates")
      .insert({
        name,
        subject,
        body_html: emailBody.replace(/\n/g, "<br>"),
        body_text: emailBody,
        variables: variables,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}

// PATCH - Update email template
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, subject, body: emailBody } = body;

    if (!id || !name || !subject || !emailBody) {
      return NextResponse.json(
        { error: "ID, name, subject, and body are required" },
        { status: 400 }
      );
    }

    const variableMatches2 = emailBody.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(
      variableMatches2.map((match: string) => 
        match.replace(/\{\{/g, "").replace(/\}\}/g, "")
      )
    )];

    const { data: template, error } = await supabase
      .from("email_templates")
      .update({
        name,
        subject,
        body_html: emailBody.replace(/\n/g, "<br>"),
        body_text: emailBody,
        variables: variables,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    // Support both query param and body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    
    // If not in query params, try body
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // No body provided
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
