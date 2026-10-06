import React, { useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const outfit = getTrangPhucById(selectedOutfitId) || KB_TRANG_PHUC[0];
  const selectedBoiCanh = getBoiCanhById(customization.purposeId) || BOI_CANH[0];

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

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DED7C6] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7A8691] uppercase tracking-wider font-semibold mb-1">
            <span>Tuỳ biến bản phối</span>
            <span aria-hidden="true">·</span>
            <span>Bước {currentStep} / 5</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
            Tuỳ Biến Bản Phối Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#52606D] mt-1">
            Thực hiện tuần tự từng bước từ bối cảnh, mức cách tân, màu sắc, phụ kiện đến điều kiện thực tế.
          </p>
        </div>

        <div className="sm:text-right bg-white px-3.5 py-2.5 rounded-xl border border-[#DED7C6] shrink-0">
          <div className="text-[11px] text-[#8E7E6B] font-medium">Trang phục đang chọn:</div>
          <div className="font-heritage-display text-sm font-bold text-[#1E3F5A]">
            {outfit.ten}
          </div>
          <div className="text-xs text-[#52606D] mt-0.5">
            Bối cảnh: <strong>{selectedBoiCanh.ten}</strong>
          </div>
        </div>
      </div>

      {/* Thanh tiến trình 5 bước (Progress Bar) */}
      <div className="bg-white rounded-2xl border border-[#DED7C6] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {STEPS.map((s) => {
            const isActive = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            return (
              <button
                type="button"
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A]'
                    : isCompleted
                    ? 'border-[#2E6254]/30 bg-[#E9F2EE]/60 text-[#2E6254]'
                    : 'border-[#DED7C6] bg-[#FAF8F5] text-[#6C7A87] hover:border-[#1E3F5A]/40'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                  <span>0{s.step}</span>
                  {isCompleted && <Check className="w-3 h-3 text-[#2E6254]" />}
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.title}</div>
              </button>
            );
          })}
        </div>

        {/* Visual bar */}
        <div className="w-full h-1.5 bg-[#EFECE3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E3F5A] transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* BƯỚC 1: BỐI CẢNH */}
      {currentStep === 1 && (
        <section className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                  1. Chọn bối cảnh sử dụng
                </h2>
                <p className="text-xs text-[#6C7A87] mt-0.5">
                  Dữ liệu bối cảnh từ <span className="font-mono">boi-canh.json</span>
                </p>
              </div>
              <span className="text-xs text-[#1E3F5A] font-medium">
                Mức chắc chắn bối cảnh: <strong>{getMucChacChanLabel(selectedBoiCanh.muc_chac_chan)}</strong>
              </span>
            </div>

            {/* Thẻ chọn bối cảnh: mỗi thẻ hiện tên và tinh_than */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOI_CANH.map((bc) => {
                const isSelected = bc.id === customization.purposeId;
                return (
                  <button
                    type="button"
                    key={bc.id}
                    onClick={() => onChangeCustomization({ purposeId: bc.id })}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/20'
                        : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-heritage-display text-base font-bold text-[#161A1D]">
                          {bc.ten}
                        </h3>
                        {isSelected && <Check className="w-4 h-4 text-[#1E3F5A] shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-[#52606D] leading-relaxed">
                        {bc.tinh_than}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dưới phần bối cảnh: Khuyến nghị trang phục (nen_uu_tien) & Lưu ý (luu_y) */}
          <div className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
            <h3 className="font-heritage-display text-base font-bold text-[#161A1D]">
              Đối chiếu trang phục &ldquo;{outfit.ten}&rdquo; trong bối cảnh &ldquo;{selectedBoiCanh.ten}&rdquo;
            </h3>

            {/* Kiểm tra nen_uu_tien */}
            {priorityRecommendation ? (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#1E3F5A] shrink-0" />
                    <span className="text-xs font-bold text-[#1E3F5A]">
                      Gợi ý của app cho bối cảnh này
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A8691] italic">
                    chưa có nguồn
                  </span>
                </div>
                <p className="text-xs text-[#4A5560] leading-relaxed">
                  {priorityRecommendation.ly_do}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] flex items-center gap-2.5 text-xs text-[#52606D]">
                <Info className="w-4 h-4 text-[#7A8691] shrink-0" />
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
                      className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            item.loai === 'thong_le_ung_xu'
                              ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/25'
                              : 'bg-[#FDF9F0] text-[#8B5A2B] border-[#C88E1B]/30'
                          }`}
                        >
                          {loaiLabel}
                        </span>
                      </div>

                      <p className="text-[#161A1D] leading-relaxed">
                        {item.noi_dung}
                      </p>

                      <div className="pt-1.5 border-t border-[#E8E2D8] text-[11px] text-[#6C7A87] flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[#52606D]">Nguồn:</span>
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
            </div>
          </div>
        </section>
      )}

      {/* BƯỚC 2: MỨC CÁCH TÂN */}
      {currentStep === 2 && (
        <section className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                2. Mức độ cách tân trang phục
              </h2>
              <span className="text-xs font-semibold text-[#1E3F5A] px-2.5 py-0.5 rounded bg-[#EBF2F7]">
                Đang chọn: {getRemixLevelTitle(customization.remixLevel)}
              </span>
            </div>

            {/* Hiển thị nhãn muc_remix kèm muc_remix_ghi_chu của bối cảnh đã chọn */}
            <div className="mt-3 p-3.5 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-[#8B5A2B]">
                  Mức cách tân gợi ý cho bối cảnh &ldquo;{selectedBoiCanh.ten}&rdquo;:
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#C88E1B]/40 text-[#8B5A2B] font-bold">
                  {getMucRemixLabel(selectedBoiCanh.muc_remix)}
                </span>
              </div>
              <p className="text-[#5A4630] leading-relaxed">
                {selectedBoiCanh.muc_remix_ghi_chu || 'Chưa có nguồn'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Level 1: Truyền thống */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 1 })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                customization.remixLevel === 1
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/20'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1">
                <span>Truyền thống</span>
                {customization.remixLevel === 1 && <Check className="w-4 h-4 text-[#1E3F5A]" />}
              </div>
              <p className="text-xs text-[#52606D] leading-relaxed">
                Bảo tồn phom dáng, cấu trúc cổ áo, hàng cúc và nẹp thân theo tư liệu chuẩn xác.
              </p>
            </button>

            {/* Level 2: Cách tân nhẹ */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 2 })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                customization.remixLevel === 2
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/20'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1">
                <span>Cách tân nhẹ</span>
                {customization.remixLevel === 2 && <Check className="w-4 h-4 text-[#1E3F5A]" />}
              </div>
              <p className="text-xs text-[#52606D] leading-relaxed">
                Giữ phom dáng cơ bản, tinh giản tà và tay áo cho nhu cầu di chuyển, chụp ảnh kỷ yếu.
              </p>
            </button>

            {/* Level 3: Remix streetwear */}
            <button
              type="button"
              onClick={() => onChangeCustomization({ remixLevel: 3 })}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                customization.remixLevel === 3
                  ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-2 ring-[#1E3F5A]/20'
                  : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#1E3F5A] mb-1">
                <span>Remix streetwear</span>
                {customization.remixLevel === 3 && <Check className="w-4 h-4 text-[#1E3F5A]" />}
              </div>
              <p className="text-xs text-[#52606D] leading-relaxed">
                Ứng dụng phong cách đương đại linh hoạt, khoác ngoài kết hợp trang phục thường nhật.
              </p>
            </button>
          </div>
        </section>
      )}

      {/* BƯỚC 3: MÀU SẮC */}
      {currentStep === 3 && (
        <section className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                3. Bảng màu phối đồ
              </h2>
              <span className="text-[11px] font-semibold text-[#8B5A2B] bg-[#FDF9F0] px-2 py-0.5 rounded border border-[#C88E1B]/30">
                Gợi ý thiết kế của app
              </span>
            </div>
            <p className="text-xs text-[#6C7A87] mt-1">
              Các gam màu men gốm và tơ tằm là đề xuất thẩm mỹ từ ứng dụng, giúp bạn dễ dàng hình dung bản phối.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POTTERY_SILK_PALETTES.map((palette) => {
              const isSelected = palette.id === customization.colorSchemeId;
              return (
                <div
                  key={palette.id}
                  onClick={() => onChangeCustomization({ colorSchemeId: palette.id })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1E3F5A] bg-[#F8F6F0] ring-2 ring-[#1E3F5A]/20 shadow-2xs'
                      : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
                  }`}
                >
                  <div>
                    {/* Swatches */}
                    <div className="flex items-center gap-1.5 h-6 mb-2.5">
                      <div
                        className="h-full flex-2 rounded-l-md border border-black/10"
                        style={{ backgroundColor: palette.primaryHex }}
                      />
                      <div
                        className="h-full flex-1 border border-black/10"
                        style={{ backgroundColor: palette.secondaryHex }}
                      />
                      <div
                        className="h-full flex-1 rounded-r-md border border-black/10"
                        style={{ backgroundColor: palette.accentHex }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-[#161A1D]">
                      <span>{palette.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1E3F5A]" />}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#DED7C6]/50 text-[10px] text-[#7A8691]">
                    {palette.note}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* BƯỚC 4: PHỤ KIỆN */}
      {currentStep === 4 && (
        <section className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
                4. Phụ kiện theo trang phục ({customization.selectedAccessoryIds.length} đã chọn)
              </h2>
              <span className="text-xs text-[#7A8691]">Chạm để chọn / bỏ chọn</span>
            </div>
            <p className="text-xs text-[#6C7A87] mt-1">
              Lấy từ mục <span className="font-mono">phu_kien</span> và <span className="font-mono">goi_y_phoi_do</span> của <strong>{outfit.ten}</strong>.
            </p>
          </div>

          {accessoryOptions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DED7C6] text-xs text-[#7A8691] text-center">
              Chưa có nguồn
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accessoryOptions.map((acc) => {
                const isSelected = customization.selectedAccessoryIds.includes(acc.id);
                return (
                  <button
                    type="button"
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] ring-1 ring-[#1E3F5A]'
                        : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold text-xs text-[#161A1D] leading-snug">
                        <SourceCitationText text={acc.name} />
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#1E3F5A] shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#DED7C6]/40 flex items-center justify-between text-[10px]">
                      {acc.isAppSuggestion ? (
                        <span className="text-[#8B5A2B] bg-[#FDF9F0] px-1.5 py-0.5 rounded border border-[#C88E1B]/20 font-medium">
                          Gợi ý của app · Gợi ý của app, không phải sự thật lịch sử
                        </span>
                      ) : (
                        <span className="text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded font-medium">
                          Tư liệu KB-v3 (phu_kien)
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
        <section className="bg-white rounded-2xl border border-[#DED7C6] p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
              5. Điều kiện thời tiết & Thời điểm
            </h2>
            <p className="text-xs text-[#6C7A87] mt-1">
              Tự chọn mùa, nhiệt độ và thời điểm trong ngày cho buổi mặc hoặc chụp ảnh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Mùa */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-1.5">
                Mùa trong năm:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'xuan', label: 'Mùa Xuân' },
                  { id: 'ha', label: 'Mùa Hạ' },
                  { id: 'thu', label: 'Mùa Thu' },
                  { id: 'dong', label: 'Mùa Đông' },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => updateWeather({ season: s.id as WeatherCondition['season'] })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      customization.weather.season === s.id
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold'
                        : 'border-[#DED7C6] bg-white text-[#52606D]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nhiệt độ */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-1.5">
                Nhiệt độ cảm nhận:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'mat_me', label: 'Mát mẻ dễ chịu' },
                  { id: 'nong_am', label: 'Nắng ấm / Nóng' },
                  { id: 'se_lanh', label: 'Se lạnh / Lạnh' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => updateWeather({ temperature: t.id as WeatherCondition['temperature'] })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      customization.weather.temperature === t.id
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold'
                        : 'border-[#DED7C6] bg-white text-[#52606D]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thời điểm trong ngày */}
            <div>
              <label className="font-semibold text-[#161A1D] block mb-1.5">
                Thời điểm trong ngày:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'buoi_sang', label: 'Buổi sáng' },
                  { id: 'buoi_chieu', label: 'Buổi chiều' },
                  { id: 'buoi_toi', label: 'Buổi tối' },
                ].map((tod) => (
                  <button
                    type="button"
                    key={tod.id}
                    onClick={() => updateWeather({ timeOfDay: tod.id as WeatherCondition['timeOfDay'] })}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      customization.weather.timeOfDay === tod.id
                        ? 'border-[#1E3F5A] bg-[#EBF2F7] text-[#1E3F5A] font-semibold'
                        : 'border-[#DED7C6] bg-white text-[#52606D]'
                    }`}
                  >
                    {tod.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#DED7C6]">
        <button
          type="button"
          onClick={handleStepBack}
          className="px-4 py-2 text-xs font-semibold text-[#52606D] hover:text-[#161A1D] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep === 1 ? 'Quay lại chọn trang phục' : `Quay lại bước ${currentStep - 1}`}</span>
        </button>

        <button
          type="button"
          onClick={handleStepForward}
          className={`px-6 py-2.5 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md ${
            currentStep === 5
              ? 'bg-[#B93826] hover:bg-[#8E2516]'
              : 'bg-[#1E3F5A] hover:bg-[#12283A]'
          }`}
        >
          <span>
            {currentStep === 5 ? 'Xem bản phối hoàn chỉnh' : `Tiếp theo: ${STEPS[currentStep].title}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

