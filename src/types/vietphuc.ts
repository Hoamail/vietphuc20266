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
  ma_nguon: string[];
  goi_y_cua_app: string[];
  exp: number;
  token: string;
  guardian?: GuardianResult;
}

export type GuardianNhan = 'hai_hoa' | 'can_luu_y' | 'de_sai_lech';

export type GuardianLoaiLyDo =
  | 'lich_su'
  | 'thong_le_ung_xu'
  | 'tham_my'
  | 'thieu_can_cu'
  | 'nguyen_tac_app';

export interface GuardianLyDoItem {
  noi_dung: string;
  loai: GuardianLoaiLyDo;
  ma_nguon: string | null;
}

export interface GuardianResult {
  nhan: GuardianNhan;
  diem_hai_hoa_mau: number | null;
  ly_do: GuardianLyDoItem[];
  goi_y_sua: string[];
  do_chac_chan: KBMucChacChan;
}

export type GuardianStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OptionGuardianState {
  status: GuardianStatus;
  result?: GuardianResult;
  errorMessage?: string;
}

export interface ImageGuardianResult {
  khop: boolean;
  diem_khop: string[];
  diem_khong_khop: string[];
  diem_khong_xac_dinh: string[];
  nhan: GuardianNhan;
  do_chac_chan: KBMucChacChan;
  canh_bao_co_dinh: string | null;
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
