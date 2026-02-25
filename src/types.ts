export interface User {
  id: number;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  balance: number;
  referral_code: string;
  referred_by: number | null;
  preferences?: string;
  created_at: string;
}

export interface Deposit {
  id: number;
  user_id: number;
  user_email?: string;
  amount: number;
  currency: string;
  blockchain: string;
  tx_hash: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  user_email?: string;
  amount: number;
  currency: string;
  blockchain: string;
  address: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}
