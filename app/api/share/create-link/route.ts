import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { djId, producerId, expiryDays, password } = body;

    if (!djId || !producerId) {
      return NextResponse.json(
        { error: "djId and producerId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.functions.invoke(
      "create-share-link",
      {
        body: { djId, producerId, expiryDays, password },
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create share link" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
