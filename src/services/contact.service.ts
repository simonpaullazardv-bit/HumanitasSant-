import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  AppointmentRequest,
  CallbackRequest,
  ChatMessage,
  ContactMessage,
  MembershipRequest,
} from "@/types";

export async function sendContactMessage(payload: ContactMessage) {
  if (!isSupabaseConfigured) {
    return { queued: true as const };
  }
  const { error } = await supabase.from("contact_messages").insert(payload);
  if (error) throw error;
  return { queued: false as const };
}

export async function submitCallbackRequest(payload: CallbackRequest) {
  if (!isSupabaseConfigured) {
    return { queued: true as const };
  }
  const { error } = await supabase.from("callback_requests").insert(payload);
  if (error) throw error;
  return { queued: false as const };
}

export async function submitAppointmentRequest(payload: AppointmentRequest) {
  if (!isSupabaseConfigured) {
    return { queued: true as const };
  }
  const { error } = await supabase.from("appointments").insert(payload);
  if (error) throw error;
  return { queued: false as const };
}

export async function sendChatMessage(payload: ChatMessage) {
  if (!isSupabaseConfigured) {
    return { queued: true as const };
  }
  const { error } = await supabase.from("chat_messages").insert(payload);
  if (error) throw error;
  return { queued: false as const };
}

export async function submitMembershipRequest(payload: MembershipRequest) {
  if (!isSupabaseConfigured) {
    return { queued: true as const };
  }
  const { error } = await supabase.from("membership_requests").insert(payload);
  if (error) throw error;
  return { queued: false as const };
}
