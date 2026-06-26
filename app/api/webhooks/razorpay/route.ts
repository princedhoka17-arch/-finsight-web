import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  try {
    // Forward webhook to FastAPI backend which handles HMAC verification
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Signature": signature,
        },
        body,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Webhook forwarding error:", error);
      return NextResponse.json({ error }, { status: response.status });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}