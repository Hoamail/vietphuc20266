import { KBTrangPhuc, KBMucChacChan } from '../types/kb';
import { BoiCanhItem, BoiCanhMucRemix } from '../types/boiCanh';
import { GuardianResult, GuardianLyDoItem, GuardianNhan } from '../types/vietphuc';
import {
  getTrangPhucById,
  getMucChacChanLabel,
  getAccessoriesForGarment,
} from '../data/kb';

export interface ComputeGuardianParams {
  outfit: KBTrangPhuc;
  boiCanh: BoiCanhItem;
  remixLevel: 1 | 2 | 3;
  selectedAccessoryIds: string[];
}

const REMIX_ORDER: Record<BoiCanhMucRemix, 1 | 2 | 3> = {
  truyen_thong: 1,
  cach_tan_nhe: 2,
  remix_streetwear: 3,
};

const REMIX_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Truyền thống',
  2: 'Cách tân nhẹ',
  3: 'Remix streetwear',
};

const MODERN_ACCESSORY_SHORT_NAMES: Record<string, string> = {
  'gy-ao_ngu_than_tay_chen-2': 'Quần âu Tây, giày da / giày thể thao',
  'gy-ao_tac-2': 'Giày da Oxford/Chelsea boots & kính râm retro',
  'gy-ao_giao_linh-2': 'Quần culottes / giày boots da cổ thấp',
  'gy-ao_tu_than-2': 'Chân váy xếp ly / quần ống loe',
  'gy-ao_dai_tan_thoi-2': 'Quần jeans, quần âu, giày sneaker / cao gót',
  'gy-ao_ba_ba-2': 'Quần jeans ôm, giày búp bê trơn',
};

export function getShortModernAccessoryName(accId: string, rawName?: string): string {
  if (MODERN_ACCESSORY_SHORT_NAMES[accId]) {
    return MODERN_ACCESSORY_SHORT_NAMES[accId];
  }
  if (!rawName) return accId;
  return rawName.length > 55 ? `${rawName.slice(0, 52).trim()}...` : rawName;
}

export function isInsufficientBasisResult(result?: GuardianResult | null): boolean {
  if (!result) return false;
  return (
    result.nhan === 'hai_hoa' &&
    Array.isArray(result.ly_do) &&
    result.ly_do.some((item) => item.loai === 'thieu_can_cu')
  );
}

/**
 * Tính toán đồng bộ kết quả Cultural Guardian ở Frontend dựa trên bộ quy tắc minh bạch.
 * Không gọi AI, trả về đúng kiểu GuardianResult hiện có.
 */
