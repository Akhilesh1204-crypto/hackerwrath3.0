import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { badRequest, forbidden, internalError, ok, unauthorized } from '@/lib/api-response';
import { createMessageSchema } from '@/lib/validations/message';

async function assertParticipant(conversationId: string, userId: string) {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  return { supabase, isParticipant: Boolean(data) };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(_req);
  if (!user) return unauthorized('Authentication required to view messages');

  const { supabase, isParticipant } = await assertParticipant(params.id, user.id);
  if (!isParticipant) return forbidden('You are not a participant in this conversation');

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, sender:profiles!sender_id(id, display_name, verification_status)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true });
  if (error) return internalError('Failed to retrieve messages', error.message);

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', params.id)
    .eq('user_id', user.id);

  return ok(messages ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized('Authentication required to send messages');

  const { supabase, isParticipant } = await assertParticipant(params.id, user.id);
  if (!isParticipant) return forbidden('You are not a participant in this conversation');

  try {
    const result = createMessageSchema.safeParse(await req.json());
    if (!result.success) return badRequest('VALIDATION_ERROR', 'Invalid message data', result.error.format());

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id: params.id, sender_id: user.id, body: result.data.body })
      .select('id, conversation_id, sender_id, body, created_at, sender:profiles!sender_id(id, display_name, verification_status)')
      .single();
    if (error || !message) return internalError('Failed to send message', error?.message);

    await supabase
      .from('conversations')
      .update({ updated_at: message.created_at })
      .eq('id', params.id);

    return ok(message, undefined, 201);
  } catch (error: any) {
    return internalError('Server error sending message', error?.message);
  }
}
