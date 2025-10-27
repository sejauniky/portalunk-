import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json(
        { error: "shareId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.functions.invoke(
      "revoke-share-link",
      {
        body: { shareId },
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to revoke share link" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error revoking share link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