export function computeGuardian({
  outfit,
  boiCanh,
  remixLevel,
  selectedAccessoryIds,
}: ComputeGuardianParams): GuardianResult {
  const lyDo: GuardianLyDoItem[] = [];
  const goiYSua: string[] = [];

  // ============================================================================
  // A. Luôn hiện, chỉ là thông tin, KHÔNG làm đổi nhãn
  // ============================================================================

  // 1. muc_chac_chan của trang phục kèm tối đa 3 mã nguồn chính (chip, thêm "+N" nếu còn).
  //    Nếu thap hoặc trung_binh thì thêm dòng "Dữ liệu trang phục này chưa chắc chắn đầy đủ".
  const certaintyLabel = getMucChacChanLabel(outfit.muc_chac_chan);
  const outfitSourcesStr =
    Array.isArray(outfit.nguon) && outfit.nguon.length > 0
      ? outfit.nguon.join(',')
      : null;

  const isLowOrMediumCertainty =
    outfit.muc_chac_chan === 'thap' || outfit.muc_chac_chan === 'trung_binh';

  const certaintyLines = [
    `Mức chắc chắn tư liệu của ${outfit.ten}: ${certaintyLabel}.`,
    ...(isLowOrMediumCertainty ? ['Dữ liệu trang phục này chưa chắc chắn đầy đủ'] : []),
  ];

  lyDo.push({
    noi_dung: certaintyLines.join('\n'),
    loai: 'lich_su',
    ma_nguon: outfitSourcesStr,
  });

  // 2. Các luu_y của bối cảnh: mỗi dòng kèm nhãn theo loai
  //    (thong_le_ung_xu = "Thông lệ, không phải quy định"; tham_my = "Gợi ý thẩm mỹ") và nguồn.
  //    nguon_chi_so là chỉ số vào mảng nguon (URL) của bối cảnh; hiển thị tên miền, bấm mở tab mới.
  if (Array.isArray(boiCanh.luu_y)) {
    for (const item of boiCanh.luu_y) {
      if (!item || !item.noi_dung) continue;
      const mappedCodes = Array.isArray(item.nguon_chi_so)
        ? item.nguon_chi_so
            .filter(
              (idx) =>
                typeof idx === 'number' &&
                Number.isInteger(idx) &&
                idx >= 0 &&
                Array.isArray(boiCanh.nguon) &&
                idx < boiCanh.nguon.length
            )
            .map((idx) => `BC-${boiCanh.id}-${idx + 1}`)
        : [];

      lyDo.push({
        noi_dung: item.noi_dung,
        loai: item.loai === 'tham_my' ? 'tham_my' : 'thong_le_ung_xu',
        ma_nguon: mappedCodes.length > 0 ? mappedCodes.join(',') : null,
      });
    }
  }

  // 3. Giao lĩnh: dòng "Tính năng thử nghiệm: các nguồn chưa phân biệt rõ với hán phục"
  //    (lấy ý từ ghi_chu_can_kiem_chung và ho_tro_uom_thu của KB).
  //    Quy tắc trong khong_nen_khi_remix hiện kèm nhãn "Thông lệ"; nếu can_cu ghi chưa có nguồn thì ghi "Chưa có nguồn".
  if (outfit.id === 'ao_giao_linh' || outfit.ho_tro_uom_thu === 'thu_nghiem') {
    lyDo.push({
      noi_dung: 'Tính năng thử nghiệm: các nguồn chưa phân biệt rõ với hán phục',
      loai: 'lich_su',
      ma_nguon: outfitSourcesStr,
    });
  }

  if (Array.isArray(outfit.khong_nen_khi_remix) && outfit.khong_nen_khi_remix.length > 0) {
    for (const rule of outfit.khong_nen_khi_remix) {
      if (typeof rule === 'string') {
        if (!rule.trim()) continue;
        lyDo.push({
          noi_dung: `Thông lệ: ${rule.trim()}`,
          loai: 'thong_le_ung_xu',
          ma_nguon: null,
        });
      } else if (rule && typeof rule === 'object' && rule.noi_dung) {
        const canCu = typeof rule.can_cu === 'string' ? rule.can_cu.trim() : '';
        const hasNoSourceInCanCu =
          !canCu || /chưa có nguồn/i.test(canCu);
        const detailText = canCu ? ` (${canCu})` : '';
        lyDo.push({
          noi_dung: `Thông lệ: ${rule.noi_dung.trim()}${detailText}`,
          loai: 'thong_le_ung_xu',
          ma_nguon: hasNoSourceInCanCu ? null : outfitSourcesStr,
        });
      }
    }
  }

  // 4. Nếu phụ kiện đã chọn có nhắc "yếm":
  //    "Yếm chỉ là lớp trong dưới áo, không phối như trang phục độc lập (nguyên tắc của app)", loại "Gợi ý của app".
  const allAccessories = getAccessoriesForGarment(outfit);
  const chosenAccessories = allAccessories.filter((acc) =>
    selectedAccessoryIds.includes(acc.id)
  );

  const hasYemSelected = chosenAccessories.some(
    (acc) => /yếm/i.test(acc.name) || /yếm/i.test(acc.rawText)
  );
  if (hasYemSelected) {
    lyDo.push({
      noi_dung:
        'Yếm chỉ là lớp trong dưới áo, không phối như trang phục độc lập (nguyên tắc của app)',
      loai: 'nguyen_tac_app',
      ma_nguon: null,
    });
  }

  // ============================================================================
  // B. Điều kiện làm nhãn thành "can_luu_y" (CHỈ hai điều kiện 5 và 6)
  // ============================================================================
  let hasWarningCondition = false;
  const contextMaxRemixLevel = REMIX_ORDER[boiCanh.muc_remix] || 2;
  const contextRemixLabel = REMIX_LABELS[contextMaxRemixLevel];
  const mucRemixGhiChu = boiCanh.muc_remix_ghi_chu || 'Chưa có nguồn';

  // 5. remixLevel cao hơn muc_remix của bối cảnh (truyen_thong < cach_tan_nhe < remix_streetwear)
  if (remixLevel > contextMaxRemixLevel) {
    hasWarningCondition = true;
    lyDo.push({
      noi_dung: `Bối cảnh này thường ưu tiên mức ${contextRemixLabel}: ${mucRemixGhiChu}`,
      loai: 'thong_le_ung_xu',
      ma_nguon: null,
    });
    goiYSua.push(`Hạ mức cách tân xuống ${contextRemixLabel}`);
  }

  // 6. Có phụ kiện hiện đại đã chọn (id dạng gy-<id>-2) và muc_remix của bối cảnh là truyen_thong
  const chosenModernAccessories = chosenAccessories.filter((acc) =>
    /^gy-.+-2$/.test(acc.id)
  );
  if (boiCanh.muc_remix === 'truyen_thong' && chosenModernAccessories.length > 0) {
    hasWarningCondition = true;
    lyDo.push({
      noi_dung: `Phụ kiện hiện đại có thể chưa hợp bối cảnh này: ${mucRemixGhiChu}`,
      loai: 'thong_le_ung_xu',
      ma_nguon: null,
    });
    const shortNames = chosenModernAccessories.map((acc) =>
      getShortModernAccessoryName(acc.id, acc.name)
    );
    goiYSua.push(`Bỏ phụ kiện: ${shortNames.join(', ')}`);
  }

  // ============================================================================
  // C. Chưa đủ căn cứ (Mục 7)
  // ============================================================================
  const isOutfitInPriority =
    Array.isArray(boiCanh.nen_uu_tien) &&
    boiCanh.nen_uu_tien.some((item) => item.trang_phuc_id === outfit.id);

  if (!isOutfitInPriority) {
    lyDo.push({
      noi_dung: 'Chưa đủ căn cứ: dữ liệu bối cảnh chưa nêu trang phục này',
      loai: 'thieu_can_cu',
      ma_nguon: null,
    });

    if (Array.isArray(boiCanh.nen_uu_tien) && boiCanh.nen_uu_tien.length > 0) {
      const priorityDescriptions = boiCanh.nen_uu_tien.map((item) => {
        const tp = getTrangPhucById(item.trang_phuc_id);
        const tpName = tp ? tp.ten : item.trang_phuc_id;
        return `${tpName} (${item.ly_do})`;
      });
      goiYSua.push(
        `Dữ liệu của bối cảnh này ưu tiên: ${priorityDescriptions.join('; ')}`
      );
    }
  }

  // ============================================================================
  // D. Kết luận nhan, do_chac_chan, goi_y_sua
  // ============================================================================
  const nhan: GuardianNhan = hasWarningCondition ? 'can_luu_y' : 'hai_hoa';
  const doChacChan: KBMucChacChan = !isOutfitInPriority
    ? 'thap'
    : outfit.muc_chac_chan;
  const uniqueGoiYSua = Array.from(new Set(goiYSua)).slice(0, 3);

  return {
    nhan,
    diem_hai_hoa_mau: null,
    ly_do: lyDo,
    goi_y_sua: uniqueGoiYSua,
    do_chac_chan: doChacChan,
  };
}
