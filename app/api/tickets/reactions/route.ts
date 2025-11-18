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

// POST - Add reaction to ticket
export async function POST(request: NextRequest) {
  try {
    const { ticket_id, user_id, reaction } = await request.json();

    if (!ticket_id || !user_id || !reaction) {
      return NextResponse.json(
        { error: "ticket_id, user_id, and reaction are required" },
        { status: 400 }
      );
    }

    // Valid reactions
    const validReactions = ['+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ticket_reactions")
      .insert({ ticket_id, user_id, reaction })
      .select()
      .single();

    if (error) {
      // If duplicate, remove the reaction instead
      if (error.code === '23505') {
        const { error: deleteError } = await supabase
          .from("ticket_reactions")
          .delete()
          .eq("ticket_id", ticket_id)
          .eq("user_id", user_id)
          .eq("reaction", reaction);

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ removed: true });
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reaction: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get reactions for a ticket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticket_id");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticket_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ticket_reactions")
      .select(`
        *,
        user:users!ticket_reactions_user_id_fkey(id, display_name, email)
      `)
      .eq("ticket_id", ticketId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reactions: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
