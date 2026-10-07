import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Scale,
  Share2,
  Check,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles,
  AlertCircle,
  MapPin,
  ShoppingBag,
  X,
  CheckSquare,
  Search,
  Camera,
} from 'lucide-react';
import {
  getTrangPhucById,
  KB_TRANG_PHUC,
  BOI_CANH,
  getBoiCanhById,
  POTTERY_SILK_PALETTES,
  getAccessoriesForGarment,
  KB_NGUON,
  getLoaiNguonLabel,
  getMucChacChanLabel,
  formatNguonText,
  getOutfitHoverNote,
} from '../data/kb';
import { RemixCustomization, SavedLook, WeatherCondition, StylistPhuongAn, OptionGuardianState } from '../types/vietphuc';
import { KBTrangPhuc } from '../types/kb';
import { GuardianBadge } from '../components/GuardianBadge';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { SourceCitationText } from '../components/SourceCitationText';

interface ResultScreenProps {
  selectedOutfitId: string;
  customization: RemixCustomization;
  onBackToCustomize: () => void;
  onSaveToLookbook: (item: SavedLook) => void;
  onAddToCompare: (outfitId: string) => void;
  isSavedInLookbook: boolean;
  isInCompare: boolean;
  onNavigateToLookbook: () => void;
  onNavigateToCompare: () => void;
  onOpenImageGuardian?: (outfitId: string) => void;
}

function resolveCitedSources(nguonChiSo: number[] | undefined, nguonList: string[]): string[] {
  if (!Array.isArray(nguonList) || nguonList.length === 0) return [];
  if (!Array.isArray(nguonChiSo) || nguonChiSo.length === 0) return [];
  return nguonChiSo
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < nguonList.length)
    .map((idx) => nguonList[idx]);
}

function formatWeatherSummary(w: WeatherCondition): string {
  const seasonMap: Record<WeatherCondition['season'], string> = {
    xuan: 'Mùa Xuân',
    ha: 'Mùa Hạ',
    thu: 'Mùa Thu',
    dong: 'Mùa Đông',
  };
  const tempMap: Record<WeatherCondition['temperature'], string> = {
    mat_me: 'Mát mẻ',
    nong_am: 'Nắng ấm / Nóng',
    se_lanh: 'Se lạnh',
  };
  const todMap: Record<WeatherCondition['timeOfDay'], string> = {
    buoi_sang: 'Buổi sáng',
    buoi_chieu: 'Buổi chiều',
    buoi_toi: 'Buổi tối',
  };
  return `${seasonMap[w.season] || w.season} · ${tempMap[w.temperature] || w.temperature} · ${todMap[w.timeOfDay] || w.timeOfDay}`;
}

function formatHuunhamText(text: string): string {
  if (!text) return '';
  return text
    .replace(/hữu nhậm/gi, 'vạt trái phủ ngoài vạt phải')
    .replace(/tả nhậm/gi, 'vạt phải phủ ngoài vạt trái');
}

const POPULAR_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Huế', 'Đà Nẵng', 'Hội An', 'Cần Thơ', 'Hải Phòng'];

const SEARCH_TERMS: Record<string, { cuThe: string; rong: string }> = {
  ao_ngu_than_tay_chen: { cuThe: 'áo dài ngũ thân', rong: 'cổ phục' },
  ao_tac: { cuThe: 'áo tấc', rong: 'cổ phục' },
  ao_giao_linh: { cuThe: 'áo giao lĩnh', rong: 'cổ phục' },
  ao_tu_than: { cuThe: 'áo tứ thân', rong: 'trang phục truyền thống' },
  ao_dai_tan_thoi: { cuThe: 'áo dài', rong: 'áo dài' },
  ao_ba_ba: { cuThe: 'áo bà ba', rong: 'trang phục truyền thống' },
};

interface RentalSearchModalProps {
  outfit: KBTrangPhuc;
  phuongAn: StylistPhuongAn;
  onClose: () => void;
}

