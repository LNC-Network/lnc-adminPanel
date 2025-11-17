// API route for viewing email queue and logs

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { userHasPermission, PERMISSIONS } from '@/lib/permission-check';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get email queue with pagination and filters
export async function GET(request: Request) {
  try {
    // TODO: Get user ID from session
    // const userId = await getUserIdFromSession(request);
    // if (!userId || !await userHasPermission(userId, PERMISSIONS.SETTINGS_READ)) {
    //   return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    // }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('email_queue')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch email queue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      emails: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching email queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
