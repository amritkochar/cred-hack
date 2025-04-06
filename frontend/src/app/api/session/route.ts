import { NextResponse } from "next/server";

// This is a dummy endpoint that will be replaced by direct localStorage access
// in the ConnectionContext component
export async function GET() {
  try {
    return NextResponse.json({
      message: "Please use the token from localStorage directly"
    });
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
