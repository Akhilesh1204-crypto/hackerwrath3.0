'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useApiQuery } from '@/lib/hooks';
import { createConversation, getConversationMessages, getConversations, sendMessage } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/dates';
import type { Conversation, Message } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

function MessagesContent() {
  const searchParams = useSearchParams();
  const { error: toastError } = useToast();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(searchParams.get('conversation') ?? '');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const conversationsQuery = useApiQuery(getConversations, []);
  const messagesQuery = useApiQuery(
    () => getConversationMessages(selectedId),
    [selectedId],
    { enabled: Boolean(selectedId) },
  );

  useEffect(() => {
    const requested = searchParams.get('conversation');
    if (requested) setSelectedId(requested);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId && conversationsQuery.data?.[0]) {
      setSelectedId(conversationsQuery.data[0].id);
    }
  }, [selectedId, conversationsQuery.data]);

  const selected = conversationsQuery.data?.find((conversation) => conversation.id === selectedId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId) return;
    setSending(true);
    try {
      await sendMessage(selectedId, body);
      setDraft('');
      messagesQuery.refresh();
      conversationsQuery.refresh();
    } catch (error) {
      toastError('Message not sent', errorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="CONVERSATIONS"
        title={<>Stay in the loop, <em>before you stay.</em></>}
        description="Ask a host about check-in, house rules, accessibility or anything else you need to know."
        actions={
          <div className="flex items-center gap-2 rounded-2xl bg-sage-50 px-3 py-2 text-[11px] text-pine">
            <ShieldCheck className="h-4 w-4" /> Keep payment and confirmation steps on SwapStay.
          </div>
        }
      />

      {conversationsQuery.loading ? (
        <LoadingBlock label="Loading conversations" className="py-20" />
      ) : conversationsQuery.error ? (
        <ErrorState title="Messages are unavailable" message={conversationsQuery.error} onRetry={conversationsQuery.refresh} />
      ) : !conversationsQuery.data?.length ? (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" />}
          title="No conversations yet"
          description="Open a home and choose Message host to start a conversation."
        />
      ) : (
        <div className="mt-8 grid min-h-[560px] gap-5 lg:grid-cols-[0.85fr_1.5fr]">
          <aside className="rounded-3xl border border-sand-200/90 bg-white/80 p-3 shadow-soft">
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Your conversations
            </p>
            <div className="space-y-1">
              {conversationsQuery.data.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full rounded-2xl p-3 text-left transition ${
                    conversation.id === selectedId ? 'bg-pine text-sand-50' : 'hover:bg-sage-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={conversation.other_participant?.display_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold">
                          {conversation.other_participant?.display_name ?? 'SwapStay member'}
                        </p>
                        {conversation.unread_count ? (
                          <span className="rounded-full bg-clay-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {conversation.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className={`mt-1 truncate text-[11px] ${conversation.id === selectedId ? 'text-sand-100/70' : 'text-ink-500'}`}>
                        {conversation.property?.title ?? 'General conversation'}
                      </p>
                      {conversation.last_message && (
                        <p className={`mt-1 truncate text-[11px] ${conversation.id === selectedId ? 'text-sand-100/70' : 'text-ink-500'}`}>
                          {conversation.last_message.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-sand-200/80 px-5 py-4">
                  <Avatar name={selected.other_participant?.display_name} size="md" />
                  <div>
                    <h2 className="text-[17px]">{selected.other_participant?.display_name ?? 'SwapStay member'}</h2>
                    <p className="text-[11px] text-ink-500">{selected.property?.title ?? 'SwapStay conversation'}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-sand-50/40 p-5">
                  {messagesQuery.loading ? (
                    <LoadingBlock label="Loading messages" className="py-16" />
                  ) : messagesQuery.error ? (
                    <ErrorState title="Could not load messages" message={messagesQuery.error} onRetry={messagesQuery.refresh} />
                  ) : (
                    (messagesQuery.data ?? []).map((message: Message) => {
                      const mine = message.sender_id === user?.id;
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'rounded-br-md bg-pine text-sand-50' : 'rounded-bl-md border border-sand-200 bg-white text-ink-800'}`}>
                            <p className="text-[13px] leading-5">{message.body}</p>
                            <p className={`mt-1 text-[10px] ${mine ? 'text-sand-100/65' : 'text-ink-400'}`}>
                              {formatDate(message.created_at.slice(0, 10))}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={submit} className="border-t border-sand-200/80 p-4">
                  <Textarea
                    label="Message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask about check-in, amenities or house rules…"
                    maxLength={2000}
                    rows={3}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[10.5px] text-ink-500">Never share payment details or sensitive documents in chat.</p>
                    <Button type="submit" size="sm" loading={sending} disabled={!draft.trim()} leading={<Send className="h-3.5 w-3.5" />}>
                      Send
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <EmptyState title="Choose a conversation" description="Your messages will appear here." />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RequireAuth>
      <MessagesContent />
    </RequireAuth>
  );
}
