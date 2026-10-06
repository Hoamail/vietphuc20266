import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Scale, Share2, Check, ExternalLink, Info, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
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
} from '../data/kb';
import { RemixCustomization, SavedLook, WeatherCondition, StylistPhuongAn, OptionGuardianState } from '../types/vietphuc';
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

export const ResultScreen: React.FC<ResultScreenProps> = ({
  selectedOutfitId,
  customization,
  onBackToCustomize,
  onSaveToLookbook,
  onAddToCompare,
  isSavedInLookbook,
  isInCompare,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'styling' | 'anatomy' | 'history'>('styling');

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
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded border border-[#1E3F5A]/20">
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
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          ) : (
            <span className="text-[#161A1D] font-medium">{kbSrc.ten}</span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#DED7C6] text-[#52606D] font-semibold">
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
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded border border-[#1E3F5A]/20">
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
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          ) : (
            <span className="text-[#161A1D] font-medium">{domain}</span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FDF9F0] border border-[#C88E1B]/30 text-[#8B5A2B] font-semibold">
            thông lệ/gợi ý
          </span>
        </div>
      );
    }

    return (
      <span key={code} className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded border border-[#1E3F5A]/20">
        [{code}]
      </span>
    );
  };

  const renderPhuongAnSource = (maNguon: string[] | string | null) => {
    const list = Array.isArray(maNguon) ? maNguon : maNguon ? [maNguon] : [];
    if (list.length === 0) {
      return <span className="text-[#7A8691] italic">Chưa có nguồn</span>;
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

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToCustomize}
          className="text-xs font-medium text-[#52606D] hover:text-[#161A1D] flex items-center gap-1.5 cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tùy biến lại</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Add to Compare */}
          <button
            type="button"
            onClick={() => onAddToCompare(outfit.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isInCompare
                ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/30'
                : 'bg-white text-[#4A5560] border-[#DED7C6] hover:border-[#1E3F5A]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isInCompare ? 'Đã thêm So sánh' : 'Thêm vào So sánh'}</span>
          </button>

          {/* Save to Lookbook */}
          <button
            type="button"
            onClick={handleSaveLook}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSavedInLookbook
                ? 'bg-[#E9F2EE] text-[#2E6254] border border-[#2E6254]/30'
                : 'bg-[#B93826] hover:bg-[#8E2516] text-white shadow-2xs'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSavedInLookbook ? 'Đã lưu Lookbook' : 'Lưu vào Lookbook'}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg border border-[#DED7C6] bg-white text-[#52606D] hover:text-[#161A1D] cursor-pointer"
            title="Sao chép liên kết"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#2E6254]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl border border-[#DED7C6] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: Always Vector SVG */}
          <div className="md:col-span-5 bg-[#FAF8F5] relative flex flex-col justify-between overflow-hidden p-5 border-b md:border-b-0 md:border-r border-[#DED7C6]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-[#1E3F5A] font-semibold border border-[#DED7C6]">
                {levelName}
              </span>
              <span className="text-[10px] text-[#7A8691] font-mono">
                Minh họa Line-art SVG
              </span>
            </div>

            {/* Always SVG Illustration */}
            <div className="relative aspect-[3/4] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-[#E8E2D8] p-3">
              <OutfitVectorIllustration id={outfit.id} size="lg" className="border-0 bg-transparent w-full h-full" />
            </div>

            <div className="mt-3 text-center text-[11px] text-[#7A8691]">
              Minh họa vector trung tính line-art theo chuẩn KB-v3
            </div>
          </div>

          {/* Right Column: Detailed Breakdown */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              <div>
                <div className="flex items-center gap-2 text-xs text-[#7A8691] font-medium mb-1 flex-wrap">
                  <span>{formatNguonText(outfit.thoi_ky)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Bối cảnh: {boiCanh.ten}</span>
                </div>
                <h1 className="font-heritage-display text-2xl font-bold text-[#161A1D] leading-tight">
                  {resultTitle}
                </h1>
                <p className="text-xs text-[#52606D] mt-1">
                  {resultSubtitle} · {formatWeatherSummary(customization.weather)}
                </p>
              </div>

              {/* Cultural Guardian Badge */}
              <div className="mt-4">
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
              <div className="mt-5 border-b border-[#DED7C6] pb-1">
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('styling')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'styling'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Phương án Stylist & Bối cảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('anatomy')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'anatomy'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Đặc điểm cấu tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'history'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Nguồn gốc & Lịch sử
                  </button>
                </div>
              </div>

              {/* Tab 1: Phương án Stylist & Bối cảnh */}
              {activeTab === 'styling' && (
                <div className="mt-4 space-y-4">
                  {/* Khối Phương án phối đồ từ /api/style */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C88E1B]" />
                        <span>Phương án phối đồ đề xuất</span>
                      </h2>
                      {!isLoadingStyle && !styleError && phuongAnList.length > 0 && (
                        <span className="text-[11px] font-mono text-[#6C7A87]">
                          {phuongAnList.length} phương án
                        </span>
                      )}
                    </div>

                    {/* Skeleton khi chờ */}
                    {isLoadingStyle && (
                      <div className="space-y-3" aria-busy="true" aria-label="Đang tải phương án phối đồ">
                        {[1, 2].map((skeletonIdx) => (
                          <div
                            key={skeletonIdx}
                            className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DED7C6] animate-pulse space-y-2.5"
                          >
                            <div className="h-4 w-2/5 bg-[#E6E0D2] rounded" />
                            <div className="h-3 w-full bg-[#EFECE3] rounded" />
                            <div className="h-3 w-4/5 bg-[#EFECE3] rounded" />
                            <div className="flex gap-2 pt-1">
                              <div className="h-5 w-20 bg-[#E6E0D2] rounded" />
                              <div className="h-5 w-24 bg-[#E6E0D2] rounded" />
                            </div>
                            <div className="h-10 w-full bg-[#EFECE3] rounded-xl mt-2" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Khi lỗi: hiện "Chưa kiểm tra được" kèm nút "Thử lại", không hiện nội dung dựng sẵn */}
                    {!isLoadingStyle && styleError && (
                      <div className="p-4 rounded-2xl bg-[#FBEFEF] border border-[#B93826]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-[#B93826] shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-[#8E2516]">
                              {styleError}
                            </div>
                            {styleErrorReason && (
                              <div className="text-[10px] font-mono text-[#8E2516]/80 mt-0.5">
                                Mã lỗi: {styleErrorReason}
                              </div>
                            )}
                            <p className="text-[11px] text-[#78261A] mt-0.5">
                              Không thể kiểm tra phương án phối tự động lúc này. Phần cấu tạo và nguồn tư liệu trang phục bên dưới vẫn lấy trực tiếp từ KB-v3.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRetryStyle}
                          className="px-3.5 py-1.5 bg-[#B93826] hover:bg-[#8E2516] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Thử lại</span>
                        </button>
                      </div>
                    )}

                    {/* Khi thành công: hiện 2-3 thẻ phương án */}
                    {!isLoadingStyle && !styleError && phuongAnList.length > 0 && (
                      <div className="space-y-3.5">
                        {phuongAnList.map((pa, idx) => (
                          <div
                            key={`${pa.token}-${idx}`}
                            className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DED7C6] space-y-3 text-xs shadow-2xs"
                          >
                            {/* Tên, Bảo chứng Cultural Guardian & Mô tả */}
                            <div>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="font-heritage-display text-sm sm:text-base font-bold text-[#161A1D]">
                                  {idx + 1}. {pa.ten}
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                  <GuardianBadge
                                    evaluation={guardianStates[pa.token] || { status: 'loading' }}
                                    onRetry={() => evaluateOptionGuardian(pa, true)}
                                  />
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DED7C6] text-[#1E3F5A] shrink-0">
                                    Phương án 0{idx + 1}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[#4A5560] leading-relaxed mt-1.5">
                                {pa.mo_ta}
                              </p>
                            </div>

                            {/* Thành phần (thanh_phan) */}
                            <div>
                              <div className="text-[11px] font-bold text-[#1E3F5A] mb-1">
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
                            <div className="p-3 rounded-xl bg-white border border-[#E8E2D8] space-y-1.5">
                              <div className="text-[11px] font-bold text-[#1E3F5A]">
                                Lý do văn hoá & Bối cảnh:
                              </div>
                              <p className="text-[#4A5560] leading-relaxed">
                                {pa.ly_do_van_hoa}
                              </p>
                              <div className="pt-1.5 border-t border-[#F0EBE0] flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="font-semibold text-[#52606D]">Nguồn:</span>
                                {renderPhuongAnSource(pa.ma_nguon)}
                              </div>
                            </div>

                            {/* Khối "Gợi ý của app" (goi_y_cua_app) */}
                            <div className="p-3 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/30 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-[#8B5A2B]">
                                  Gợi ý của app
                                </span>
                                <span className="text-[10px] font-semibold text-[#8B5A2B] bg-white px-2 py-0.5 rounded border border-[#C88E1B]/30">
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Đánh giá bối cảnh tĩnh từ boi-canh.json */}
                  <div className="pt-3 border-t border-[#DED7C6] space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
                      Thông tin bối cảnh từ dữ liệu (boi-canh.json)
                    </div>
                    {priorityRecommendation ? (
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="font-bold text-[#1E3F5A] flex items-center gap-1.5">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>Gợi ý của app cho bối cảnh này</span>
                          </div>
                          <span className="text-[10px] text-[#7A8691] italic">chưa có nguồn</span>
                        </div>
                        <p className="text-[#4A5560] leading-relaxed">{priorityRecommendation.ly_do}</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] text-xs text-[#52606D] flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#7A8691] shrink-0" />
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
                        <div key={idx} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs space-y-1.5">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              item.loai === 'thong_le_ung_xu'
                                ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/25'
                                : 'bg-[#FDF9F0] text-[#8B5A2B] border-[#C88E1B]/30'
                            }`}
                          >
                            {loaiLabel}
                          </span>
                          <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                          <div className="text-[10px] text-[#6C7A87] flex flex-wrap items-center gap-1.5">
                            <span>Nguồn:</span>
                            {citedUrls.length > 0 ? (
                              citedUrls.map((url, uIdx) => (
                                <a
                                  key={uIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[#1E3F5A] hover:underline break-all"
                                >
                                  <span>{url}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
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

                  <div className="pt-2 border-t border-[#DED7C6]/60">
                    <div className="text-[11px] font-semibold text-[#8B5A2B] bg-[#FDF9F0] px-2.5 py-1 rounded border border-[#C88E1B]/30 inline-block mb-2">
                      Gợi ý của app, không phải sự thật lịch sử
                    </div>

                    {outfit.goi_y_phoi_do.length === 0 ? (
                      <div className="text-xs text-[#7A8691] italic">Chưa có nguồn</div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {outfit.goi_y_phoi_do.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                            <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                            {item.ghi_chu && (
                              <p className="text-[11px] text-[#7A8691] mt-1 italic">{item.ghi_chu}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phụ kiện đã chọn */}
                  {selectedAccessories.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-[#1E3F5A] mb-1.5">
                        Phụ kiện đã chọn ({selectedAccessories.length}):
                      </div>
                      <div className="space-y-1.5">
                        {selectedAccessories.map((acc) => (
                          <div
                            key={acc.id}
                            className="p-2 rounded-lg bg-white border border-[#DED7C6] text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-[#161A1D] font-medium">{acc.name}</span>
                            <span className="text-[10px] text-[#7A8691] shrink-0">
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
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                    <div>
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Cổ áo:</span>
                      <SourceCitationText text={outfit.bo_phan.co || 'Chưa có nguồn'} />
                    </div>
                    <div className="pt-2 border-t border-[#E8E2D8]">
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Tay áo:</span>
                      <SourceCitationText text={outfit.bo_phan.tay || 'Chưa có nguồn'} />
                    </div>
                    <div className="pt-2 border-t border-[#E8E2D8]">
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Thân áo & Vạt áo:</span>
                      <SourceCitationText text={outfit.bo_phan.than || 'Chưa có nguồn'} />
                    </div>
                    {outfit.bo_phan.vat_lieu && (
                      <div className="pt-2 border-t border-[#E8E2D8]">
                        <span className="font-bold text-[#1E3F5A] block mb-0.5">Vật liệu:</span>
                        <SourceCitationText text={outfit.bo_phan.vat_lieu} />
                      </div>
                    )}
                  </div>

                  {/* Đặc điểm nhận diện hình ảnh */}
                  {outfit.dac_diem_nhan_dien_hinh_anh.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                      <span className="font-bold text-[#1E3F5A] block mb-1.5">
                        Đặc điểm nhận diện hình ảnh:
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-[#4A5560]">
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
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                    <span className="font-bold text-[#1E3F5A] block mb-0.5">Thời kỳ lịch sử:</span>
                    <SourceCitationText text={outfit.thoi_ky} />
                  </div>

                  {outfit.boi_canh_su_dung && outfit.boi_canh_su_dung.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                      <span className="font-bold text-[#1E3F5A] block mb-1">Bối cảnh sử dụng:</span>
                      <ul className="space-y-1 list-disc list-inside text-[#4A5560]">
                        {outfit.boi_canh_su_dung.map((b, idx) => (
                          <li key={idx}>
                            <SourceCitationText text={b} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Danh sách nguồn tư liệu */}
                  <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                    <span className="font-bold text-[#1E3F5A] block mb-1.5">
                      Nguồn đối chiếu ({outfit.nguon.length}):
                    </span>
                    <div className="space-y-1.5">
                      {sourceDetails.map((src) => (
                        <div key={src.code} className="flex items-center justify-between text-[11px] pb-1 border-b border-[#F0EBE0] last:border-b-0">
                          <div>
                            <span className="font-bold text-[#1E3F5A] mr-1.5">[{src.code}]</span>
                            <span className="text-[#161A1D]">{src.ten}</span>
                          </div>
                          <span className="text-[10px] text-[#7A8691] px-1.5 py-0.2 rounded bg-[#FAF7F2] border border-[#E8E2D8]">
                            {src.loai}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Color Scheme Note */}
            <div className="pt-3 border-t border-[#DED7C6]/60 flex items-center justify-between text-xs text-[#7A8691]">
              <span>Màu sắc: <strong>{colorScheme.name}</strong></span>
              <span>{colorScheme.note}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
