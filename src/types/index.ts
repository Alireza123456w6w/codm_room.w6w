export interface User {
  id: number;
  username: string;
  display_name?: string;
  role: 'user' | 'admin';
  wallet: number;
  telegram_id?: string;
  bale_id?: string;
  codm_id?: string;
  banned?: number;
  referral_code?: string;
  created_at?: string;
  entries?: number;
}

export interface Room {
  id: number;
  title: string;
  mode: string;
  map_name?: string;
  teams: number;
  team_size: number;
  max_players: number;
  entry_fee: number;
  prize_pool: number;
  start_time?: string;
  status: 'open' | 'full' | 'running' | 'finished' | 'cancelled';
  room_id?: string;
  room_pass?: string;
  description?: string;
  rules?: string;
  created_by?: number;
  created_at?: string;
  total?: number;
  paid?: number;
  free?: number;
  creator?: string;
}

export interface Slot {
  id: number;
  room_id: number;
  slot_no: number;
  team_label?: string;
  user_id?: number | null;
  status: 'free' | 'pending' | 'paid';
  payment_id?: number | null;
  display_name?: string;
  username?: string;
}

export interface Payment {
  id: number;
  user_id: number;
  room_id?: number | null;
  slot_id?: number | null;
  amount: number;
  method: 'wallet' | 'card' | 'online' | 'free';
  ref_code?: string;
  proof_file_id?: string;
  proof_platform?: string;
  status: 'pending' | 'approved' | 'rejected';
  kind: 'entry' | 'topup';
  created_at?: string;
  handled_by?: number | null;
  handled_at?: string | null;
  username?: string;
  display_name?: string;
  room_title?: string;
}

export interface Prize {
  id: number;
  user_id: number;
  room_id?: number | null;
  amount: number;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by?: number;
  created_at?: string;
  handled_at?: string | null;
  username?: string;
  display_name?: string;
  room_title?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  kind?: string;
  ref?: string;
  created_at: string;
}

export interface PublicStats {
  users: number;
  rooms: number;
  openRooms: number;
  entries: number;
  prizesPaid: number;
}

export interface AdminStats extends PublicStats {
  todayUsers: number;
  admins: number;
  runningRooms: number;
  finishedRooms: number;
  revenue: number;
  topups: number;
  walletTotal: number;
  pendingPayments: number;
  pendingPrizes: number;
}

export interface PublicConfig {
  channel_link?: string;
  support_bot?: string;
  website_url?: string;
  offers_site?: string;
  offers_page?: string;
  shop_bot?: string;
  min_topup: number;
  has_card: boolean;
  has_gateway: boolean;
  bale_bot?: string;
  tg_bot?: string;
  tg_bot_id?: string;
  bale_bot_id?: string;
  referral_reward: number;
  modes: Record<string, { fa: string; en?: string; def_teams: number; def_size: number; emoji: string }>;
}

export interface MetaWeapon {
  id: string;
  name: string;
  type: string;
  typeEn: string;
  tier: string;
  camo: string;
  stats: {
    damage: number;
    fireRate: number;
    accuracy: number;
    mobility: number;
    range: number;
    control: number;
  };
  attachments: {
    slot: string;
    slotEn: string;
    name: string;
  }[];
  code: string;
  role: string;
  seasonMeta: string;
}
