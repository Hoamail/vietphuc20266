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
