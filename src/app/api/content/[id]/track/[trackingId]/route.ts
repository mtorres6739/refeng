import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string; trackingId: string } }
) {
  try {
    // Record click
    const share = await db.contentShare.update({
      where: {
        trackingId: params.trackingId,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    // Get the content
    const content = await db.content.findUnique({
      where: { id: params.id },
    });

    if (!content) {
      return new NextResponse("Content not found", { status: 404 });
    }

    // Redirect to the actual content URL
    return NextResponse.redirect(content.url);
  } catch (error) {
    console.error("[CONTENT_TRACK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
