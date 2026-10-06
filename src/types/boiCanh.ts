import { KBMucChacChan } from './kb';

export type BoiCanhId =
  | 'di_chua_noi_ton_nghiem'
  | 'chup_ky_yeu'
  | 'tet_le_hoi'
  | 'cuoi_le_truyen_thong'
  | 'di_choi_dao_pho';

export type BoiCanhLuuYLoai = 'thong_le_ung_xu' | 'tham_my';

export type BoiCanhMucRemix = 'truyen_thong' | 'cach_tan_nhe' | 'remix_streetwear';

export interface BoiCanhNenUuTien {
  trang_phuc_id: string;
  ly_do: string;
}

export interface BoiCanhLuuY {
  noi_dung: string;
  loai: BoiCanhLuuYLoai;
  nguon_chi_so: number[];
}

export interface BoiCanhItem {
  id: BoiCanhId;
  ten: string;
  tinh_than: string;
  nen_uu_tien: BoiCanhNenUuTien[];
  luu_y: BoiCanhLuuY[];
  muc_remix: BoiCanhMucRemix;
  muc_remix_ghi_chu: string;
  muc_chac_chan: KBMucChacChan;
  nguon: string[];
}
