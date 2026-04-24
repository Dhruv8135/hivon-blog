import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [], message: "List posts (placeholder)" });
}

export async function POST() {
  return NextResponse.json({ message: "Create post (placeholder)" }, { status: 201 });
}
