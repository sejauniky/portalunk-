import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.functions.invoke(
      "create-event-contracts",
      { body }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create contracts" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating contracts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
