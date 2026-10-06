import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, Eye } from 'lucide-react';
import { KB_DATA, KB_TRANG_PHUC } from '../data/kb';
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
          border: 'border-[#1E3F5A]/25',
        };
      case 'trung_binh':
        return {
          label: 'Mức chắc chắn: Trung bình',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#C88E1B]',
          border: 'border-[#C88E1B]/35',
        };
      case 'thap':
      default:
        return {
          label: 'Mức chắc chắn: Thấp',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#B93826]',
          border: 'border-[#B93826]/30',
        };
    }
  };

  const getGroupBadge = (group: KBNhom) => {
    switch (group) {
      case 'co_phuc':
        return { label: 'Cổ phục', color: 'bg-[#EBF2F7] text-[#1E3F5A]' };
      case 'dan_gian':
        return { label: 'Dân gian', color: 'bg-[#FDF9F0] text-[#8B5A2B]' };
      case 'hien_dai_cach_tan':
        return { label: 'Hiện đại cách tân', color: 'bg-[#FBEFEF] text-[#B93826]' };
      default:
        return { label: group, color: 'bg-[#F8F6F0] text-[#52606D]' };
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Step Header */}
      <div className="border-b border-[#DED7C6] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#7A8691] uppercase tracking-wider font-semibold mb-1">
          <span>Bước 1 / 3</span>
          <span aria-hidden="true">·</span>
          <span>Khám phá kho tri thức cổ phục v3</span>
        </div>
        <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
          Chọn Trang Phục Truyền Thống
        </h1>
        <p className="text-xs sm:text-sm text-[#52606D] mt-1">
          Toàn bộ dữ liệu được quản lý theo tiêu chuẩn minh bạch nguồn gốc (KB-v3) với minh họa đồ họa vector trung tính không bản quyền.
        </p>
      </div>

      {/* Part 1: Danh mục và Bộ lọc nhóm trang phục */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1E3F5A]">
              1. Chọn trang phục truyền thống ({filteredOutfits.length}/{outfits.length})
            </h2>
            <span className="text-xs text-[#7A8691]">Đang chọn: <strong>{currentOutfit.ten}</strong></span>
          </div>

          {/* Group Filter Tabs (Segmented Button Control) */}
          <div className="flex items-center gap-1 p-1 bg-[#EFECE3] rounded-xl border border-[#DED7C6] overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium ${
                selectedCategory === 'all'
                  ? 'bg-white text-[#1E3F5A] shadow-xs'
                  : 'text-[#6C7A87] hover:text-[#161A1D]'
              }`}
            >
              Tất cả ({outfits.length})
            </button>
            <button
              onClick={() => setSelectedCategory('co_phuc')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium ${
                selectedCategory === 'co_phuc'
                  ? 'bg-white text-[#1E3F5A] shadow-xs'
                  : 'text-[#6C7A87] hover:text-[#161A1D]'
              }`}
            >
              Cổ phục (3)
            </button>
            <button
              onClick={() => setSelectedCategory('dan_gian')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium ${
                selectedCategory === 'dan_gian'
                  ? 'bg-white text-[#1E3F5A] shadow-xs'
                  : 'text-[#6C7A87] hover:text-[#161A1D]'
              }`}
            >
              Dân gian (2)
            </button>
            <button
              onClick={() => setSelectedCategory('hien_dai_cach_tan')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-medium ${
                selectedCategory === 'hien_dai_cach_tan'
                  ? 'bg-white text-[#1E3F5A] shadow-xs'
                  : 'text-[#6C7A87] hover:text-[#161A1D]'
              }`}
            >
              Hiện đại cách tân (1)
            </button>
          </div>
        </div>

        {/* Outfit Cards Grid (6 Outfits with Neutral Vector Illustration) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutfits.map((outfit) => {
            const isSelected = outfit.id === selectedOutfitId;
            const certainty = getCertaintyBadge(outfit.muc_chac_chan);
            const group = getGroupBadge(outfit.nhom);

            return (
              <div
                key={outfit.id}
                onClick={() => onSelectOutfit(outfit.id)}
                className={`group rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1E3F5A] ring-2 ring-[#1E3F5A]/25 bg-white shadow-md'
                    : 'border-[#DED7C6] bg-white hover:border-[#1E3F5A]/50 hover:shadow-xs'
                }`}
              >
                {/* Visual SVG / CSS Illustration Area (No Copyright Images) */}
                <div className="relative">
                  <OutfitVectorIllustration id={outfit.id} size="md" />

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${group.color} backdrop-blur-xs`}>
                      {group.label}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#1E3F5A] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Tên & Nhãn mức chắc chắn */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3 className="font-heritage-display text-base font-bold text-[#161A1D] group-hover:text-[#1E3F5A] transition-colors leading-snug">
                        {outfit.ten}
                      </h3>
                    </div>

                    {/* Mức chắc chắn */}
                    <div className="mb-2">
                      <span className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${certainty.bg} ${certainty.text} ${certainty.border}`}>
                        {certainty.label}
                      </span>
                    </div>

                    {/* Thời kỳ */}
                    <div className="text-xs text-[#52606D] line-clamp-2 leading-relaxed">
                      <span className="text-[#8E7E6B] font-medium">Thời kỳ: </span>
                      <SourceCitationText
                        text={outfit.thoi_ky}
                        sourceMap={kbData.nguon}
                        onSelectSource={(code) => setInspectingOutfit(outfit)}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-[#DED7C6]/60 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingOutfit(outfit);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-[#1E3F5A] hover:bg-[#EBF2F7] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem nguồn ({outfit.nguon.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectOutfit(outfit.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E3F5A] text-white'
                          : 'bg-[#F8F6F0] text-[#52606D] hover:bg-[#EFECE3]'
                      }`}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn phối'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Selected Outfit Summary Callout */}
      <div className="p-4 bg-[#EBF2F7] rounded-2xl border border-[#1E3F5A]/20 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#DED7C6] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#1E3F5A]" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#1E3F5A]">
              Trang phục đang chọn: {currentOutfit.ten}
            </div>
            <p className="text-xs text-[#52606D] mt-0.5 leading-relaxed">
              Ở bước tiếp theo, bạn sẽ lần lượt chọn bối cảnh sử dụng, mức độ cách tân, bảng màu, phụ kiện và điều kiện thời tiết.
            </p>
          </div>
        </div>

        <button
          onClick={() => setInspectingOutfit(currentOutfit)}
          className="text-xs font-medium text-[#1E3F5A] hover:underline shrink-0 cursor-pointer pt-1"
        >
          Xem chi tiết nguồn &rarr;
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="pt-4 flex items-center justify-between border-t border-[#DED7C6]">
        <div className="text-xs text-[#7A8691]">
          Tiếp theo: Chọn bối cảnh và tuỳ biến theo 5 bước
        </div>
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <span>Tiếp tục: Chọn bối cảnh & Tuỳ biến</span>
          <ArrowRight className="w-4 h-4" />
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
