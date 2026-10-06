import { BoiCanhId } from './boiCanh';

export type KBMucChacChan = 'cao' | 'trung_binh' | 'thap';

export interface ColorScheme {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  backgroundHex: string;
  note: string;
}

export interface WeatherCondition {
  season: 'xuan' | 'ha' | 'thu' | 'dong';
  temperature: 'mat_me' | 'nong_am' | 'se_lanh';
  timeOfDay: 'buoi_sang' | 'buoi_chieu' | 'buoi_toi';
}

export interface RemixCustomization {
  purposeId: BoiCanhId;
  remixLevel: 1 | 2 | 3; // 1: Truyền thống, 2: Cách tân nhẹ, 3: Remix streetwear
  colorSchemeId: string;
  selectedAccessoryIds: string[];
  weather: WeatherCondition;
}

export interface StylistPhuongAn {
  ten: string;
  mo_ta: string;
  thanh_phan: string[];
  ly_do_van_hoa: string;
  ma_nguon: string | null;
  goi_y_cua_app: string[];
  exp: number;
  token: string;
  guardian?: GuardianResult;
}

export type GuardianDanhGia = 'hai_hoa' | 'can_luu_y' | 'de_sai_lech';

export type GuardianLoaiLyDo =
  | 'lich_su'
  | 'thong_le'
  | 'tham_my'
  | 'chua_du_can_cu'
  | 'nguyen_tac_app';

export interface GuardianResult {
  danh_gia: GuardianDanhGia;
  muc_chac_chan: KBMucChacChan;
  diem_hai_hoa_mau: number | null;
  ly_do: string;
  loai_ly_do: GuardianLoaiLyDo;
  ma_nguon: string | null;
  goi_y_sua: string | null;
}

export type GuardianStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OptionGuardianState {
  status: GuardianStatus;
  result?: GuardianResult;
  errorMessage?: string;
}

export interface SavedLook {
  id: string;
  title: string;
  outfitId: string;
  purposeId: BoiCanhId;
  customization: RemixCustomization;
  savedAt: string;
  notes?: string;
  tags: string[];
  stylistOptions?: StylistPhuongAn[];
}