const RentalSearchModal: React.FC<RentalSearchModalProps> = ({ outfit, phuongAn, onClose }) => {
  const [city, setCity] = useState('');
  const [actionType, setActionType] = useState<'thue' | 'mua'>('thue');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const terms = SEARCH_TERMS[outfit.id] || {
    cuThe: outfit.ten,
    rong: 'trang phục truyền thống',
  };

  const hanhDong = actionType === 'thue' ? 'cho thuê' : 'mua';
  const cleanCity = city.trim();

  // (a) Search Google Maps: query = `${hanhDong} ${rong} ${cleanCity}`
  const mapsQuery = `${hanhDong} ${terms.rong}${cleanCity ? ` ${cleanCity}` : ''}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  // (b) Search Google: query = `${hanhDong} ${cuThe} ${cleanCity}`
  const googleQuery = `${hanhDong} ${terms.cuThe}${cleanCity ? ` ${cleanCity}` : ''}`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;

  const dacDiemList =
    Array.isArray(outfit.dac_diem_nhan_dien_hinh_anh) && outfit.dac_diem_nhan_dien_hinh_anh.length > 0
      ? outfit.dac_diem_nhan_dien_hinh_anh
      : [];
  const vatLieu = outfit.bo_phan?.vat_lieu ? outfit.bo_phan.vat_lieu : null;
  const phuKienList =
    Array.isArray(outfit.phu_kien) && outfit.phu_kien.length > 0 ? outfit.phu_kien : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/55 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#F8F6F0] rounded-2xl border border-[#DED7C6] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-[#161A1D]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#DED7C6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D]">
                Tìm Nơi Thuê / Mua Trang Phục
              </h3>
              <p className="text-xs text-[#4A5560]">
                Trang phục:{' '}
                <span title={getOutfitHoverNote(outfit)} className="font-semibold text-[#1E3F5A]">
                  {outfit.ten}
                </span>{' '}
                · {phuongAn.ten}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-[#EFECE3] text-[#4A5560] hover:text-[#161A1D] cursor-pointer transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Lựa chọn Thuê / Mua */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1E3F5A] uppercase tracking-wider">
              Nhu cầu của bạn
            </label>
            <div className="inline-flex p-1 rounded-xl bg-[#EFECE3] border border-[#DED7C6] gap-1">
              <button
                type="button"
                onClick={() => setActionType('thue')}
                className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  actionType === 'thue'
                    ? 'bg-[#B93826] text-white shadow-2xs'
                    : 'text-[#4A5560] hover:text-[#161A1D]'
                }`}
              >
                Thuê
              </button>
              <button
                type="button"
                onClick={() => setActionType('mua')}
                className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  actionType === 'mua'
                    ? 'bg-[#B93826] text-white shadow-2xs'
                    : 'text-[#4A5560] hover:text-[#161A1D]'
                }`}
              >
                Mua
              </button>
            </div>
          </div>

          {/* Mục (1): Nhập thành phố/tỉnh của Việt Nam (tự gõ, không dùng định vị) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E3F5A] uppercase tracking-wider">
              1. Nhập thành phố / tỉnh thành (Việt Nam)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#4A5560] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh, Huế, Đà Nẵng..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2.5 rounded-xl border border-[#DED7C6] bg-white text-xs text-[#161A1D] placeholder:text-[#6C7A87] focus:outline-none focus:ring-2 focus:ring-[#B93826]/30 focus:border-[#B93826]"
              />
            </div>
            {/* Quick chips chọn nhanh */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-[#4A5560] py-0.5">Gợi ý nhanh:</span>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    cleanCity.toLowerCase() === c.toLowerCase()
                      ? 'bg-[#1E3F5A] text-white border-[#1E3F5A]'
                      : 'bg-white text-[#4A5560] border-[#DED7C6] hover:bg-[#FAF8F5] hover:text-[#161A1D]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#4A5560] italic">
              * Người dùng tự gõ địa phương mong muốn; hệ thống không sử dụng định vị GPS và không lưu dữ liệu.
            </p>
          </div>

          {/* Mục (2): Hai nút "Search Google Maps" và "Search Google" mở tab mới */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-[#1E3F5A] uppercase tracking-wider">
              2. Tìm kiếm điểm may / thuê
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#B93826] hover:bg-[#8E2516] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs text-center"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Search Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>

              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs text-center"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>Search Google</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>
            </div>

            {/* Hiển thị từ khoá tìm kiếm của từng nút */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-[#DED7C6] font-mono text-xs text-[#4A5560] break-all">
              <div>
                Maps: <span className="font-semibold text-[#161A1D]">"{mapsQuery}"</span>
              </div>
              <div>
                Google: <span className="font-semibold text-[#161A1D]">"{googleQuery}"</span>
              </div>
            </div>

            {/* Mục (4): Khối Mẹo của app */}
            <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6] space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-[#7C4D1B] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C88E1B]" />
                  <span>Mẹo của app</span>
                </span>
                <span className="text-xs text-[#7C4D1B] bg-white px-2 py-0.5 rounded-md border border-[#C88E1B]/35 font-semibold">
                  Mẹo tìm kiếm, không phải thông tin văn hoá hay danh sách tiệm
                </span>
              </div>
              <p className="text-[#4E3B26] leading-relaxed">
                Nếu Google Maps không ra kết quả (thường gặp ở trang phục ít phổ biến hoặc ở tỉnh nhỏ), bạn hãy thử nút <strong>"Search Google"</strong>, thử tìm ở thành phố lớn gần nhất, hoặc hỏi tiệm áo dài / cổ phục về đặt may.
              </p>
            </div>
          </div>

          {/* Mục (3): Checklist "Nên hỏi tiệm" lấy từ KB */}
          <div className="space-y-2.5 pt-2 border-t border-[#DED7C6]">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#1E3F5A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#C88E1B]" />
                <span>3. Checklist nên hỏi tiệm (từ tư liệu KB-v3)</span>
              </label>
              <span className="text-xs text-[#4A5560]">Bấm để đánh dấu</span>
            </div>
            <p className="text-xs text-[#4A5560]">
              Đối chiếu kỹ cấu tạo, chất liệu và phụ kiện chuẩn xác khi kiểm tra trang phục tại tiệm:
            </p>

            {/* Cấu tạo cần có (từ dac_diem_nhan_dien_hinh_anh) */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DED7C6] space-y-2">
              <div className="text-xs font-bold text-[#1E3F5A]">
                • Cấu tạo cần có (Đặc điểm nhận diện hình ảnh):
              </div>
              {dacDiemList.length > 0 ? (
                <div className="space-y-2">
                  {dacDiemList.map((item, idx) => {
                    const key = `dd_${idx}`;
                    const isChecked = Boolean(checkedItems[key]);
                    return (
                      <label
                        key={key}
                        onClick={() => toggleCheck(key)}
                        className="flex items-start gap-2.5 text-xs text-[#161A1D] cursor-pointer select-none py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded border-[#C8BEAA] text-[#B93826] focus:ring-0 cursor-pointer shrink-0"
                        />
                        <span className={isChecked ? 'line-through text-[#6C7A87]' : 'leading-relaxed'}>
                          {formatHuunhamText(item)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-[#4A5560] italic">Chưa có nguồn</div>
              )}
            </div>

            {/* Chất liệu (bo_phan.vat_lieu nếu có) */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DED7C6] space-y-2">
              <div className="text-xs font-bold text-[#1E3F5A]">
                • Chất liệu:
              </div>
              {vatLieu ? (
                <label
                  onClick={() => toggleCheck('vl_0')}
                  className="flex items-start gap-2.5 text-xs text-[#161A1D] cursor-pointer select-none py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems['vl_0'])}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded border-[#C8BEAA] text-[#B93826] focus:ring-0 cursor-pointer shrink-0"
                  />
                  <span className={checkedItems['vl_0'] ? 'line-through text-[#6C7A87]' : 'leading-relaxed'}>
                    {formatHuunhamText(vatLieu)}
                  </span>
                </label>
              ) : (
                <div className="text-xs text-[#4A5560] italic">Chưa có nguồn</div>
              )}
            </div>

            {/* Phụ kiện đi kèm (từ phu_kien) */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DED7C6] space-y-2">
              <div className="text-xs font-bold text-[#1E3F5A]">
                • Phụ kiện đi kèm:
              </div>
              {phuKienList.length > 0 ? (
                <div className="space-y-2">
                  {phuKienList.map((item, idx) => {
                    const key = `pk_${idx}`;
                    const isChecked = Boolean(checkedItems[key]);
                    return (
                      <label
                        key={key}
                        onClick={() => toggleCheck(key)}
                        className="flex items-start gap-2.5 text-xs text-[#161A1D] cursor-pointer select-none py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded border-[#C8BEAA] text-[#B93826] focus:ring-0 cursor-pointer shrink-0"
                        />
                        <span className={isChecked ? 'line-through text-[#6C7A87]' : 'leading-relaxed'}>
                          {formatHuunhamText(item)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-[#4A5560] italic">Chưa có nguồn</div>
              )}
            </div>
          </div>

          {/* Minh bạch */}
          <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] text-xs text-[#4A5560]">
            Hệ thống không tạo danh sách cửa hàng, không bịa tên tiệm, không gọi API ngoài hay lưu dữ liệu người dùng. Kết quả tìm kiếm mở trực tiếp trên Google Maps hoặc Google; app không biết kết quả có hay không và không lưu dữ liệu.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#DED7C6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#1E3F5A] text-white text-xs font-semibold rounded-xl hover:bg-[#12283A] transition-colors cursor-pointer"
          >
            Đóng bảng
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  selectedOutfitId,
  customization,
  onBackToCustomize,
  onSaveToLookbook,
  onAddToCompare,
  isSavedInLookbook,
  isInCompare,
  onOpenImageGuardian,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'styling' | 'anatomy' | 'history'>('styling');
  const [rentalModalPa, setRentalModalPa] = useState<StylistPhuongAn | null>(null);

  // State cho phương án Stylist từ /api/style (giữ kèm exp và token)
  const [phuongAnList, setPhuongAnList] = useState<StylistPhuongAn[]>([]);
  const [isLoadingStyle, setIsLoadingStyle] = useState<boolean>(true);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [styleErrorReason, setStyleErrorReason] = useState<string | null>(null);
  const lastFetchedKeyRef = useRef<string | null>(null);

  // State Cultural Guardian cho từng phương án (key = pa.token)
  const [guardianStates, setGuardianStates] = useState<Record<string, OptionGuardianState>>({});
  // Set lưu các token phương án đã hoặc đang được gửi đi thẩm định Guardian (ngăn vòng lặp tuyệt đối)
  const evaluatedTokensRef = useRef<Set<string>>(new Set());

  const outfit = getTrangPhucById(selectedOutfitId) || KB_TRANG_PHUC[0];
  const boiCanh = getBoiCanhById(customization.purposeId) || BOI_CANH[0];
  const colorScheme =
    POTTERY_SILK_PALETTES.find((c) => c.id === customization.colorSchemeId) || POTTERY_SILK_PALETTES[0];

  const accessoryOptions = useMemo(() => getAccessoriesForGarment(outfit), [outfit.id]);

  const selectedAccessoriesKey = useMemo(() => {
    return (customization.selectedAccessoryIds || []).slice().sort().join(',');
  }, [customization.selectedAccessoryIds]);

  const validSelectedAccessoryIds = useMemo(() => {
    return (customization.selectedAccessoryIds || []).filter((id) =>
      accessoryOptions.some((opt) => opt.id === id)
    );
  }, [selectedAccessoriesKey, accessoryOptions]);

  const selectedAccessories = useMemo(() => {
    return accessoryOptions.filter((a) => validSelectedAccessoryIds.includes(a.id));
  }, [accessoryOptions, validSelectedAccessoryIds]);

  const requestPayload = useMemo(() => ({
    outfitId: outfit.id,
    purposeId: boiCanh.id,
    remixLevel: customization.remixLevel,
    colorSchemeId: colorScheme.id,
    selectedAccessoryIds: validSelectedAccessoryIds,
    weather: customization.weather,
  }), [
    outfit.id,
    boiCanh.id,
    customization.remixLevel,
    colorScheme.id,
    validSelectedAccessoryIds,
    customization.weather,
  ]);

  const requestKey = useMemo(() => JSON.stringify(requestPayload), [requestPayload]);

  // Luôn giữ tham chiếu params mới nhất trong ref để async hàm Guardian đọc được mà không biến đổi dependency
  const currentParamsRef = useRef(requestPayload);
  useEffect(() => {
    currentParamsRef.current = requestPayload;
  }, [requestPayload]);

  const fetchStyleOptions = useCallback(async () => {
    setIsLoadingStyle(true);
    setStyleError(null);
    setStyleErrorReason(null);
    setGuardianStates({});
    evaluatedTokensRef.current.clear();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 31000);

    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestKey,
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setPhuongAnList([]);
        setStyleError('Chưa kiểm tra được');
        setStyleErrorReason('bad_json');
        setIsLoadingStyle(false);
        return;
      }

      if (
        !res.ok ||
        !data ||
        data.success !== true ||
        !Array.isArray(data.phuong_an) ||
        data.phuong_an.length === 0
      ) {
        setPhuongAnList([]);
        if (res.status === 429 && data?.message === 'Hệ thống đã đạt giới hạn hôm nay') {
          setStyleError('Chưa kiểm tra được (Hệ thống đã đạt giới hạn hôm nay)');
        } else if (res.status === 429 || data?.reason === 'quota') {
          setStyleError('Chưa kiểm tra được (Hệ thống đang tạm thời quá tải, vui lòng thử lại sau)');
        } else {
          setStyleError('Chưa kiểm tra được');
        }
        setStyleErrorReason(
          typeof data?.reason === 'string' && data.reason.trim()
            ? data.reason.trim()
            : `http_${res.status}`
        );
        setIsLoadingStyle(false);
        return;
      }

      setPhuongAnList(data.phuong_an as StylistPhuongAn[]);
      setStyleError(null);
      setStyleErrorReason(null);
      setIsLoadingStyle(false);
    } catch (err: any) {
      window.clearTimeout(timeoutId);
      setPhuongAnList([]);
      setStyleError('Chưa kiểm tra được');
      setStyleErrorReason(err?.name === 'AbortError' ? 'timeout' : 'network');
      setIsLoadingStyle(false);
    }
  }, [requestKey]);

  // Gọi /api/style ĐÚNG 1 LẦN khi mount hoặc khi requestKey thực sự thay đổi
  useEffect(() => {
    if (lastFetchedKeyRef.current === requestKey) {
      return;
    }
    lastFetchedKeyRef.current = requestKey;
    fetchStyleOptions();
  }, [requestKey, fetchStyleOptions]);

  const handleRetryStyle = () => {
    lastFetchedKeyRef.current = null;
    fetchStyleOptions();
  };

  // Hàm gọi POST /api/guard cho từng phương án với tham chiếu ổn định tuyệt đối (rỗng dependencies)
  const evaluateOptionGuardian = useCallback(
    async (pa: StylistPhuongAn, isManualRetry = false) => {
      if (!pa || !pa.token) return;

      // Nếu không phải thao tác bấm thử lại thủ công và token đã có trong hàng đợi/đã gọi -> bỏ qua
      if (!isManualRetry && evaluatedTokensRef.current.has(pa.token)) {
        return;
      }

      // Đánh dấu ngay token để tránh race condition
      evaluatedTokensRef.current.add(pa.token);

      setGuardianStates((prev) => ({
        ...prev,
        [pa.token]: { status: 'loading' },
      }));

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 31000);

      const params = currentParamsRef.current;

      try {
        const res = await fetch('/api/guard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outfitId: params.outfitId,
            purposeId: params.purposeId,
            remixLevel: params.remixLevel,
            colorSchemeId: params.colorSchemeId,
            selectedAccessoryIds: params.selectedAccessoryIds,
            weather: params.weather,
            phuong_an: {
              ten: pa.ten,
              mo_ta: pa.mo_ta,
              thanh_phan: pa.thanh_phan,
              ly_do_van_hoa: pa.ly_do_van_hoa,
              ma_nguon: pa.ma_nguon,
              goi_y_cua_app: pa.goi_y_cua_app,
            },
            exp: pa.exp,
            token: pa.token,
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          setGuardianStates((prev) => ({
            ...prev,
            [pa.token]: { status: 'error' },
          }));
          return;
        }

        if (!res.ok || !data || data.success !== true || !data.guardian) {
          // Xử lý an toàn khi backend báo 429 hoặc 503: hiển thị "Chưa kiểm tra được", tuyệt đối KHÔNG tự retry
          setGuardianStates((prev) => ({
            ...prev,
            [pa.token]: { status: 'error' },
          }));
          return;
        }

        setGuardianStates((prev) => ({
          ...prev,
          [pa.token]: {
            status: 'success',
            result: data.guardian,
          },
        }));
      } catch {
        window.clearTimeout(timeoutId);
        // Khi lỗi mạng, timeout: hiển thị an toàn "Chưa kiểm tra được"
        setGuardianStates((prev) => ({
          ...prev,
          [pa.token]: { status: 'error' },
        }));
      }
    },
    []
  );

  // Sau khi có phương án từ /api/style, gọi /api/guard ĐÚNG 1 LẦN cho mỗi phương án mới (tối đa 3)
  useEffect(() => {
    if (!phuongAnList || phuongAnList.length === 0) {
      return;
    }

    const itemsToEvaluate = phuongAnList.slice(0, 3).filter(
      (pa) => pa && pa.token && !evaluatedTokensRef.current.has(pa.token)
    );

    if (itemsToEvaluate.length === 0) {
      return;
    }

    // Đánh dấu ngay vào Set trước khi gọi để chặn bất kỳ re-render loop hay duplicate request nào
    itemsToEvaluate.forEach((pa) => {
      evaluatedTokensRef.current.add(pa.token);
    });

    itemsToEvaluate.forEach((pa) => {
      evaluateOptionGuardian(pa, true);
    });
  }, [phuongAnList, evaluateOptionGuardian]);

  const renderPhuongAnSourceItem = (code: string) => {
    // 1. Nguồn từ KB-v3
    const kbSrc = KB_NGUON[code];
    if (kbSrc) {
      return (
        <div key={code} className="inline-flex flex-wrap items-center gap-1.5">
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25">
            [{code}]
          </span>
          {kbSrc.url ? (
            <a
              href={kbSrc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E3F5A] font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>{kbSrc.ten}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-[#161A1D] font-medium">{kbSrc.ten}</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DED7C6] text-[#4A5560] font-semibold">
            {getLoaiNguonLabel(kbSrc.loai)}
          </span>
        </div>
      );
    }

    // 2. Nguồn bối cảnh BC-<id_boi_canh>-<n>
    const bcMatch = /^BC-([a-z0-9_]+)-(\d+)$/i.exec(code);
    if (bcMatch) {
      const bcId = bcMatch[1];
      const oneBasedIdx = parseInt(bcMatch[2], 10);
      const targetBc = getBoiCanhById(bcId) || boiCanh;
      const url =
        targetBc && Array.isArray(targetBc.nguon) && oneBasedIdx >= 1 && oneBasedIdx <= targetBc.nguon.length
          ? targetBc.nguon[oneBasedIdx - 1]
          : undefined;

      let domain = code;
      if (url) {
        try {
          domain = new URL(url).hostname.replace(/^www\./i, '');
        } catch {
          domain = url;
        }
      }

      return (
        <div key={code} className="inline-flex flex-wrap items-center gap-1.5">
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25">
            [{code}]
          </span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E3F5A] font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>{domain}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-[#161A1D] font-medium">{domain}</span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#FDF9F0] border border-[#C88E1B]/35 text-[#7C4D1B] font-semibold">
            thông lệ/gợi ý
          </span>
        </div>
      );
    }

    return (
      <span key={code} className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25">
        [{code}]
      </span>
    );
  };

  const renderPhuongAnSource = (maNguon: string[] | string | null) => {
    const list = Array.isArray(maNguon) ? maNguon : maNguon ? [maNguon] : [];
    if (list.length === 0) {
      return <span className="text-[#4A5560] italic">Chưa có nguồn</span>;
    }

    return (
      <div className="inline-flex flex-wrap items-center gap-2">
        {list.map((code) => renderPhuongAnSourceItem(code))}
      </div>
    );
  };

  const getRemixLevelTitle = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return 'Truyền thống';
      case 2:
        return 'Cách tân nhẹ';
      case 3:
      default:
        return 'Remix streetwear';
    }
  };

  const levelName = getRemixLevelTitle(customization.remixLevel);
  const resultTitle = `${outfit.ten} · Phối ${colorScheme.name}`;
  const resultSubtitle = `${boiCanh.ten} · Phong cách ${levelName}`;

  const priorityRecommendation = boiCanh.nen_uu_tien.find(
    (item) => item.trang_phuc_id === outfit.id
  );

  const sourceDetails = outfit.nguon.map((code) => {
    const info = KB_NGUON[code];
    return {
      code,
      ten: info ? info.ten : code,
      loai: info ? getLoaiNguonLabel(info.loai) : 'Chưa xác định',
      url: info?.url,
    };
  });

  const handleSaveLook = () => {
    const enrichedOptions = phuongAnList.map((pa) => ({
      ...pa,
      guardian: guardianStates[pa.token]?.result,
    }));

    const newLook: SavedLook = {
      id: `look-${Date.now()}`,
      title: resultTitle,
      outfitId: outfit.id,
      purposeId: boiCanh.id,
      customization,
      savedAt: new Date().toISOString(),
      tags: [
        outfit.ten,
        colorScheme.name.split(' ')[0],
        levelName,
        boiCanh.ten,
      ],
      notes: `Bối cảnh: ${boiCanh.ten} (${levelName}) · Điều kiện: ${formatWeatherSummary(customization.weather)}.`,
      stylistOptions: enrichedOptions.length > 0 ? enrichedOptions : undefined,
    };
    onSaveToLookbook(newLook);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBackToCustomize}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DED7C6] hover:border-[#1E3F5A] text-xs font-semibold text-[#161A1D] hover:text-[#1E3F5A] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tùy biến lại</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add to Compare */}
          <button
            type="button"
            onClick={() => onAddToCompare(outfit.id)}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isInCompare
                ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/35'
                : 'bg-white text-[#4A5560] border-[#DED7C6] hover:border-[#1E3F5A] hover:text-[#161A1D]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>{isInCompare ? 'Đã thêm So sánh' : 'Thêm vào So sánh'}</span>
          </button>

          {/* Save to Lookbook */}
          <button
            type="button"
            onClick={handleSaveLook}
            className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSavedInLookbook
                ? 'bg-[#E9F2EE] text-[#2E6254] border border-[#2E6254]/35'
                : 'bg-[#B93826] hover:bg-[#8E2516] text-white shadow-xs'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{isSavedInLookbook ? 'Đã lưu Lookbook' : 'Lưu vào Lookbook'}</span>
          </button>

          {/* Kiểm tra ảnh (Image Guardian) */}
          {onOpenImageGuardian && (
            <button
              type="button"
              onClick={() => onOpenImageGuardian(outfit.id)}
              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#1E3F5A] bg-[#1E3F5A] hover:bg-[#12283A] text-white shadow-xs"
              title="Kiểm tra ảnh trang phục thực tế với Cultural Guardian"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Kiểm tra ảnh</span>
            </button>
          )}

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-[#DED7C6] bg-white text-[#4A5560] hover:text-[#161A1D] hover:border-[#1E3F5A] flex items-center justify-center cursor-pointer transition-colors"
            title="Sao chép liên kết"
            aria-label="Sao chép liên kết"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#2E6254]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="heritage-card rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: Always Vector SVG */}
          <div className="md:col-span-5 bg-[#FAF8F3] relative flex flex-col justify-between overflow-hidden p-5 border-b md:border-b-0 md:border-r border-[#DED7C6]">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white text-[#1E3F5A] font-semibold border border-[#DED7C6] shadow-2xs">
                {levelName}
              </span>
              <span className="text-xs text-[#4A5560] font-mono">
                Minh họa Line-art SVG
              </span>
            </div>

            {/* Always SVG Illustration */}
            <div className="relative aspect-[3/4] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-[#DED7C6] p-3 shadow-2xs">
              <OutfitVectorIllustration
                id={outfit.id}
                size="lg"
                className="border-0 bg-transparent w-full h-full"
                colorSchemeId={customization.colorSchemeId}
                selectedAccessoryIds={validSelectedAccessoryIds}
                remixLevel={customization.remixLevel}
              />
            </div>

            <div className="mt-3 text-center text-xs text-[#4A5560]">
              Minh họa vector trung tính line-art theo chuẩn KB-v3
            </div>
          </div>

          {/* Right Column: Detailed Breakdown */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              {/* Header Identity & Hierarchy */}
              <div>
                <div className="flex items-center gap-2 text-xs text-[#4A5560] font-medium mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F3] border border-[#DED7C6] text-[#1E3F5A] font-semibold">
                    {formatNguonText(outfit.thoi_ky)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Bối cảnh: <strong className="text-[#161A1D]">{boiCanh.ten}</strong></span>
                </div>
                <h1
                  title={getOutfitHoverNote(outfit)}
                  className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D] leading-tight"
                >
                  {resultTitle}
                </h1>
                <p className="text-xs sm:text-sm text-[#4A5560] mt-1.5">
                  {resultSubtitle} · {formatWeatherSummary(customization.weather)}
                </p>
              </div>

              {/* ĐIỂM NHẤN CHÍNH: Cultural Guardian Focal Panel */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#F4F7FA] via-[#FAF8F3] to-[#F3EFE4] border-2 border-[#1E3F5A]/25 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1E3F5A]" aria-hidden="true" />
                    <span>Điểm nhấn thẩm định · Cultural Guardian (KB-v3)</span>
                  </span>
                  <span className="text-xs font-mono text-[#4A5560]">
                    {outfit.nguon.length} nguồn tư liệu
                  </span>
                </div>
                <GuardianBadge
                  label={
                    isLoadingStyle
                      ? 'Chưa kiểm tra'
                      : styleError
                      ? 'Chưa kiểm tra được'
                      : `Mức chắc chắn: ${getMucChacChanLabel(outfit.muc_chac_chan)}`
                  }
                  certaintyLevel={outfit.muc_chac_chan}
                  sources={sourceDetails}
                  warnings={outfit.khong_nen_khi_remix}
                  suggestions={outfit.goi_y_phoi_do}
                />
              </div>

              {/* Detail Tabs */}
              <div className="mt-6 border-b border-[#DED7C6]">
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'styling' as const, label: 'Phương án Stylist & Bối cảnh' },
                    { id: 'anatomy' as const, label: 'Đặc điểm cấu tạo' },
                    { id: 'history' as const, label: 'Nguồn gốc & Lịch sử' },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative min-h-[44px] px-3 py-2 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          isActive
                            ? 'text-[#1E3F5A]'
                            : 'text-[#4A5560] hover:text-[#161A1D]'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="resultDetailTabLine"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3F5A] rounded-full"
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Tab 1: Phương án Stylist & Bối cảnh */}
                  {activeTab === 'styling' && (
                    <div className="mt-4 space-y-5">
                      {/* Banner Kiểm tra ảnh trang phục với Cultural Guardian */}
                      {onOpenImageGuardian && (
                        <div className="p-4 rounded-2xl bg-[#EBF2F7] border border-[#1E3F5A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#1E3F5A]">
                                Kiểm tra ảnh thực tế với Cultural Guardian
                              </div>
                              <div className="text-xs text-[#4A5560] mt-0.5">
                                Tải ảnh trang phục của bạn để AI Vision đối chiếu trực quan với quy chuẩn{' '}
                                <span title={getOutfitHoverNote(outfit)} className="font-semibold text-[#161A1D]">
                                  {outfit.ten}
                                </span>
                                .
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenImageGuardian(outfit.id)}
                            className="min-h-[44px] px-3.5 py-2 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-center flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Kiểm tra ảnh ngay</span>
                          </button>
                        </div>
                      )}

                      {/* Khối Phương án phối đồ từ /api/style */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#C88E1B]" />
                            <span>Phương án phối đồ đề xuất</span>
                          </h2>
                          {!isLoadingStyle && !styleError && phuongAnList.length > 0 && (
                            <span className="text-xs font-mono text-[#4A5560] bg-[#FAF8F3] px-2.5 py-0.5 rounded-md border border-[#DED7C6]">
                              {phuongAnList.length} phương án
                            </span>
                          )}
                        </div>

                        {/* Skeleton dạng khung xương chi tiết khi chờ */}
                        {isLoadingStyle && (
                          <div className="space-y-4" aria-busy="true" aria-label="Đang tải phương án phối đồ">
                            {[1, 2].map((skeletonIdx) => (
                              <div
                                key={skeletonIdx}
                                className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#DED7C6] space-y-3.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="h-5 w-1/2 heritage-skeleton rounded-lg" />
                                  <div className="h-6 w-28 heritage-skeleton rounded-full" />
                                </div>
                                <div className="space-y-2">
                                  <div className="h-3.5 w-full heritage-skeleton rounded" />
                                  <div className="h-3.5 w-4/5 heritage-skeleton rounded" />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <div className="h-6 w-24 heritage-skeleton rounded-lg" />
                                  <div className="h-6 w-28 heritage-skeleton rounded-lg" />
                                  <div className="h-6 w-20 heritage-skeleton rounded-lg" />
                                </div>
                                <div className="p-3 rounded-xl bg-white border border-[#E8E2D8] space-y-2">
                                  <div className="h-3.5 w-1/3 heritage-skeleton rounded" />
                                  <div className="h-3 w-full heritage-skeleton rounded" />
                                  <div className="h-3 w-2/3 heritage-skeleton rounded" />
                                </div>
                                <div className="h-12 w-full heritage-skeleton rounded-xl" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Khi lỗi: hiện "Chưa kiểm tra được" kèm nút "Thử lại", không hiện nội dung dựng sẵn */}
                        {!isLoadingStyle && styleError && (
                          <div className="p-4 rounded-2xl bg-[#FBEFEF] border border-[#B93826]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-[#B93826] shrink-0 mt-0.5" />
                              <div>
                                <div className="text-xs font-bold text-[#8E2516]">
                                  {styleError}
                                </div>
                                {styleErrorReason && (
                                  <div className="text-xs font-mono text-[#8E2516] mt-0.5">
                                    Mã lỗi: {styleErrorReason}
                                  </div>
                                )}
                                <p className="text-xs text-[#78261A] mt-1 leading-relaxed">
                                  Không thể kiểm tra phương án phối tự động lúc này. Phần cấu tạo và nguồn tư liệu trang phục bên dưới vẫn lấy trực tiếp từ KB-v3.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRetryStyle}
                              className="min-h-[44px] px-4 py-2 bg-[#B93826] hover:bg-[#8E2516] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Thử lại</span>
                            </button>
                          </div>
                        )}

                        {/* Khi thành công: hiện 2-3 thẻ phương án xuất hiện lần lượt */}
                        {!isLoadingStyle && !styleError && phuongAnList.length > 0 && (
                          <div className="space-y-4">
                            {phuongAnList.map((pa, idx) => (
                              <motion.div
                                key={`${pa.token}-${idx}`}
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: shouldReduceMotion ? 0 : 0.24,
                                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#DED7C6] space-y-3.5 text-xs shadow-2xs"
                              >
                                {/* Tên & Mô tả */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D]">
                                    {idx + 1}. {pa.ten}
                                  </h3>
                                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white border border-[#DED7C6] text-[#1E3F5A] font-semibold shrink-0">
                                    Phương án 0{idx + 1}
                                  </span>
                                </div>

                                {/* Điểm nhấn kết quả thẩm định Cultural Guardian của phương án */}
                                <div className="p-3 rounded-xl bg-white border-2 border-[#1E3F5A]/20 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                                  <span className="text-xs font-bold text-[#1E3F5A]">
                                    Kết quả thẩm định Cultural Guardian:
                                  </span>
                                  <GuardianBadge
                                    evaluation={guardianStates[pa.token] || { status: 'loading' }}
                                    onRetry={() => evaluateOptionGuardian(pa, true)}
                                  />
                                </div>

                                <p className="text-[#4A5560] leading-relaxed">
                                  {pa.mo_ta}
                                </p>

                                {/* Thành phần (thanh_phan) */}
                                <div>
                                  <div className="text-xs font-bold text-[#1E3F5A] mb-1.5">
                                    Thành phần bản phối:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {pa.thanh_phan.map((tp, tpIdx) => (
                                      <span
                                        key={tpIdx}
                                        className="px-2.5 py-1 rounded-lg bg-white border border-[#DED7C6] text-[#161A1D] font-medium"
                                      >
                                        {tp}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Lý do văn hoá (ly_do_van_hoa) & Nguồn (ma_nguon) */}
                                <div className="p-3.5 rounded-xl bg-white border border-[#DED7C6] space-y-2">
                                  <div className="text-xs font-bold text-[#1E3F5A]">
                                    Lý do văn hoá & Bối cảnh:
                                  </div>
                                  <p className="text-[#4A5560] leading-relaxed">
                                    {pa.ly_do_van_hoa}
                                  </p>
                                  <div className="pt-2 border-t border-[#EFECE3] flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="font-semibold text-[#4A5560]">Nguồn:</span>
                                    {renderPhuongAnSource(pa.ma_nguon)}
                                  </div>
                                </div>

                                {/* Khối "Gợi ý của app" (goi_y_cua_app) */}
                                <div className="p-3.5 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/35 space-y-2">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-[#7C4D1B]">
                                      Gợi ý của app
                                    </span>
                                    <span className="text-xs font-semibold text-[#7C4D1B] bg-white px-2.5 py-0.5 rounded-md border border-[#C88E1B]/35">
                                      Gợi ý của app, không phải sự thật lịch sử
                                    </span>
                                  </div>
                                  <ul className="space-y-1 text-[#5A4630] list-disc list-inside">
                                    {pa.goi_y_cua_app.map((line, lIdx) => (
                                      <li key={lIdx} className="leading-relaxed">
                                        {line}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Nút Tìm nơi thuê/mua trên mỗi thẻ phương án (B6b) */}
                                <div className="pt-2.5 border-t border-[#E8E2D8] flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs text-[#4A5560]">
                                    Trải nghiệm thực tế phương án này:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRentalModalPa(pa)}
                                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F3] border border-[#DED7C6] hover:border-[#1E3F5A] text-[#1E3F5A] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-[#B93826]" />
                                    <span>Tìm nơi thuê/mua</span>
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Đánh giá bối cảnh tĩnh từ boi-canh.json */}
                      <div className="pt-4 border-t border-[#DED7C6] space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
                          Thông tin bối cảnh từ dữ liệu (boi-canh.json)
                        </div>
                        {priorityRecommendation ? (
                          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="font-bold text-[#1E3F5A] flex items-center gap-1.5">
                                <Info className="w-4 h-4 shrink-0" />
                                <span>Gợi ý của app cho bối cảnh này</span>
                              </div>
                              <span className="text-xs text-[#4A5560] italic">chưa có nguồn</span>
                            </div>
                            <p className="text-[#4A5560] leading-relaxed">{priorityRecommendation.ly_do}</p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] text-xs text-[#4A5560] flex items-center gap-2">
                            <Info className="w-4 h-4 text-[#4A5560] shrink-0" />
                            <span>Chưa có khuyến nghị cho trang phục này trong dữ liệu bối cảnh</span>
                          </div>
                        )}

                        {/* Lưu ý của bối cảnh */}
                        {boiCanh.luu_y.map((item, idx) => {
                          const loaiLabel =
                            item.loai === 'thong_le_ung_xu'
                              ? 'Thông lệ, không phải quy định'
                              : 'Gợi ý thẩm mỹ';
                          const citedUrls = resolveCitedSources(item.nguon_chi_so, boiCanh.nguon);
                          return (
                            <div key={idx} className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] text-xs space-y-1.5">
                              <span
                                className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                                  item.loai === 'thong_le_ung_xu'
                                    ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/25'
                                    : 'bg-[#FDF9F0] text-[#7C4D1B] border-[#C88E1B]/35'
                                }`}
                              >
                                {loaiLabel}
                              </span>
                              <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                              <div className="text-xs text-[#4A5560] flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold">Nguồn:</span>
                                {citedUrls.length > 0 ? (
                                  citedUrls.map((url, uIdx) => (
                                    <a
                                      key={uIdx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[#1E3F5A] hover:underline break-all"
                                    >
                                      <span>{url}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  ))
                                ) : (
                                  <span>Chưa có nguồn</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-[#DED7C6]/70">
                        <div className="text-xs font-semibold text-[#7C4D1B] bg-[#FDF9F0] px-2.5 py-1 rounded-md border border-[#C88E1B]/35 inline-block mb-2.5">
                          Gợi ý của app, không phải sự thật lịch sử
                        </div>

                        {outfit.goi_y_phoi_do.length === 0 ? (
                          <div className="text-xs text-[#4A5560] italic">Chưa có nguồn</div>
                        ) : (
                          <div className="space-y-2 text-xs">
                            {outfit.goi_y_phoi_do.map((item, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#DED7C6]">
                                <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                                {item.ghi_chu && (
                                  <p className="text-xs text-[#4A5560] mt-1 italic">{item.ghi_chu}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Phụ kiện đã chọn */}
                      {selectedAccessories.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs font-bold text-[#1E3F5A] mb-2">
                            Phụ kiện đã chọn ({selectedAccessories.length}):
                          </div>
                          <div className="space-y-1.5">
                            {selectedAccessories.map((acc) => (
                              <div
                                key={acc.id}
                                className="p-2.5 rounded-xl bg-white border border-[#DED7C6] text-xs flex items-center justify-between gap-2 flex-wrap"
                              >
                                <span className="text-[#161A1D] font-semibold">{acc.name}</span>
                                <span className="text-xs text-[#4A5560] shrink-0">
                                  {acc.isAppSuggestion
                                    ? 'Gợi ý của app, không phải sự thật lịch sử'
                                    : 'Tư liệu KB-v3'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Đặc điểm cấu tạo */}
                  {activeTab === 'anatomy' && (
                    <div className="mt-4 space-y-3.5 text-xs">
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DED7C6] space-y-3">
                        <div>
                          <span className="font-bold text-[#1E3F5A] block mb-1">Cổ áo:</span>
                          <SourceCitationText text={outfit.bo_phan.co || 'Chưa có nguồn'} />
                        </div>
                        <div className="pt-2.5 border-t border-[#E8E2D8]">
                          <span className="font-bold text-[#1E3F5A] block mb-1">Tay áo:</span>
                          <SourceCitationText text={outfit.bo_phan.tay || 'Chưa có nguồn'} />
                        </div>
                        <div className="pt-2.5 border-t border-[#E8E2D8]">
                          <span className="font-bold text-[#1E3F5A] block mb-1">Thân áo & Vạt áo:</span>
                          <SourceCitationText text={outfit.bo_phan.than || 'Chưa có nguồn'} />
                        </div>
                        {outfit.bo_phan.vat_lieu && (
                          <div className="pt-2.5 border-t border-[#E8E2D8]">
                            <span className="font-bold text-[#1E3F5A] block mb-1">Vật liệu:</span>
                            <SourceCitationText text={outfit.bo_phan.vat_lieu} />
                          </div>
                        )}
                      </div>

                      {/* Đặc điểm nhận diện hình ảnh */}
                      {outfit.dac_diem_nhan_dien_hinh_anh.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-[#DED7C6]">
                          <span className="font-bold text-[#1E3F5A] block mb-2">
                            Đặc điểm nhận diện hình ảnh:
                          </span>
                          <ul className="space-y-1.5 list-disc list-inside text-[#4A5560]">
                            {outfit.dac_diem_nhan_dien_hinh_anh.map((item, idx) => (
                              <li key={idx}>
                                <SourceCitationText text={item} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Nguồn gốc & Lịch sử */}
                  {activeTab === 'history' && (
                    <div className="mt-4 space-y-3.5 text-xs">
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DED7C6]">
                        <span className="font-bold text-[#1E3F5A] block mb-1">Thời kỳ lịch sử:</span>
                        <SourceCitationText text={outfit.thoi_ky} />
                      </div>

                      {outfit.boi_canh_su_dung && outfit.boi_canh_su_dung.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-[#DED7C6]">
                          <span className="font-bold text-[#1E3F5A] block mb-1.5">Bối cảnh sử dụng:</span>
                          <ul className="space-y-1.5 list-disc list-inside text-[#4A5560]">
                            {outfit.boi_canh_su_dung.map((b, idx) => (
                              <li key={idx}>
                                <SourceCitationText text={b} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Danh sách nguồn tư liệu */}
                      <div className="p-4 rounded-2xl bg-white border border-[#DED7C6]">
                        <span className="font-bold text-[#1E3F5A] block mb-2">
                          Nguồn đối chiếu ({outfit.nguon.length}):
                        </span>
                        <div className="space-y-2">
                          {sourceDetails.map((src) => (
                            <div key={src.code} className="flex items-center justify-between gap-2 text-xs pb-2 border-b border-[#F0EBE0] last:border-b-0 flex-wrap">
                              <div>
                                <span className="font-mono font-bold text-[#1E3F5A] mr-1.5">[{src.code}]</span>
                                <span className="text-[#161A1D] font-medium">{src.ten}</span>
                              </div>
                              <span className="text-xs text-[#4A5560] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DED7C6] font-semibold">
                                {src.loai}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Color Scheme Note */}
            <div className="pt-3.5 border-t border-[#DED7C6]/70 flex items-center justify-between gap-2 flex-wrap text-xs text-[#4A5560]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: colorScheme.primaryHex }}
                  aria-hidden="true"
                />
                <span>Màu sắc: <strong className="text-[#161A1D]">{colorScheme.name}</strong></span>
              </span>
              <span>{colorScheme.note}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tìm nơi thuê/mua (B6b) */}
      {rentalModalPa && (
        <RentalSearchModal
          outfit={outfit}
          phuongAn={rentalModalPa}
          onClose={() => setRentalModalPa(null)}
        />
      )}
    </div>
  );
};
