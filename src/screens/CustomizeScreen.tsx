import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Info } from 'lucide-react';
import {
  getTrangPhucById,
  KB_TRANG_PHUC,
  BOI_CANH,
  getBoiCanhById,
  POTTERY_SILK_PALETTES,
  getAccessoriesForGarment,
  GarmentAccessoryOption,
  getMucChacChanLabel,
} from '../data/kb';
import { BoiCanhMucRemix } from '../types/boiCanh';
import { RemixCustomization, WeatherCondition } from '../types/vietphuc';
import { SourceCitationText } from '../components/SourceCitationText';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';

interface CustomizeScreenProps {
  customization: RemixCustomization;
  selectedOutfitId: string;
  onChangeCustomization: (updated: Partial<RemixCustomization>) => void;
  onBack: () => void;
  onGenerateResult: () => void;
}

const STEPS = [
  { step: 1, title: 'Bối cảnh' },
  { step: 2, title: 'Mức cách tân' },
  { step: 3, title: 'Màu sắc' },
  { step: 4, title: 'Phụ kiện' },
  { step: 5, title: 'Điều kiện' },
] as const;

function resolveCitedSources(nguonChiSo: number[] | undefined, nguonList: string[]): string[] {
  if (!Array.isArray(nguonList) || nguonList.length === 0) return [];
  if (!Array.isArray(nguonChiSo) || nguonChiSo.length === 0) return [];
  return nguonChiSo
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < nguonList.length)
    .map((idx) => nguonList[idx]);
}

