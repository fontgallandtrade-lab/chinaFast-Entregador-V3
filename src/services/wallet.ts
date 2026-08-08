import {
  apiRequest,
} from './api';

export type DriverWallet = {
  id?: number;
  available_balance: number | string;
  pending_balance: number | string;
  blocked_balance: number | string;
  total_earned: number | string;
  total_withdrawn: number | string;
  created_at?: string;
  updated_at?: string;
};

export type WalletTransaction = {
  id: number;
  type: string;
  amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
  description?: string | null;
  reference_code?: string | null;
  created_at: string;
};

export type Withdrawal = {
  id: number;
  public_code: string;
  amount: number | string;
  pix_key: string;
  status:
    | 'pending'
    | 'approved'
    | 'paid'
    | 'rejected';
  requested_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
};

async function getWallet(): Promise<DriverWallet> {
  const response =
    await apiRequest<{
      success: boolean;
      wallet: DriverWallet;
    }>('/driver/wallet');

  return response.wallet;
}

async function getStatement():
Promise<WalletTransaction[]> {
  const response =
    await apiRequest<{
      success: boolean;
      transactions: WalletTransaction[];
    }>('/driver/wallet/statement');

  return response.transactions;
}

async function getWithdrawals():
Promise<Withdrawal[]> {
  const response =
    await apiRequest<{
      success: boolean;
      withdrawals: Withdrawal[];
    }>('/driver/wallet/withdrawals');

  return response.withdrawals;
}

async function requestWithdrawal(
  amount: number,
  pixKey: string,
): Promise<void> {
  await apiRequest(
    '/driver/wallet/withdrawals',
    {
      method: 'POST',
      body: JSON.stringify({
        amount,
        pix_key: pixKey.trim(),
      }),
    },
  );
}

export const walletService = {
  getWallet,
  getStatement,
  getWithdrawals,
  requestWithdrawal,
};
