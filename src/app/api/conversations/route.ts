import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, notFound, ok, unauthorized } from '@/lib/api-response';
import { createConversationSchema } from '@/lib/validations/message';

type ConversationRow = {
  id: string;
  property_id: string | null;
  booking_id: string | null;
  swap_request_id: string | null;
  context: string;
  created_at: string;
  updated_at: string;
};

async function conversationView(supabase: ReturnType<typeof getAdminClient>, conversation: ConversationRow, userId: string) {
  const [{ data: participant }, { data: property }, { data: lastMessage }] = await Promise.all([
    supabase
      .from('conversation_participants')
      .select('user_id, last_read_at, profiles!inner(id, display_name, verification_status)')
      .eq('conversation_id', conversation.id)
      .neq('user_id', userId)
      .maybeSingle(),
    conversation.property_id
      ? supabase.from('properties').select('id, title, city').eq('id', conversation.property_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, sender:profiles!sender_id(id, display_name, verification_status)')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let unreadQuery = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversation.id)
    .neq('sender_id', userId);
  if (participant?.last_read_at) unreadQuery = unreadQuery.gt('created_at', participant.last_read_at);
  const { count: unreadCount } = await unreadQuery;

  return {
    ...conversation,
    context: conversation.context,
    other_participant: participant?.profiles ?? undefined,
    property: property ?? undefined,
    last_message: lastMessage ?? undefined,
    unread_count: unreadCount ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to view conversations');

  const supabase = getAdminClient();
  const { data: memberships, error: membershipError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (membershipError) return internalError('Failed to retrieve conversations', membershipError.message);
  const ids = (memberships ?? []).map((entry) => entry.conversation_id);
  if (!ids.length) return ok([]);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .in('id', ids)
    .order('updated_at', { ascending: false });
  if (error) return internalError('Failed to retrieve conversations', error.message);

  const result = await Promise.all(
    (conversations as ConversationRow[]).map((conversation) => conversationView(supabase, conversation, user.id)),
  );
  return ok(result);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to start a conversation');

  try {
    const result = createConversationSchema.safeParse(await req.json());
    if (!result.success) return badRequest('VALIDATION_ERROR', 'Invalid conversation data', result.error.format());
    const data = result.data;
    if (data.recipient_id === user.id) return badRequest('VALIDATION_ERROR', 'You cannot message yourself');

    const supabase = getAdminClient();
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, display_name, verification_status')
      .eq('id', data.recipient_id)
      .maybeSingle();
    if (!recipient) return notFound('Message recipient not found');

    if (data.property_id) {
      const { data: property } = await supabase
        .from('properties')
        .select('id, owner_id, title, city, listing_status')
        .eq('id', data.property_id)
        .maybeSingle();
      if (!property) return notFound('Property not found');
      if (property.owner_id !== data.recipient_id) {
        return forbidden('The selected member does not host this property');
      }
    }

    for (const reference of [
      { id: data.booking_id, table: 'bookings' },
      { id: data.swap_request_id, table: 'swap_requests' },
    ]) {
      if (!reference.id) continue;
      const { data: row } = await supabase.from(reference.table).select('*').eq('id', reference.id).maybeSingle();
      if (!row) return notFound('Conversation context not found');
      const participants = reference.table === 'bookings'
        ? [row.guest_id, row.host_id]
        : [row.requester_id, row.recipient_id];
      if (!participants.includes(user.id) || !participants.includes(data.recipient_id)) {
        return forbidden('Only participants can message about this context');
      }
    }

    const { data: ownMemberships } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    const ownIds = (ownMemberships ?? []).map((entry) => entry.conversation_id);

    if (ownIds.length) {
      const { data: recipientMemberships } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', ownIds)
        .eq('user_id', data.recipient_id);
      const sharedIds = (recipientMemberships ?? []).map((entry) => entry.conversation_id);
      if (sharedIds.length) {
        const { data: existing } = await supabase
          .from('conversations')
          .select('*')
          .in('id', sharedIds)
          .eq('property_id', data.property_id ?? null)
          .eq('booking_id', data.booking_id ?? null)
          .eq('swap_request_id', data.swap_request_id ?? null)
          .eq('context', data.context);
        const conversation = (existing as ConversationRow[] | null)?.[0];
        if (conversation) {
          if (data.initial_message) {
            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              sender_id: user.id,
              body: data.initial_message,
            });
            await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
          }
          return ok(await conversationView(supabase, conversation, user.id));
        }
      }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        property_id: data.property_id ?? null,
        booking_id: data.booking_id ?? null,
        swap_request_id: data.swap_request_id ?? null,
        context: data.context,
      })
      .select('*')
      .single();
    if (conversationError || !conversation) return internalError('Failed to create conversation', conversationError?.message);

    const { error: participantError } = await supabase.from('conversation_participants').insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: data.recipient_id },
    ]);
    if (participantError) return internalError('Failed to add conversation participants', participantError.message);

    if (data.initial_message) {
      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: data.initial_message,
      });
      if (messageError) return internalError('Conversation created but initial message failed', messageError.message);
    }

    return ok(await conversationView(supabase, conversation as ConversationRow, user.id), undefined, 201);
  } catch (error: any) {
    return internalError('Server error creating conversation', error?.message);
  }
}
