import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { users } from '@/drizzle/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple health check - try to query the database
    await db.select().from(users).limit(1);
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', database: 'disconnected', error: error.message },
      { status: 500 }
    );
  }
}

