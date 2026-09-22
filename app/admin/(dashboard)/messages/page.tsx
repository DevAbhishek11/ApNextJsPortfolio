import type { Metadata } from "next";
import MessagesInbox from "@/components/admin/messages-inbox";
import { messagesRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  const messages = await messagesRepo.all();
  return <MessagesInbox initial={messages} />;
}
