import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: "paymentId and status are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.functions.invoke(
      "review-payment",
      {
        body: { paymentId, status },
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to review payment" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reviewing payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
