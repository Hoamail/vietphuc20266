import React, { useState } from 'react';
import { Scale, Check, Plus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  KB_TRANG_PHUC,
  getTrangPhucById,
  KB_NGUON,
  getLoaiNguonLabel,
  formatNguonText,
  getOutfitHoverNote,
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
  const [compareMode, setCompareMode] = useState<'matrix' | 'heritage_vs_remix'>('matrix');

  const selectedOutfits = compareOutfitIds
    .map((id) => getTrangPhucById(id))
    .filter(Boolean) as KBTrangPhuc[];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DED7C6] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7A8691] uppercase tracking-wider font-semibold mb-1">
            <span>Ma trận đối chiếu</span>
            <span aria-hidden="true">·</span>
            <span>Kho tri thức KB-v3</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
            So Sánh Trang Phục Truyền Thống
          </h1>
          <p className="text-xs sm:text-sm text-[#52606D] mt-1">
            Đối chiếu cấu trúc cổ áo, ống tay, thân áo và nguồn tư liệu lịch sử xác thực.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#EFECE3] rounded-xl border border-[#DED7C6] text-xs">
          <button
            type="button"
            onClick={() => setCompareMode('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              compareMode === 'matrix'
                ? 'bg-white text-[#1E3F5A] shadow-xs font-semibold'
                : 'text-[#6C7A87]'
            }`}
          >
            Ma trận trang phục
          </button>
          <button
            type="button"
            onClick={() => setCompareMode('heritage_vs_remix')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              compareMode === 'heritage_vs_remix'
                ? 'bg-white text-[#1E3F5A] shadow-xs font-semibold'
                : 'text-[#6C7A87]'
            }`}
          >
            Nguyên bản vs Remix
          </button>
        </div>
      </div>

      {/* Outfit Selector Buttons */}
      <div className="bg-white rounded-2xl p-4 border border-[#DED7C6] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1E3F5A] uppercase tracking-wider">
            Chọn để so sánh:
          </span>
          <span className="text-xs text-[#7A8691]">
            ({selectedOutfits.length}/3 trang phục)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {KB_TRANG_PHUC.map((outfit) => {
            const isChecked = compareOutfitIds.includes(outfit.id);
            return (
              <button
                type="button"
                key={outfit.id}
                title={getOutfitHoverNote(outfit)}
                onClick={() => onToggleOutfit(outfit.id)}
                className={`relative group/btn px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? 'bg-[#1E3F5A] text-white border-[#1E3F5A]'
                    : 'bg-[#F8F6F0] text-[#4A5560] border-[#DED7C6] hover:border-[#1E3F5A]'
                }`}
              >
                <span>{outfit.ten}</span>
                {getOutfitHoverNote(outfit) && (
                  <span className="pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 -top-7 z-20 whitespace-nowrap rounded-md bg-[#161A1D] px-2 py-0.5 text-[11px] font-medium text-white shadow-md">
                    {getOutfitHoverNote(outfit)}
                  </span>
                )}
                {isChecked ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#7A8691]" />
                )}
              </button>
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
        <div className="space-y-6">
          {compareMode === 'matrix' ? (
            <div className="overflow-x-auto">
              <div
                className="grid gap-4 min-w-[640px]"
                style={{
                  gridTemplateColumns: `repeat(${selectedOutfits.length}, minmax(0, 1fr))`,
                }}
              >
                {selectedOutfits.map((outfit) => {
                  const certaintyLabel =
                    outfit.muc_chac_chan === 'cao'
                      ? 'Mức chắc chắn: Cao'
                      : outfit.muc_chac_chan === 'trung_binh'
                      ? 'Mức chắc chắn: Trung bình'
                      : 'Mức chắc chắn: Thấp';

                  return (
                    <div
                      key={outfit.id}
                      className="bg-white rounded-2xl border border-[#DED7C6] overflow-hidden flex flex-col shadow-xs"
                    >
                      {/* Header Line-art Illustration */}
                      <div className="relative aspect-[4/3] w-full bg-[#FAF8F5] p-2 flex items-center justify-center">
                        <OutfitVectorIllustration id={outfit.id} size="md" className="border-0 bg-transparent" />
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            type="button"
                            onClick={() => onToggleOutfit(outfit.id)}
                            className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                            title="Bỏ khỏi so sánh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="p-4 border-b border-[#DED7C6]/60">
                        <h3
                          title={getOutfitHoverNote(outfit)}
                          className="font-heritage-display text-base font-bold text-[#161A1D] leading-tight"
                        >
                          {outfit.ten}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#2E6254] font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{certaintyLabel}</span>
                        </div>
                      </div>

                      {/* Comparative Rows */}
                      <div className="p-4 flex-1 space-y-3.5 text-xs divide-y divide-[#EFECE3]">
                        <div>
                          <span className="text-[#8E7E6B] font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                            Thời kỳ lịch sử
                          </span>
                          <p className="text-[#161A1D] leading-relaxed">
                            <SourceCitationText text={outfit.thoi_ky} />
                          </p>
                        </div>

                        <div className="pt-2.5">
                          <span className="text-[#8E7E6B] font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                            Kiểu Cổ Áo
                          </span>
                          <p className="text-[#161A1D] leading-relaxed">
                            <SourceCitationText text={outfit.bo_phan.co || 'Chưa có nguồn'} />
                          </p>
                        </div>

                        <div className="pt-2.5">
                          <span className="text-[#8E7E6B] font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                            Cấu trúc Tay áo
                          </span>
                          <p className="text-[#161A1D] leading-relaxed">
                            <SourceCitationText text={outfit.bo_phan.tay || 'Chưa có nguồn'} />
                          </p>
                        </div>

                        <div className="pt-2.5">
                          <span className="text-[#8E7E6B] font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                            Thân áo & Vạt áo
                          </span>
                          <p className="text-[#4A5560] leading-relaxed">
                            <SourceCitationText text={outfit.bo_phan.than || 'Chưa có nguồn'} />
                          </p>
                        </div>

                        <div className="pt-2.5">
                          <span className="text-[#8E7E6B] font-semibold uppercase tracking-wider block mb-1 text-[10px]">
                            Nguồn đối chiếu
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {outfit.nguon.map((code) => {
                              const info = KB_NGUON[code];
                              return (
                                <span
                                  key={code}
                                  title={info ? `${info.ten} (${getLoaiNguonLabel(info.loai)})` : code}
                                  className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D8] text-[10px] font-mono text-[#1E3F5A]"
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
                          className="w-full py-2 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Phối trang phục này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* HERITAGE VS REMIX HIGHLIGHT */
            <div className="bg-white rounded-3xl p-6 border border-[#DED7C6] space-y-6">
              <div className="max-w-2xl">
                <h3 className="font-heritage-display text-lg font-bold text-[#161A1D]">
                  Bản Gốc Di Sản vs. Bản Phối Gen Z Remix
                </h3>
                <p className="text-xs text-[#52606D] mt-1 leading-relaxed">
                  Nguyên tắc cốt lõi: Phối đồ linh hoạt là đưa trang phục vào đời sống, nhưng tôn trọng kết cấu nhận diện lịch sử.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#E9F2EE] rounded-2xl p-4 border border-[#2E6254]/30 space-y-2">
                  <div className="font-bold text-sm text-[#2E6254] flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Bản Gốc Di Sản (Phong cách truyền thống)</span>
                  </div>
                  <ul className="space-y-1.5 text-[#334D43] list-disc list-inside">
                    <li>Khuy cài khép kín nghiêm cẩn, vạt trái phủ ngoài vạt phải.</li>
                    <li>Độ dài phủ qua gối, ống tay may chuẩn phom dáng theo tư liệu.</li>
                    <li>Đi kèm các phụ kiện truyền thống như khăn đóng, guốc mộc theo ghi chép.</li>
                    <li>Phù hợp nhất: Nghi lễ trang trọng, đại lễ và ngày hội truyền thống.</li>
                  </ul>
                </div>

                <div className="bg-[#FBEFEF] rounded-2xl p-4 border border-[#B93826]/30 space-y-2">
                  <div className="font-bold text-sm text-[#B93826] flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>Bản Phối Gen Z Remix (Cách tân nhẹ - Streetwear)</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[#8B5A2B] bg-[#FDF9F0] px-2 py-0.5 rounded border border-[#C88E1B]/20 inline-block">
                    Gợi ý của app, không phải sự thật lịch sử
                  </div>
                  <ul className="space-y-1.5 text-[#78261A] list-disc list-inside">
                    <li>Khoác tà áo như trang phục khoác ngoài tiện dụng.</li>
                    <li>Linh hoạt kết hợp với quần âu, chân váy hoặc giày sneaker mộc mạc.</li>
                    <li>Giữ gìn nét nhận diện cổ áo, không biến dạng kết cấu cốt lõi.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
