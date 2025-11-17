// API route for processing email queue
// Call this from a cron job (e.g., Vercel Cron, GitHub Actions, etc.)

import { NextResponse } from 'next/server';
import { processPendingEmails, getEmailQueueStatus } from '@/lib/email-service';

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get queue status
    const status = await getEmailQueueStatus();

    return NextResponse.json({
      status,
      message: 'Email queue status retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting email queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get email queue status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process pending emails
    const result = await processPendingEmails();

    return NextResponse.json({
      message: 'Email processing completed',
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Error processing emails:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}
