import { getAdminClient } from '@/lib/supabase/admin';
import { CreditTxType, TxStatus } from '@/types/database';

export const CREDIT_PER_NIGHT_DEFAULT = 1;

export interface ReserveCreditsParams {
  userId: string;
  bookingId: string;
  amount: number;
  idempotencyKey?: string;
  description?: string;
}

export interface ReleaseReservationParams {
  userId: string;
  bookingId: string;
  amount: number;
  description?: string;
}

export interface SettleStayParams {
  guestId: string;
  hostId: string;
  bookingId: string;
  amount: number;
}

export class LedgerService {
  /**
   * Holds credits in reserve for a booking request.
   * Decrements available_balance, increments reserved_balance, creates an append-only ledger transaction.
   */
  static async reserveCredits({
    userId,
    bookingId,
    amount,
    idempotencyKey,
    description = 'Hold credits for stay reservation',
  }: ReserveCreditsParams) {
    const supabase = getAdminClient();

    // 1. Idempotency check: if already processed with this key, return existing transaction
    if (idempotencyKey) {
      const { data: existingTx } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingTx) {
        return { success: true, transaction: existingTx, idempotent: true };
      }
    }

    // 2. Fetch current wallet balance
    const { data: account, error: accError } = await supabase
      .from('credit_accounts')
      .select('available_balance, reserved_balance')
      .eq('user_id', userId)
      .single();

    if (accError || !account) {
      throw new Error(`Credit account not found for user: ${userId}`);
    }

    if (account.available_balance < amount) {
      return {
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        required: amount,
        available: account.available_balance,
      };
    }

    // 3. Atomically update balances
    const newAvailable = account.available_balance - amount;
    const newReserved = account.reserved_balance + amount;

    const { error: updateError } = await supabase
      .from('credit_accounts')
      .update({
        available_balance: newAvailable,
        reserved_balance: newReserved,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update credit balances: ${updateError.message}`);
    }

    // 4. Append ledger transaction
    const { data: tx, error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        transaction_type: 'reservation_hold',
        amount: -amount,
        status: 'posted',
        idempotency_key: idempotencyKey || null,
        description,
      })
      .select()
      .single();

    if (txError) {
      // In production, compensating rollback would trigger here
      throw new Error(`Failed to record credit transaction: ${txError.message}`);
    }

    return {
      success: true,
      transaction: tx,
      balances: { available: newAvailable, reserved: newReserved },
    };
  }

  /**
   * Releases held credits back to available balance (e.g. upon decline or cancellation).
   */
  static async releaseReservation({
    userId,
    bookingId,
    amount,
    description = 'Release held credits due to cancellation/decline',
  }: ReleaseReservationParams) {
    const supabase = getAdminClient();

    const { data: account, error: accError } = await supabase
      .from('credit_accounts')
      .select('available_balance, reserved_balance')
      .eq('user_id', userId)
      .single();

    if (accError || !account) {
      throw new Error(`Credit account not found for user: ${userId}`);
    }

    const releaseAmount = Math.min(amount, account.reserved_balance);
    const newAvailable = account.available_balance + releaseAmount;
    const newReserved = Math.max(0, account.reserved_balance - releaseAmount);

    await supabase
      .from('credit_accounts')
      .update({
        available_balance: newAvailable,
        reserved_balance: newReserved,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    const { data: tx } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        transaction_type: 'reservation_release',
        amount: releaseAmount,
        status: 'posted',
        description,
      })
      .select()
      .single();

    return { success: true, transaction: tx, balances: { available: newAvailable, reserved: newReserved } };
  }

  /**
   * Settles completed stay: guest reserved balance is debited, host available balance is credited.
   */
  static async settleStay({ guestId, hostId, bookingId, amount }: SettleStayParams) {
    const supabase = getAdminClient();

    // 1. Debit guest reserved balance
    const { data: guestAccount } = await supabase
      .from('credit_accounts')
      .select('reserved_balance')
      .eq('user_id', guestId)
      .single();

    if (guestAccount) {
      const newReserved = Math.max(0, guestAccount.reserved_balance - amount);
      await supabase
        .from('credit_accounts')
        .update({ reserved_balance: newReserved, updated_at: new Date().toISOString() })
        .eq('user_id', guestId);

      await supabase.from('credit_transactions').insert({
        user_id: guestId,
        booking_id: bookingId,
        transaction_type: 'stay_debit',
        amount: -amount,
        status: 'posted',
        description: `Settlement debit for completed stay #${bookingId}`,
      });
    }

    // 2. Credit host available balance
    const { data: hostAccount } = await supabase
      .from('credit_accounts')
      .select('available_balance')
      .eq('user_id', hostId)
      .single();

    if (hostAccount) {
      const newAvailable = hostAccount.available_balance + amount;
      await supabase
        .from('credit_accounts')
        .update({ available_balance: newAvailable, updated_at: new Date().toISOString() })
        .eq('user_id', hostId);

      await supabase.from('credit_transactions').insert({
        user_id: hostId,
        booking_id: bookingId,
        transaction_type: 'host_reward',
        amount: amount,
        status: 'posted',
        description: `Reward for hosting stay #${bookingId}`,
      });
    }

    return { success: true };
  }
}