function getMucRemixLabel(muc: BoiCanhMucRemix): string {
  switch (muc) {
    case 'truyen_thong':
      return 'Truyền thống';
    case 'cach_tan_nhe':
      return 'Cách tân nhẹ';
    case 'remix_streetwear':
    default:
      return 'Remix streetwear';
  }
}

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({
  customization,
  selectedOutfitId,
  onChangeCustomization,
  onBack,
  onGenerateResult,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const outfit = getTrangPhucById(selectedOutfitId) || KB_TRANG_PHUC[0];
  const selectedBoiCanh = getBoiCanhById(customization.purposeId) || BOI_CANH[0];
  const activePalette =
    POTTERY_SILK_PALETTES.find((p) => p.id === customization.colorSchemeId) ||
    POTTERY_SILK_PALETTES[0];

  const accessoryOptions: GarmentAccessoryOption[] = getAccessoriesForGarment(outfit);

  const toggleAccessory = (id: string) => {
    const current = customization.selectedAccessoryIds;
    if (current.includes(id)) {
      onChangeCustomization({ selectedAccessoryIds: current.filter((x) => x !== id) });
    } else {
      onChangeCustomization({ selectedAccessoryIds: [...current, id] });
    }
  };

  const updateWeather = (partial: Partial<WeatherCondition>) => {
    onChangeCustomization({
      weather: {
        ...customization.weather,
        ...partial,
      },
    });
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

  // Kiểm tra trang phục đang chọn có nằm trong nen_uu_tien của bối cảnh hay không
  const priorityRecommendation = selectedBoiCanh.nen_uu_tien.find(
    (item) => item.trang_phuc_id === outfit.id
  );

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  const handleStepForward = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onGenerateResult();
    }
  };

  const stepTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DED7C6] pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4A5560] uppercase tracking-wider font-semibold mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#1E3F5A] text-white font-mono">
              Bước 2 / 3
            </span>
            <span aria-hidden="true">·</span>
            <span>Tuỳ biến bản phối · Bước {currentStep} / 5</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D] text-balance">
            Tuỳ Biến Bản Phối Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-1 leading-relaxed">
            Thực hiện tuần tự từng bước từ bối cảnh, mức cách tân, màu sắc, phụ kiện đến điều kiện thực tế.
          </p>
        </div>

        <div className="sm:text-right bg-white px-4 py-3 rounded-2xl border border-[#DED7C6] shadow-2xs shrink-0">
          <div className="text-xs text-[#6E5D4B] font-medium">Trang phục đang chọn:</div>
          <div className="font-heritage-display text-sm sm:text-base font-bold text-[#1E3F5A] mt-0.5">
            {outfit.ten}
          </div>
          <div className="text-xs text-[#4A5560] mt-0.5">
            Bối cảnh: <strong className="text-[#161A1D]">{selectedBoiCanh.ten}</strong>
          </div>
        </div>
      </div>

      {/* Thanh tiến trình 5 bước (Progress Bar) */}
      <div className="heritage-card rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-[#4A5560] px-0.5">
          <span className="font-semibold text-[#1E3F5A]">
            Tiến trình tuỳ biến: Bước {currentStep}/5 — {STEPS[currentStep - 1].title}
          </span>
          <span className="font-mono tabular-nums text-[#6E5D4B] font-semibold">
            {currentStep * 20}%
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Các bước tuỳ biến bản phối"
          className="grid grid-cols-5 gap-1.5 sm:gap-2.5"
        >
          {STEPS.map((s) => {
            const isActive = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`relative min-h-[48px] p-2 sm:p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                  isActive
                    ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] ring-2 ring-[#1E3F5A]/20 shadow-2xs'
                    : isCompleted
                    ? 'border-[#2E6254]/40 bg-[#E9F2EE]/80 text-[#2E6254] hover:border-[#2E6254]'
                    : 'border-[#DED7C6] bg-[#FAF8F3] text-[#4A5560] hover:border-[#1E3F5A]/50 hover:text-[#161A1D]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-mono font-bold tabular-nums">
                  <span>0{s.step}</span>
                  {isCompleted && (
                    <span className="w-4 h-4 rounded-full bg-[#2E6254] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#1E3F5A] shrink-0" />
                  )}
                </div>
                <div className="text-xs font-semibold truncate mt-1 leading-tight">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual bar */}
        <div className="w-full h-2 bg-[#EFECE3] rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${(currentStep / 5) * 100}%` }}
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
            }
            className="h-full bg-gradient-to-r from-[#1E3F5A] to-[#2E6254] rounded-full"
          />
        </div>
      </div>

      {/* Main Content + Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Mobile Compact Preview: hiển thị thu gọn phía trên nội dung bước 3 và 4 (không che nút điều hướng) */}
          {(currentStep === 3 || currentStep === 4) && (
            <div className="lg:hidden heritage-card rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[#1E3F5A]">
                  Xem trước bản phối
                </span>
                <span className="text-xs text-[#4A5560] font-medium">
                  {activePalette.name} · {getRemixLevelTitle(customization.remixLevel)}
                </span>
              </div>
              <OutfitVectorIllustration
                id={outfit.id}
                size="md"
                colorSchemeId={customization.colorSchemeId}
                selectedAccessoryIds={customization.selectedAccessoryIds}
                remixLevel={customization.remixLevel}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
              transition={stepTransition}
            >
      {/* BƯỚC 1: BỐI CẢNH */}
      {currentStep === 1 && (
        <section className="space-y-5">
          <div className="heritage-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                  1. Chọn bối cảnh sử dụng
                </h2>
              </div>
              <span className="text-xs text-[#1E3F5A] bg-[#EBF2F7] px-2.5 py-1 rounded-lg border border-[#1E3F5A]/20 font-medium self-start sm:self-auto">
                Mức chắc chắn bối cảnh: <strong>{getMucChacChanLabel(selectedBoiCanh.muc_chac_chan)}</strong>
              </span>
            </div>

            {/* Thẻ chọn bối cảnh: mỗi thẻ hiện tên và tinh_than */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BOI_CANH.map((bc) => {
                const isSelected = bc.id === customization.purposeId;
                return (
                  <button
                    type="button"
                    key={bc.id}
                    onClick={() => onChangeCustomization({ purposeId: bc.id })}
                    className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/25 shadow-xs'
                        : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-heritage-display text-base font-bold text-[#161A1D]">
                          {bc.ten}
                        </h3>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4A5560] leading-relaxed">
                        {bc.tinh_than}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dưới phần bối cảnh: Khuyến nghị trang phục (nen_uu_tien) & Lưu ý (luu_y) */}
          <div className="heritage-card rounded-2xl p-5 space-y-4">
            <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D]">
              Đối chiếu trang phục &ldquo;{outfit.ten}&rdquo; trong bối cảnh &ldquo;{selectedBoiCanh.ten}&rdquo;
            </h3>

            {/* Kiểm tra nen_uu_tien */}
            {priorityRecommendation ? (
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#1E3F5A] shrink-0" />
                    <span className="text-xs font-bold text-[#1E3F5A]">
                      Gợi ý của app cho bối cảnh này
                    </span>
                  </div>
                  <span className="text-xs text-[#6E5D4B] italic font-medium">
                    chưa có nguồn
                  </span>
                </div>
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  {priorityRecommendation.ly_do}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] flex items-center gap-2.5 text-xs text-[#4A5560]">
                <Info className="w-4 h-4 text-[#6E5D4B] shrink-0" />
                <span>Chưa có khuyến nghị cho trang phục này trong dữ liệu bối cảnh</span>
              </div>
            )}

            {/* Danh sách luu_y */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
                Lưu ý ứng xử & Thẩm mỹ của bối cảnh
              </div>

              <div className="space-y-2.5">
                {selectedBoiCanh.luu_y.map((item, idx) => {
                  const loaiLabel =
                    item.loai === 'thong_le_ung_xu'
                      ? 'Thông lệ, không phải quy định'
                      : 'Gợi ý thẩm mỹ';
                  const citedUrls = resolveCitedSources(item.nguon_chi_so, selectedBoiCanh.nguon);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                            item.loai === 'thong_le_ung_xu'
                              ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/25'
                              : 'bg-[#FDF9F0] text-[#7C4D1B] border-[#C88E1B]/35'
                          }`}
                        >
                          {loaiLabel}
                        </span>
                      </div>

                      <p className="text-[#161A1D] leading-relaxed">
                        {item.noi_dung}
                      </p>

                      <div className="pt-1.5 border-t border-[#E8E2D8] text-xs text-[#4A5560] flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#161A1D]">Nguồn:</span>
                        {citedUrls.length > 0 ? (
                          citedUrls.map((url, uIdx) => (
                            <a
                              key={uIdx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#1E3F5A] font-medium hover:underline break-all"
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
            </div>
          </div>
        </section>
      )}

      {/* BƯỚC 2: MỨC CÁCH TÂN */}
      {currentStep === 2 && (
        <section className="heritage-card rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                2. Mức độ cách tân trang phục
              </h2>
              <span className="text-xs font-semibold text-[#1E3F5A] px-2.5 py-1 rounded-lg bg-[#EBF2F7] border border-[#1E3F5A]/20">
                Đang chọn: {getRemixLevelTitle(customization.remixLevel)}
              </span>
            </div>

            {/* Hiển thị nhãn muc_remix kèm muc_remix_ghi_chu của bối cảnh đã chọn */}
            <div className="mt-3 p-4 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-[#7C4D1B]">
                  Mức cách tân gợi ý cho bối cảnh &ldquo;{selectedBoiCanh.ten}&rdquo;:
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-[#C88E1B]/45 text-[#7C4D1B] font-bold">
                  {getMucRemixLabel(selectedBoiCanh.muc_remix)}
                </span>
              </div>
              <p className="text-[#4E3B26] leading-relaxed">
                {selectedBoiCanh.muc_remix_ghi_chu || 'Chưa có nguồn'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Level 1: Truyền thống */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 1 })}
              className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                customization.remixLevel === 1
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/25 shadow-xs'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1.5">
                  <span>01 · Truyền thống</span>
                  {customization.remixLevel === 1 && (
                    <span className="w-5 h-5 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  Bảo tồn phom dáng, cấu trúc cổ áo, hàng cúc và nẹp thân theo tư liệu chuẩn xác.
                </p>
              </div>
            </button>

            {/* Level 2: Cách tân nhẹ */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 2 })}
              className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                customization.remixLevel === 2
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/25 shadow-xs'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1.5">
                  <span>02 · Cách tân nhẹ</span>
                  {customization.remixLevel === 2 && (
                    <span className="w-5 h-5 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  Giữ phom dáng cơ bản, tinh giản tà và tay áo cho nhu cầu di chuyển, chụp ảnh kỷ yếu.
                </p>
              </div>
            </button>

            {/* Level 3: Remix streetwear */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 3 })}
              className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                customization.remixLevel === 3
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/25 shadow-xs'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1.5">
                  <span>03 · Remix streetwear</span>
                  {customization.remixLevel === 3 && (
                    <span className="w-5 h-5 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  Ứng dụng phong cách đương đại linh hoạt, khoác ngoài kết hợp trang phục thường nhật.
                </p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* BƯỚC 3: MÀU SẮC */}
      {currentStep === 3 && (
        <section className="heritage-card rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                3. Bảng màu phối đồ
              </h2>
              <span className="text-xs font-semibold text-[#7C4D1B] bg-[#FDF9F0] px-2.5 py-0.5 rounded-md border border-[#C88E1B]/35">
                Gợi ý thiết kế của app
              </span>
            </div>
            <p className="text-xs text-[#4A5560] mt-1">
              Các gam màu men gốm và tơ tằm là đề xuất thẩm mỹ từ ứng dụng, giúp bạn dễ dàng hình dung bản phối.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {POTTERY_SILK_PALETTES.map((palette) => {
              const isSelected = palette.id === customization.colorSchemeId;
              return (
                <button
                  type="button"
                  key={palette.id}
                  onClick={() => onChangeCustomization({ colorSchemeId: palette.id })}
                  className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1E3F5A] bg-[#FBF9F5] ring-2 ring-[#1E3F5A]/25 shadow-sm -translate-y-0.5'
                      : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5 hover:shadow-xs'
                  }`}
                >
                  <div className="w-full">
                    {/* Swatches */}
                    <div className="flex items-center gap-1.5 h-7 mb-3">
                      <div
                        className="h-full flex-2 rounded-l-lg border border-black/15 shadow-2xs"
                        style={{ backgroundColor: palette.primaryHex }}
                      />
                      <div
                        className="h-full flex-1 border border-black/15 shadow-2xs"
                        style={{ backgroundColor: palette.secondaryHex }}
                      />
                      <div
                        className="h-full flex-1 rounded-r-lg border border-black/15 shadow-2xs"
                        style={{ backgroundColor: palette.accentHex }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#161A1D]">
                      <span>{palette.name}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full mt-2.5 pt-2 border-t border-[#DED7C6]/60 text-xs text-[#4A5560]">
                    {palette.note}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* BƯỚC 4: PHỤ KIỆN */}
      {currentStep === 4 && (
        <section className="heritage-card rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                4. Phụ kiện theo trang phục ({customization.selectedAccessoryIds.length} đã chọn)
              </h2>
              <span className="text-xs text-[#4A5560] font-medium">Chạm để chọn / bỏ chọn</span>
            </div>
          </div>

          {accessoryOptions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DED7C6] text-xs text-[#4A5560] text-center">
              Chưa có nguồn
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {accessoryOptions.map((acc) => {
                const isSelected = customization.selectedAccessoryIds.includes(acc.id);
                return (
                  <button
                    type="button"
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`min-h-[44px] p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/25 shadow-xs -translate-y-0.5'
                        : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:-translate-y-0.5 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5 mb-2.5 w-full">
                      <span className="font-semibold text-xs sm:text-sm text-[#161A1D] leading-snug">
                        <SourceCitationText text={acc.name} />
                      </span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-[#1E3F5A] border-[#1E3F5A] text-white'
                            : 'border-[#C8BEAA] bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>

                    <div className="w-full pt-2 border-t border-[#DED7C6]/60 flex items-center justify-between text-xs">
                      {acc.isAppSuggestion ? (
                        <span className="text-[#7C4D1B] bg-[#FDF9F0] px-2 py-0.5 rounded-md border border-[#C88E1B]/30 font-medium">
                          Gợi ý của app · Gợi ý của app, không phải sự thật lịch sử
                        </span>
                      ) : (
                        <span className="text-[#1E3F5A] bg-white/90 border border-[#1E3F5A]/20 px-2 py-0.5 rounded-md font-medium">
                          Theo tư liệu
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* BƯỚC 5: ĐIỀU KIỆN (Mùa, Nhiệt độ, Thời điểm trong ngày - không gọi API thời tiết) */}
      {currentStep === 5 && (
        <section className="heritage-card rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
              5. Điều kiện thời tiết & Thời điểm
            </h2>
            <p className="text-xs text-[#4A5560] mt-1">
              Tự chọn mùa, nhiệt độ và thời điểm trong ngày cho buổi mặc hoặc chụp ảnh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Mùa */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-2">
                Mùa trong năm:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'xuan', label: 'Mùa Xuân' },
                  { id: 'ha', label: 'Mùa Hạ' },
                  { id: 'thu', label: 'Mùa Thu' },
                  { id: 'dong', label: 'Mùa Đông' },
                ].map((s) => {
                  const active = customization.weather.season === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => updateWeather({ season: s.id as WeatherCondition['season'] })}
                      className={`min-h-[44px] w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold ring-1 ring-[#1E3F5A]/20'
                          : 'border-[#DED7C6] bg-white text-[#4A5560] hover:border-[#1E3F5A]/40 hover:text-[#161A1D]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {active && <Check className="w-4 h-4 text-[#1E3F5A] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nhiệt độ */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-2">
                Nhiệt độ cảm nhận:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'mat_me', label: 'Mát mẻ dễ chịu' },
                  { id: 'nong_am', label: 'Nắng ấm / Nóng' },
                  { id: 'se_lanh', label: 'Se lạnh / Lạnh' },
                ].map((t) => {
                  const active = customization.weather.temperature === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => updateWeather({ temperature: t.id as WeatherCondition['temperature'] })}
                      className={`min-h-[44px] w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold ring-1 ring-[#1E3F5A]/20'
                          : 'border-[#DED7C6] bg-white text-[#4A5560] hover:border-[#1E3F5A]/40 hover:text-[#161A1D]'
                      }`}
                    >
                      <span>{t.label}</span>
                      {active && <Check className="w-4 h-4 text-[#1E3F5A] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thời điểm trong ngày */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-2">
                Thời điểm trong ngày:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'buoi_sang', label: 'Buổi sáng' },
                  { id: 'buoi_chieu', label: 'Buổi chiều' },
                  { id: 'buoi_toi', label: 'Buổi tối' },
                ].map((tod) => {
                  const active = customization.weather.timeOfDay === tod.id;
                  return (
                    <button
                      type="button"
                      key={tod.id}
                      onClick={() => updateWeather({ timeOfDay: tod.id as WeatherCondition['timeOfDay'] })}
                      className={`min-h-[44px] w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        active
                          ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold ring-1 ring-[#1E3F5A]/20'
                          : 'border-[#DED7C6] bg-white text-[#4A5560] hover:border-[#1E3F5A]/40 hover:text-[#161A1D]'
                      }`}
                    >
                      <span>{tod.label}</span>
                      {active && <Check className="w-4 h-4 text-[#1E3F5A] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
            </motion.div>
          </AnimatePresence>

      {/* Action Footer (Sticky on mobile) */}
      <div className="sticky bottom-14 md:static z-20 -mx-3.5 px-3.5 py-3 sm:mx-0 sm:px-0 sm:py-4 bg-[#F8F6F0]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-[#DED7C6] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleStepBack}
          className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-[#4A5560] hover:text-[#161A1D] hover:bg-white/70 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{currentStep === 1 ? 'Quay lại chọn trang phục' : `Quay lại bước ${currentStep - 1}`}</span>
        </button>

        <button
          type="button"
          onClick={handleStepForward}
          className={`min-h-[44px] px-5 sm:px-6 py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md active:scale-[0.98] ${
            currentStep === 5
              ? 'bg-[#B93826] hover:bg-[#8E2516]'
              : 'bg-[#1E3F5A] hover:bg-[#12283A]'
          }`}
        >
          <span>
            {currentStep === 5 ? 'Xem bản phối hoàn chỉnh' : `Tiếp theo: ${STEPS[currentStep].title}`}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
        </div>

        {/* Desktop Sticky Right Preview Column */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20">
          <div className="heritage-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#EFECE3] pb-2.5">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#6E5D4B]">
                  Xem trước trực tiếp
                </div>
                <div className="font-heritage-display text-sm font-bold text-[#161A1D]">
                  {outfit.ten}
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EBF2F7] text-[#1E3F5A]">
                {getRemixLevelTitle(customization.remixLevel)}
              </span>
            </div>

            <OutfitVectorIllustration
              id={outfit.id}
              size="lg"
              colorSchemeId={customization.colorSchemeId}
              selectedAccessoryIds={customization.selectedAccessoryIds}
              remixLevel={customization.remixLevel}
            />

            <div className="pt-2.5 border-t border-[#EFECE3] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#4A5560]">Bảng màu:</span>
                <span className="font-semibold text-[#161A1D]">{activePalette.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4A5560]">Phụ kiện đã chọn:</span>
                <span className="font-semibold text-[#1E3F5A] font-mono tabular-nums">
                  {customization.selectedAccessoryIds.length} mục
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

