/**
 * Individual Conversation API Endpoint
 * GET: Get conversation by ID
 * PATCH: Update conversation (title, stage)
 * DELETE: Delete conversation (future implementation)
 */

import { NextRequest } from "next/server";
import { stackServerApp } from "@/stack";
import {
  getConversationById,
  updateConversationTitle,
  updateConversationStage,
  getRecentMessages,
} from "@/lib/services/conversation";
import type { RecoveryStage } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversationId = parseInt(params.id, 10);

    if (isNaN(conversationId)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const conversation = await getConversationById(conversationId, user.id);

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const includeMessages = searchParams.get("includeMessages") === "true";
    const messageLimit = parseInt(searchParams.get("messageLimit") || "50", 10);

    const messages = includeMessages
      ? await getRecentMessages(conversationId, messageLimit)
      : [];

    return Response.json({
      conversation,
      messages: includeMessages ? messages : undefined,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversationId = parseInt(params.id, 10);

    if (isNaN(conversationId)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const conversation = await getConversationById(conversationId, user.id);

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { title, stage } = body;

    if (title !== undefined) {
      await updateConversationTitle(conversationId, title);
    }

    if (stage !== undefined) {
      await updateConversationStage(conversationId, stage as RecoveryStage);
    }

    const updatedConversation = await getConversationById(
      conversationId,
      user.id
    );

    return Response.json({ conversation: updatedConversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
