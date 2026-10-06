import kbDataRaw from './kb-v3.json';
import boiCanhRaw from './boi-canh.json';
import { KBDatabase, KBTrangPhuc, KBNguonMap, KBNguonItem, KBMucChacChan } from '../types/kb';
import { BoiCanhItem } from '../types/boiCanh';
import { ColorScheme } from '../types/vietphuc';

export const KB_DATA = kbDataRaw as KBDatabase;
export const KB_TRANG_PHUC: KBTrangPhuc[] = KB_DATA.trang_phuc;
export const KB_NGUON: KBNguonMap = KB_DATA.nguon;
export const BOI_CANH: BoiCanhItem[] = boiCanhRaw as BoiCanhItem[];

export function getTrangPhucById(id: string): KBTrangPhuc | undefined {
  return KB_TRANG_PHUC.find((item) => item.id === id);
}

export function getOutfitHoverNote(
  outfit?: { id?: string; ghi_chu_ten?: string } | null
): string | undefined {
  if (!outfit) return undefined;
  if (typeof outfit.ghi_chu_ten === 'string' && outfit.ghi_chu_ten.trim()) {
    return outfit.ghi_chu_ten.trim();
  }
  if (outfit.id === 'ao_dai_tan_thoi') {
    return 'Áo dài hiện đại';
  }
  return undefined;
}

export function getBoiCanhById(id: string): BoiCanhItem | undefined {
  return BOI_CANH.find((item) => item.id === id);
}

export function getNguonById(key: string): KBNguonItem | undefined {
  return KB_NGUON[key];
}

export function getTenNguon(key: string): string {
  return KB_NGUON[key]?.ten || key;
}

export function getLoaiNguon(key: string): string {
  return KB_NGUON[key]?.loai || 'chua_xac_dinh';
}

export function getLoaiNguonLabel(loai: string): string {
  switch (loai) {
    case 'bao_chi_nha_nuoc':
      return 'Báo chí nhà nước';
    case 'thuong_mai':
      return 'Thương mại';
    case 'tai_lieu_hoc_sinh':
      return 'Tài liệu học sinh';
    case 'tap_chi_van_hoa_doc_lap':
      return 'Tạp chí văn hóa độc lập';
    case 'blog':
      return 'Blog';
    case 'tap_chi':
      return 'Tạp chí';
    case 'co_quan_nghien_cuu':
      return 'Cơ quan nghiên cứu';
    case 'tap_chi_hoc_thuat':
      return 'Tạp chí học thuật';
    case 'bao_chi':
      return 'Báo chí';
    case 'chua_xac_dinh':
    default:
      return 'Chưa xác định';
  }
}

export function getMucChacChanLabel(muc: KBMucChacChan | string): string {
  switch (muc) {
    case 'cao':
      return 'Cao';
    case 'trung_binh':
      return 'Trung bình';
    case 'thap':
    default:
      return 'Thấp';
  }
}

export function formatNguonText(text?: string): string {
  if (!text || text.trim() === '') return 'Chưa có nguồn';
  return text.replace(/Chưa có nguồn xác nhận(\s+trong các trích đoạn)?/gi, 'Chưa có nguồn');
}

export interface GarmentAccessoryOption {
  id: string;
  name: string;
  sourceType: 'phu_kien' | 'goi_y';
  isAppSuggestion: boolean;
  rawText: string;
}

export function getAccessoriesForGarment(garment: KBTrangPhuc): GarmentAccessoryOption[] {
  const options: GarmentAccessoryOption[] = [];

  // 1. Phụ kiện từ trường phu_kien của KB
  if (Array.isArray(garment.phu_kien)) {
    garment.phu_kien.forEach((pk, index) => {
      if (!pk) return;
      options.push({
        id: `pk-${garment.id}-${index}`,
        name: formatNguonText(pk),
        sourceType: 'phu_kien',
        isAppSuggestion: false,
        rawText: pk,
      });
    });
  }

  // 2. Phụ kiện từ trường goi_y_phoi_do
  if (Array.isArray(garment.goi_y_phoi_do)) {
    garment.goi_y_phoi_do.forEach((gy, index) => {
      if (gy.loai === 'phu_kien' || gy.loai === 'phoi_hien_dai') {
        options.push({
          id: `gy-${garment.id}-${index}`,
          name: gy.noi_dung,
          sourceType: 'goi_y',
          isAppSuggestion: true,
          rawText: gy.noi_dung,
        });
      }
    });
  }

  return options;
}

export type AppColorScheme = ColorScheme;

export const POTTERY_SILK_PALETTES: ColorScheme[] = [
  {
    id: 'men-lam-chu-dau',
    name: 'Men Lam & Trắng Gốm',
    primaryHex: '#1E3F5A',
    secondaryHex: '#EBF2F7',
    accentHex: '#C88E1B',
    backgroundHex: '#F8F6F0',
    note: 'Gợi ý thiết kế của app',
  },
  {
    id: 'men-ngoc-celadon',
    name: 'Men Ngọc Celadon',
    primaryHex: '#2E6254',
    secondaryHex: '#E9F2EE',
    accentHex: '#D4AF37',
    backgroundHex: '#F5F8F6',
    note: 'Gợi ý thiết kế của app',
  },
  {
    id: 'dat-nung-chu-sa',
    name: 'Chu Sa & Đất Nung',
    primaryHex: '#B93826',
    secondaryHex: '#FBEFEF',
    accentHex: '#8E2516',
    backgroundHex: '#FAF4F2',
    note: 'Gợi ý thiết kế của app',
  },
  {
    id: 'men-ran-sa-thach',
    name: 'Men Rạn Sa Thạch',
    primaryHex: '#7A6248',
    secondaryHex: '#F5EFE6',
    accentHex: '#B89B72',
    backgroundHex: '#FAF7F2',
    note: 'Gợi ý thiết kế của app',
  },
  {
    id: 'to-tam-hoang-yen',
    name: 'Tơ Tằm Hoàng Yến',
    primaryHex: '#B58900',
    secondaryHex: '#FEF9E7',
    accentHex: '#D4AC0D',
    backgroundHex: '#FCFBF5',
    note: 'Gợi ý thiết kế của app',
  },
  {
    id: 'lanh-my-a-black',
    name: 'Lãnh Mỹ A Đen Tuyển',
    primaryHex: '#1E2328',
    secondaryHex: '#ECEFF1',
    accentHex: '#90A4AE',
    backgroundHex: '#F8F9FA',
    note: 'Gợi ý thiết kế của app',
  },
];

