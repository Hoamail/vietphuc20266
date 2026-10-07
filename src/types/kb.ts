export type KBNhom = 'co_phuc' | 'dan_gian' | 'hien_dai_cach_tan';
export type KBMucChacChan = 'cao' | 'trung_binh' | 'thap';

export interface KBNguonItem {
  ten: string;
  url: string;
  loai: string;
}

export interface KBNguonMap {
  [key: string]: KBNguonItem;
}

export interface KBGoiYItem {
  noi_dung: string;
  loai: 'boi_canh' | 'phu_kien' | 'phoi_hien_dai' | string;
  nhan: string;
  ghi_chu?: string;
}

export interface KBTranhNhamItem {
  ten: string;
  diem_khac_biet: string;
}

export interface KBTrangPhuc {
  id: string;
  ten: string;
  nhom: KBNhom;
  thoi_ky: string;
  boi_canh_su_dung: string[];
  bo_phan: {
    co?: string;
    tay?: string;
    than?: string;
    vat_lieu?: string;
    [key: string]: string | undefined;
  };
  mau_truyen_thong: Array<{ mau?: string; y_nghia?: string } | string>;
  phu_kien: string[];
  nen_lam: string[];
  khong_nen_khi_remix: Array<{ noi_dung?: string; loai_quy_tac?: string; can_cu?: string } | string>;
  dac_diem_nhan_dien_hinh_anh: string[];
  tranh_nham_voi: KBTranhNhamItem[];
  goi_y_phoi_do: KBGoiYItem[];
  mo_ta_prompt_anh_en: string;
  mo_ta_goi_y_phoi_en: string;
  ho_tro_uom_thu: string;
  muc_chac_chan: KBMucChacChan;
  nguon: string[];
  ghi_chu_can_kiem_chung?: string;
}

export interface KBDatabase {
  phien_ban: string;
  ghi_chu: string;
  nguon: KBNguonMap;
  trang_phuc: KBTrangPhuc[];
}
