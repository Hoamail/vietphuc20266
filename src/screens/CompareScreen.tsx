import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Scale, Check, Plus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  KB_TRANG_PHUC,
  getTrangPhucById,
  KB_NGUON,
  getLoaiNguonLabel,
} from '../data/kb';
import { KBTrangPhuc } from '../types/kb';
import { EmptyState } from '../components/StatesFeedback';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { SourceCitationText } from '../components/SourceCitationText';

interface CompareScreenProps {
  compareOutfitIds: string[];
  onToggleOutfit: (id: string) => void;
  onStartRemix: (id: string) => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({
  compareOutfitIds,
  onToggleOutfit,
  onStartRemix,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [compareMode, setCompareMode] = useState<'matrix' | 'heritage_vs_remix'>('matrix');

  const selectedOutfits = compareOutfitIds
    .map((id) => getTrangPhucById(id))
    .filter(Boolean) as KBTrangPhuc[];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DED7C6] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#1E3F5A] uppercase tracking-wider font-bold mb-1">
            <span>Ma trận đối chiếu</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
            So Sánh Trang Phục Truyền Thống
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-1">
            Đối chiếu cấu trúc cổ áo, ống tay, thân áo và nguồn tư liệu lịch sử xác thực.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#EFECE3] rounded-2xl border border-[#DED7C6] text-xs self-start sm:self-auto">
          {[
            { id: 'matrix' as const, label: 'Ma trận trang phục' },
            { id: 'heritage_vs_remix' as const, label: 'Nguyên bản vs Remix' },
          ].map((mode) => {
            const isActive = compareMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setCompareMode(mode.id)}
                className={`relative min-h-[40px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer font-semibold ${
                  isActive
                    ? 'text-[#1E3F5A]'
                    : 'text-[#4A5560] hover:text-[#161A1D]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="compareModeActivePill"
                    className="absolute inset-0 bg-white rounded-xl shadow-xs border border-[#DED7C6]/70"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative z-10">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Outfit Selector Buttons */}
      <div className="heritage-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1E3F5A] uppercase tracking-wider">
            Chọn để so sánh:
          </span>
          <span className="text-xs font-mono font-semibold text-[#4A5560] bg-[#FAF8F3] px-2.5 py-0.5 rounded-md border border-[#DED7C6]">
            {selectedOutfits.length}/3 trang phục
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {KB_TRANG_PHUC.map((outfit) => {
            const isChecked = compareOutfitIds.includes(outfit.id);
            return (
              <motion.button
                type="button"
                key={outfit.id}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => onToggleOutfit(outfit.id)}
                className={`relative min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? 'bg-[#1E3F5A] text-white border-[#1E3F5A] shadow-xs'
                    : 'bg-[#FAF8F3] text-[#4A5560] border-[#DED7C6] hover:border-[#1E3F5A] hover:text-[#161A1D]'
                }`}
              >
                <span>{outfit.ten}</span>
                {isChecked ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#4A5560] shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedOutfits.length === 0 ? (
        <EmptyState
          title="Chưa chọn trang phục để so sánh"
          description="Hãy chọn ít nhất 2 trang phục truyền thống ở thanh phía trên để kích hoạt bảng phân tích so sánh chi tiết."
          actionText="Chọn Áo Ngũ Thân & Áo Tấc"
          onAction={() => {
            onToggleOutfit('ao_ngu_than_tay_chen');
            onToggleOutfit('ao_tac');
          }}
          iconType="compare"
        />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={compareMode}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {compareMode === 'matrix' ? (
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div
                  className="grid gap-4 min-w-[320px] sm:min-w-[640px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  style={
                    selectedOutfits.length > 0
                      ? {
                          gridTemplateColumns: `repeat(${selectedOutfits.length}, minmax(260px, 1fr))`,
                        }
                      : undefined
                  }
                >
                  {selectedOutfits.map((outfit, idx) => {
                    const certaintyLabel =
                      outfit.muc_chac_chan === 'cao'
                        ? 'Mức chắc chắn: Cao'
                        : outfit.muc_chac_chan === 'trung_binh'
                        ? 'Mức chắc chắn: Trung bình'
                        : 'Mức chắc chắn: Thấp';

                    return (
                      <motion.div
                        key={outfit.id}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.22,
                          delay: shouldReduceMotion ? 0 : idx * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="heritage-card rounded-2xl overflow-hidden flex flex-col"
                      >
                        {/* Header Line-art Illustration */}
                        <div className="relative aspect-[4/3] w-full bg-[#FAF8F3] p-3 flex items-center justify-center border-b border-[#DED7C6]">
                          <OutfitVectorIllustration id={outfit.id} size="md" className="border-0 bg-transparent" />
                          <div className="absolute top-2.5 right-2.5">
                            <button
                              type="button"
                              onClick={() => onToggleOutfit(outfit.id)}
                              className="min-w-[40px] min-h-[40px] rounded-xl bg-white/95 border border-[#DED7C6] text-[#8E2516] hover:bg-[#FBEFEF] hover:border-[#B93826] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="Bỏ khỏi so sánh"
                              aria-label={`Bỏ ${outfit.ten} khỏi so sánh`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="p-4 border-b border-[#DED7C6]/70 bg-white">
                          <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D] leading-tight">
                            {outfit.ten}
                          </h3>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#2E6254] font-semibold">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>{certaintyLabel}</span>
                          </div>
                        </div>

                        {/* Comparative Rows */}
                        <div className="p-4 flex-1 space-y-3.5 text-xs divide-y divide-[#EFECE3]">
                          <div>
                            <span className="text-[#1E3F5A] font-bold uppercase tracking-wider block mb-1 text-xs">
                              Thời kỳ lịch sử
                            </span>
                            <p className="text-[#161A1D] leading-relaxed">
                              <SourceCitationText text={outfit.thoi_ky} />
                            </p>
                          </div>

                          <div className="pt-3">
                            <span className="text-[#1E3F5A] font-bold uppercase tracking-wider block mb-1 text-xs">
                              Kiểu Cổ Áo
                            </span>
                            <p className="text-[#161A1D] leading-relaxed">
                              <SourceCitationText text={outfit.bo_phan.co || 'Chưa có nguồn'} />
                            </p>
                          </div>

                          <div className="pt-3">
                            <span className="text-[#1E3F5A] font-bold uppercase tracking-wider block mb-1 text-xs">
                              Cấu trúc Tay áo
                            </span>
                            <p className="text-[#161A1D] leading-relaxed">
                              <SourceCitationText text={outfit.bo_phan.tay || 'Chưa có nguồn'} />
                            </p>
                          </div>

                          <div className="pt-3">
                            <span className="text-[#1E3F5A] font-bold uppercase tracking-wider block mb-1 text-xs">
                              Thân áo & Vạt áo
                            </span>
                            <p className="text-[#4A5560] leading-relaxed">
                              <SourceCitationText text={outfit.bo_phan.than || 'Chưa có nguồn'} />
                            </p>
                          </div>

                          <div className="pt-3">
                            <span className="text-[#1E3F5A] font-bold uppercase tracking-wider block mb-1.5 text-xs">
                              Nguồn đối chiếu
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {outfit.nguon.map((code) => {
                                const info = KB_NGUON[code];
                                return (
                                  <span
                                    key={code}
                                    title={info ? `${info.ten} (${getLoaiNguonLabel(info.loai)})` : code}
                                    className="px-2 py-0.5 rounded-md bg-[#EBF2F7] border border-[#1E3F5A]/25 text-xs font-mono font-semibold text-[#1E3F5A]"
                                  >
                                    [{code}]
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="p-4 pt-0">
                          <button
                            type="button"
                            onClick={() => onStartRemix(outfit.id)}
                            className="w-full min-h-[44px] py-2.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <span>Phối trang phục này</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* HERITAGE VS REMIX HIGHLIGHT */
              <div className="heritage-card rounded-3xl p-5 sm:p-7 space-y-6">
                <div className="max-w-2xl">
                  <h3 className="font-heritage-display text-lg sm:text-xl font-bold text-[#161A1D]">
                    Bản Gốc Di Sản vs. Bản Phối Gen Z Remix
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A5560] mt-1 leading-relaxed">
                    Nguyên tắc cốt lõi: Phối đồ linh hoạt là đưa trang phục vào đời sống, nhưng tôn trọng kết cấu nhận diện lịch sử.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#E9F2EE] rounded-2xl p-5 border border-[#2E6254]/35 space-y-2.5">
                    <div className="font-bold text-sm text-[#2E6254] flex items-center gap-2">
                      <Check className="w-4 h-4 stroke-[3] shrink-0" />
                      <span>Bản Gốc Di Sản (Phong cách truyền thống)</span>
                    </div>
                    <ul className="space-y-1.5 text-[#21473C] list-disc list-inside leading-relaxed">
                      <li>Khuy cài khép kín nghiêm cẩn, vạt trái phủ ngoài vạt phải.</li>
                      <li>Độ dài phủ qua gối, ống tay may chuẩn phom dáng theo tư liệu.</li>
                      <li>Đi kèm các phụ kiện truyền thống như khăn đóng, guốc mộc theo ghi chép.</li>
                      <li>Phù hợp nhất: Nghi lễ trang trọng, đại lễ và ngày hội truyền thống.</li>
                    </ul>
                  </div>

                  <div className="bg-[#FBEFEF] rounded-2xl p-5 border border-[#B93826]/35 space-y-2.5">
                    <div className="font-bold text-sm text-[#8E2516] flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#B93826] shrink-0" />
                      <span>Bản Phối Gen Z Remix (Cách tân nhẹ - Streetwear)</span>
                    </div>
                    <div className="text-xs font-semibold text-[#7C4D1B] bg-[#FDF9F0] px-2.5 py-0.5 rounded-md border border-[#C88E1B]/35 inline-block">
                      Gợi ý của app, không phải sự thật lịch sử
                    </div>
                    <ul className="space-y-1.5 text-[#78261A] list-disc list-inside leading-relaxed">
                      <li>Khoác tà áo như trang phục khoác ngoài tiện dụng.</li>
                      <li>Linh hoạt kết hợp với quần âu, chân váy hoặc giày sneaker mộc mạc.</li>
                      <li>Giữ gìn nét nhận diện cổ áo, không biến dạng kết cấu cốt lõi.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
