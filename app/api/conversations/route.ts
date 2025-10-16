/**
 * Conversations API Endpoint
 * GET: List user conversations
 * POST: Create new conversation
 */

import { NextRequest } from "next/server";
import { stackServerApp } from "@/stack";
import {
  listConversations,
  createConversation,
  getConversationById,
} from "@/lib/services/conversation";
import type { RecoveryStage } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conversations = await listConversations(user.id, limit, offset);

    return Response.json({
      conversations,
      pagination: {
        limit,
        offset,
        hasMore: conversations.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversations" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title = "New Conversation", stage = "check_in" } = body;

    const conversation = await createConversation(
      user.id,
      title,
      stage as RecoveryStage
    );

    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
