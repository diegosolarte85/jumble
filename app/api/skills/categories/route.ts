import { NextResponse } from 'next/server';

const CATEGORIES = ['Technical', 'Business', 'Design', 'Marketing', 'Other'];

export async function GET() {
  return NextResponse.json(CATEGORIES);
}

