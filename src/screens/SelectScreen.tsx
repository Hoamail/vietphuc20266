import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Sparkles, Eye } from 'lucide-react';
import { KB_DATA, KB_TRANG_PHUC, getOutfitHoverNote } from '../data/kb';
import { KBTrangPhuc, KBNhom } from '../types/kb';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { KBOutfitDetailModal } from './KBOutfitDetailModal';
import { SourceCitationText } from '../components/SourceCitationText';

const kbData = KB_DATA;

interface SelectScreenProps {
  selectedOutfitId: string;
  onSelectOutfit: (id: string) => void;
  onContinue: () => void;
}

export const SelectScreen: React.FC<SelectScreenProps> = ({
  selectedOutfitId,
  onSelectOutfit,
  onContinue,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<'all' | KBNhom>('all');
  const [inspectingOutfit, setInspectingOutfit] = useState<KBTrangPhuc | null>(null);

  const outfits = KB_TRANG_PHUC;
  const currentOutfit = outfits.find((o) => o.id === selectedOutfitId) || outfits[0];

  const filteredOutfits = outfits.filter((outfit) => {
    if (selectedCategory === 'all') return true;
    return outfit.nhom === selectedCategory;
  });

  const getCertaintyBadge = (level: string) => {
    switch (level) {
      case 'cao':
        return {
          label: 'Mức chắc chắn: Cao',
          bg: 'bg-[#EBF2F7]',
          text: 'text-[#1E3F5A]',
          border: 'border-[#1E3F5A]/30',
        };
      case 'trung_binh':
        return {
          label: 'Mức chắc chắn: Trung bình',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#8A5D0B]',
          border: 'border-[#C88E1B]/45',
        };
      case 'thap':
      default:
        return {
          label: 'Mức chắc chắn: Thấp',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#B93826]',
          border: 'border-[#B93826]/35',
        };
    }
  };

  const getGroupBadge = (group: KBNhom) => {
    switch (group) {
      case 'co_phuc':
        return { label: 'Cổ phục', color: 'bg-[#EBF2F7]/95 text-[#1E3F5A] border border-[#1E3F5A]/20' };
      case 'dan_gian':
        return { label: 'Dân gian', color: 'bg-[#FDF9F0]/95 text-[#7C4D1B] border border-[#C88E1B]/30' };
      case 'hien_dai_cach_tan':
        return { label: 'Hiện đại cách tân', color: 'bg-[#FBEFEF]/95 text-[#B93826] border border-[#B93826]/25' };
      default:
        return { label: group, color: 'bg-[#F8F6F0] text-[#4A5560] border border-[#DED7C6]' };
    }
  };

  const filterTabs: { id: 'all' | KBNhom; label: string }[] = [
    { id: 'all', label: `Tất cả (${outfits.length})` },
    { id: 'co_phuc', label: 'Cổ phục (3)' },
    { id: 'dan_gian', label: 'Dân gian (2)' },
    { id: 'hien_dai_cach_tan', label: 'Hiện đại cách tân (1)' },
  ];

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      {/* Step Header */}
      <div className="border-b border-[#DED7C6] pb-5">
        <div className="flex items-center gap-2 text-xs text-[#4A5560] uppercase tracking-wider font-semibold mb-1.5">
          <span className="px-2 py-0.5 rounded-md bg-[#1E3F5A] text-white font-mono">
            Bước 1 / 3
          </span>
          <span aria-hidden="true">·</span>
          <span>Khám phá kho tri thức cổ phục v3</span>
        </div>
        <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D] text-balance">
          Chọn Trang Phục Truyền Thống
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5560] mt-1.5 leading-relaxed max-w-2xl">
          Toàn bộ dữ liệu được quản lý theo tiêu chuẩn minh bạch nguồn gốc (KB-v3) với minh họa đồ họa vector trung tính không bản quyền.
        </p>
      </div>

      {/* Part 1: Danh mục và Bộ lọc nhóm trang phục */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
              1. Chọn trang phục truyền thống ({filteredOutfits.length}/{outfits.length})
            </h2>
            <span className="text-xs text-[#4A5560] mt-0.5 inline-block">
              Đang chọn:{' '}
              <strong
                title={getOutfitHoverNote(currentOutfit)}
                className="text-[#161A1D] font-semibold"
              >
                {currentOutfit.ten}
              </strong>
            </span>
          </div>

          {/* Group Filter Tabs (Segmented Button Control) */}
          <div
            role="tablist"
            aria-label="Lọc theo nhóm trang phục"
            className="flex items-center gap-1 p-1 bg-[#EFECE3] rounded-xl border border-[#DED7C6] overflow-x-auto text-xs"
          >
            {filterTabs.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`relative min-h-[44px] px-3.5 py-2 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap font-medium ${
                    active
                      ? 'text-[#1E3F5A] font-semibold'
                      : 'text-[#4A5560] hover:text-[#161A1D]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="select-category-pill"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-[#DED7C6]/60"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Outfit Cards Grid (6 Outfits with Neutral Vector Illustration) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredOutfits.map((outfit, idx) => {
            const isSelected = outfit.id === selectedOutfitId;
            const certainty = getCertaintyBadge(outfit.muc_chac_chan);
            const group = getGroupBadge(outfit.nhom);

            return (
              <motion.div
                key={outfit.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  delay: shouldReduceMotion ? 0 : idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => onSelectOutfit(outfit.id)}
                className={`group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1E3F5A] ring-2 ring-[#1E3F5A]/25 bg-[#FBF9F5] shadow-md'
                    : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/60 hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                {/* Visual SVG / CSS Illustration Area (No Copyright Images) */}
                <div className="relative bg-gradient-to-b from-[#FAF8F3] to-[#F2EDE2] border-b border-[#DED7C6]/60">
                  <OutfitVectorIllustration id={outfit.id} size="md" />

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${group.color} backdrop-blur-xs`}>
                      {group.label}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </motion.div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div>
                    {/* Tên & Nhãn mức chắc chắn */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <h3
                        title={getOutfitHoverNote(outfit)}
                        className="relative group/name font-heritage-display text-base sm:text-lg font-bold text-[#161A1D] group-hover:text-[#1E3F5A] transition-colors leading-snug inline-flex items-center gap-1"
                      >
                        <span className={getOutfitHoverNote(outfit) ? 'underline decoration-dotted decoration-[#6E5D4B] underline-offset-4' : ''}>
                          {outfit.ten}
                        </span>
                        {getOutfitHoverNote(outfit) && (
                          <span className="pointer-events-none opacity-0 group-hover/name:opacity-100 transition-opacity absolute left-0 -top-7 z-20 whitespace-nowrap rounded-md bg-[#161A1D] px-2.5 py-1 font-sans text-xs font-medium text-white shadow-md">
                            {getOutfitHoverNote(outfit)}
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* Mức chắc chắn */}
                    <div className="mb-2.5">
                      <span className={`inline-block text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md border ${certainty.bg} ${certainty.text} ${certainty.border}`}>
                        {certainty.label}
                      </span>
                    </div>

                    {/* Thời kỳ */}
                    <div className="text-xs text-[#4A5560] line-clamp-2 leading-relaxed">
                      <span className="text-[#6E5D4B] font-semibold">Thời kỳ: </span>
                      <SourceCitationText
                        text={outfit.thoi_ky}
                        sourceMap={kbData.nguon}
                        onSelectSource={() => setInspectingOutfit(outfit)}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-[#DED7C6]/70 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingOutfit(outfit);
                      }}
                      className="min-h-[44px] px-3 py-2 text-xs font-medium text-[#1E3F5A] hover:bg-[#EBF2F7] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Xem nguồn ({outfit.nguon.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectOutfit(outfit.id)}
                      className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E3F5A] text-white shadow-2xs'
                          : 'bg-[#F8F6F0] text-[#4A5560] hover:bg-[#EFECE3] hover:text-[#161A1D]'
                      }`}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn phối'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Selected Outfit Summary Callout */}
      <div className="p-4 sm:p-5 bg-[#EBF2F7] rounded-2xl border border-[#1E3F5A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-[#DED7C6] flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#1E3F5A]" />
          </div>
          <div>
            <div
              title={getOutfitHoverNote(currentOutfit)}
              className="font-semibold text-sm sm:text-base text-[#1E3F5A]"
            >
              Trang phục đang chọn: {currentOutfit.ten}
            </div>
            <p className="text-xs sm:text-sm text-[#3E4C59] mt-0.5 leading-relaxed">
              Ở bước tiếp theo, bạn sẽ lần lượt chọn bối cảnh sử dụng, mức độ cách tân, bảng màu, phụ kiện và điều kiện thời tiết.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setInspectingOutfit(currentOutfit)}
          className="min-h-[44px] px-3 py-2 text-xs font-semibold text-[#1E3F5A] hover:bg-white/60 rounded-xl transition-colors shrink-0 cursor-pointer self-start sm:self-center"
        >
          Xem chi tiết nguồn &rarr;
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#DED7C6]">
        <div className="text-xs sm:text-sm text-[#4A5560]">
          Tiếp theo: Chọn bối cảnh và tuỳ biến theo 5 bước
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="min-h-[44px] w-full sm:w-auto justify-center px-6 py-3 bg-[#1E3F5A] hover:bg-[#12283A] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <span>Tiếp tục: Chọn bối cảnh &amp; Tuỳ biến</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* KB Outfit Detail Modal */}
      {inspectingOutfit && (
        <KBOutfitDetailModal
          outfit={inspectingOutfit}
          sourceMap={kbData.nguon}
          onClose={() => setInspectingOutfit(null)}
          onSelectForRemix={(id) => {
            onSelectOutfit(id);
            onContinue();
          }}
        />
      )}
    </div>
  );
};

