import React, { useState } from 'react';
import { Share2, Trash2, ArrowRight, X, Check, Copy } from 'lucide-react';
import { SavedLook } from '../types/vietphuc';
import {
  KB_TRANG_PHUC,
  getTrangPhucById,
  BOI_CANH,
  getBoiCanhById,
  POTTERY_SILK_PALETTES,
} from '../data/kb';
import { EmptyState } from '../components/StatesFeedback';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';

interface LookbookScreenProps {
  looks: SavedLook[];
  onDeleteLook: (id: string) => void;
  onStartRemix: () => void;
  onRemixLook: (look: SavedLook) => void;
}

export const LookbookScreen: React.FC<LookbookScreenProps> = ({
  looks,
  onDeleteLook,
  onStartRemix,
  onRemixLook,
}) => {
  const [filterOutfitId, setFilterOutfitId] = useState<string>('all');
  const [activeStoryCard, setActiveStoryCard] = useState<SavedLook | null>(null);
  const [copiedStory, setCopiedStory] = useState(false);

  const filteredLooks = looks.filter((look) => {
    if (filterOutfitId === 'all') return true;
    return look.outfitId === filterOutfitId;
  });

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

  const handleCopyStoryText = (look: SavedLook) => {
    const outfit = getTrangPhucById(look.outfitId);
    const boiCanh = getBoiCanhById(look.purposeId) || BOI_CANH[0];
    const levelName = getRemixLevelTitle(look.customization.remixLevel);
    const certaintyLabel =
      outfit?.muc_chac_chan === 'cao'
        ? 'Mức chắc chắn: Cao'
        : outfit?.muc_chac_chan === 'trung_binh'
        ? 'Mức chắc chắn: Trung bình'
        : 'Mức chắc chắn: Thấp';

    const text = `👘 [Việt Phục Remix 2026]\n✨ Bản phối: ${look.title}\n📜 Di sản: ${outfit?.ten} (${outfit?.thoi_ky})\n🎯 Bối cảnh: ${boiCanh.ten}\n🎨 Phong cách: ${levelName}\n🛡️ Đối chiếu: ${certaintyLabel}\n#VietPhucRemix #AIArena2026 #VietnameseHeritage`;
    navigator.clipboard.writeText(text);
    setCopiedStory(true);
    setTimeout(() => setCopiedStory(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DED7C6] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7A8691] uppercase tracking-wider font-semibold mb-1">
            <span>Bộ sưu tập cá nhân</span>
            <span aria-hidden="true">·</span>
            <span>Gen Z Lookbook</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
            Lookbook Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#52606D] mt-1">
            Lưu giữ các bản phối phong cách và chia sẻ dạng thẻ Story lên mạng xã hội.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterOutfitId('all')}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filterOutfitId === 'all'
                ? 'bg-[#1E3F5A] text-white'
                : 'bg-white text-[#52606D] border border-[#DED7C6] hover:border-[#1E3F5A]'
            }`}
          >
            Tất cả ({looks.length})
          </button>
          {KB_TRANG_PHUC.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => setFilterOutfitId(o.id)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filterOutfitId === o.id
                  ? 'bg-[#1E3F5A] text-white'
                  : 'bg-white text-[#52606D] border border-[#DED7C6] hover:border-[#1E3F5A]'
              }`}
            >
              {o.ten}
            </button>
          ))}
        </div>
      </div>

      {filteredLooks.length === 0 ? (
        <EmptyState
          title="Lookbook đang trống"
          description="Bạn chưa lưu bản phối nào trong bộ sưu tập cá nhân. Hãy bắt đầu phối trang phục truyền thống theo bối cảnh để lưu lại."
          actionText="Bắt đầu phối đồ"
          onAction={onStartRemix}
          iconType="lookbook"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLooks.map((look) => {
            const outfit = getTrangPhucById(look.outfitId);
            const boiCanh = getBoiCanhById(look.purposeId) || BOI_CANH[0];
            const palette =
              POTTERY_SILK_PALETTES.find((c) => c.id === look.customization.colorSchemeId) ||
              POTTERY_SILK_PALETTES[0];
            const levelName = getRemixLevelTitle(look.customization.remixLevel);

            return (
              <div
                key={look.id}
                className="bg-white rounded-2xl border border-[#DED7C6] overflow-hidden flex flex-col justify-between hover:border-[#1E3F5A]/50 hover:shadow-md transition-all group"
              >
                {/* Visual Thumbnail using SVG Line-art */}
                <div className="relative aspect-[4/3] w-full bg-[#FAF8F5] p-3 flex items-center justify-center border-b border-[#DED7C6]">
                  <OutfitVectorIllustration id={look.outfitId} size="md" className="border-0 bg-transparent w-full h-full" />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveStoryCard(look)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-[#1E3F5A] transition-colors cursor-pointer"
                      title="Xem & Chia sẻ thẻ Story"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLook(look.id)}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-[#B93826] transition-colors cursor-pointer"
                      title="Xóa khỏi Lookbook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3 text-[#161A1D] bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-[#DED7C6]/80 shadow-2xs">
                    <div className="text-[10px] text-[#7A8691] font-mono mb-0.5">
                      {boiCanh.ten} · {levelName}
                    </div>
                    <h3 className="font-heritage-display text-sm font-bold text-[#1E3F5A] leading-tight truncate">
                      {look.title}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#52606D] flex-wrap">
                      <span>{outfit?.ten || 'Trang phục'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{palette?.name}</span>
                    </div>

                    {look.notes && (
                      <p className="text-xs text-[#6C7A87] leading-relaxed line-clamp-2">
                        {look.notes}
                      </p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="pt-2 border-t border-[#DED7C6]/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveStoryCard(look)}
                      className="text-xs font-semibold text-[#1E3F5A] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Thẻ Story</span>
                      <Share2 className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemixLook(look)}
                      className="px-3 py-1.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Tùy biến tiếp</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STORY CARD MODAL FOR GEN Z SOCIAL SHARING */}
      {activeStoryCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#161A1D] text-white rounded-3xl border border-[#3A424A] max-w-sm w-full overflow-hidden shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={() => setActiveStoryCard(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Story Card Header */}
            <div className="text-center mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#DED7C6]">
                AI ARENA VIETNAM 2026
              </span>
              <h3 className="font-heritage-display text-lg font-bold text-white mt-0.5">
                Việt Phục Remix Story
              </h3>
            </div>

            {/* Story Visual Frame */}
            {(() => {
              const outfit = getTrangPhucById(activeStoryCard.outfitId);
              const boiCanh = getBoiCanhById(activeStoryCard.purposeId) || BOI_CANH[0];
              const levelName = getRemixLevelTitle(activeStoryCard.customization.remixLevel);
              const certaintyLabel =
                outfit?.muc_chac_chan === 'cao'
                  ? 'Mức chắc chắn: Cao'
                  : outfit?.muc_chac_chan === 'trung_binh'
                  ? 'Mức chắc chắn: Trung bình'
                  : 'Mức chắc chắn: Thấp';

              return (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/15 bg-[#FAF8F5] p-3 flex flex-col items-center justify-center">
                    <OutfitVectorIllustration id={activeStoryCard.outfitId} size="lg" className="border-0 bg-transparent w-full h-full" />

                    <div className="absolute bottom-3 left-3 right-3 text-[#161A1D] bg-white/95 p-3 rounded-xl border border-[#DED7C6] shadow-sm">
                      <div className="text-xs text-[#7A8691] font-medium">
                        {outfit?.ten}
                      </div>
                      <h4 className="font-heritage-display text-base font-bold text-[#1E3F5A] leading-tight">
                        {activeStoryCard.title}
                      </h4>
                      <div className="mt-1 text-[11px] text-[#52606D]">
                        Bối cảnh: {boiCanh.ten} · {levelName}
                      </div>
                    </div>
                  </div>

                  {/* Verification Footer */}
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs">
                    <div className="flex items-center justify-between text-[#EFECE3] mb-1">
                      <span className="font-semibold text-[11px]">
                        {certaintyLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A6B2BD] line-clamp-1">
                      Nguồn đối chiếu: {outfit?.nguon.map((c) => `[${c}]`).join(' ')}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyStoryText(activeStoryCard)}
                      className="flex-1 py-2 bg-[#B93826] hover:bg-[#8E2516] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {copiedStory ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã sao chép caption!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép Caption Story</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
