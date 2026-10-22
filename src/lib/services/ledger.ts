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

export interface CancellationFeeParams {
  guestId: string;
  hostId: string;
  bookingId: string;
  reservedAmount: number;
  feeNights: number;
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

    const releaseKey = `reservation-release:${bookingId}`;
    const { data: existingRelease } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('idempotency_key', releaseKey)
      .maybeSingle();
    if (existingRelease) return { success: true, transaction: existingRelease, idempotent: true };

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
        idempotency_key: releaseKey,
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

    const { data: existingSettlement } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('transaction_type', 'stay_debit')
      .maybeSingle();
    if (existingSettlement) return { success: true, idempotent: true };

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
        idempotency_key: `settlement-debit:${bookingId}`,
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
        idempotency_key: `settlement-reward:${bookingId}`,
        description: `Reward for hosting stay #${bookingId}`,
      });
    }

    return { success: true };
  }

  /** Releases all held credits except the late-cancellation fee and pays that fee to the host. */
  static async settleCancellationFee({
    guestId,
    hostId,
    bookingId,
    reservedAmount,
    feeNights,
  }: CancellationFeeParams) {
    const fee = Math.max(0, Math.min(feeNights, reservedAmount));
    const releaseAmount = Math.max(0, reservedAmount - fee);
    if (releaseAmount > 0) {
      await this.releaseReservation({
        userId: guestId,
        bookingId,
        amount: releaseAmount,
        description: `Release ${releaseAmount} credits after cancellation of booking #${bookingId}`,
      });
    }
    if (fee === 0) return { success: true, feeNights: 0, released: releaseAmount };

    const supabase = getAdminClient();
    const { data: existingFee } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', guestId)
      .eq('booking_id', bookingId)
      .eq('transaction_type', 'cancellation_fee')
      .maybeSingle();
    if (existingFee) return { success: true, idempotent: true, feeNights: fee, released: releaseAmount };

    const { data: guestAccount } = await supabase
      .from('credit_accounts')
      .select('reserved_balance')
      .eq('user_id', guestId)
      .single();
    if (!guestAccount || guestAccount.reserved_balance < fee) {
      throw new Error('Reserved credit balance is insufficient for the cancellation fee');
    }
    await supabase
      .from('credit_accounts')
      .update({ reserved_balance: guestAccount.reserved_balance - fee, updated_at: new Date().toISOString() })
      .eq('user_id', guestId);
    await supabase.from('credit_transactions').insert({
      user_id: guestId,
      booking_id: bookingId,
      transaction_type: 'cancellation_fee',
      amount: -fee,
      status: 'posted',
      idempotency_key: `cancellation-fee:${bookingId}:guest`,
      description: `Late cancellation fee for booking #${bookingId}`,
    });

    const { data: hostAccount } = await supabase
      .from('credit_accounts')
      .select('available_balance')
      .eq('user_id', hostId)
      .single();
    if (!hostAccount) throw new Error(`Credit account not found for user: ${hostId}`);
    await supabase
      .from('credit_accounts')
      .update({ available_balance: hostAccount.available_balance + fee, updated_at: new Date().toISOString() })
      .eq('user_id', hostId);
    await supabase.from('credit_transactions').insert({
      user_id: hostId,
      booking_id: bookingId,
      transaction_type: 'compensation_adjustment',
      amount: fee,
      status: 'posted',
      idempotency_key: `cancellation-fee:${bookingId}:host`,
      description: `Late cancellation compensation for booking #${bookingId}`,
    });
    return { success: true, feeNights: fee, released: releaseAmount };
  }
}
