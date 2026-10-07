import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Share2, Trash2, ArrowRight, X, Check, Copy } from 'lucide-react';
import { SavedLook } from '../types/vietphuc';
import {
  KB_TRANG_PHUC,
  getTrangPhucById,
  BOI_CANH,
  getBoiCanhById,
  POTTERY_SILK_PALETTES,
  getOutfitHoverNote,
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
  const shouldReduceMotion = useReducedMotion();
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
          <div className="flex items-center gap-2 text-xs text-[#1E3F5A] uppercase tracking-wider font-bold mb-1">
            <span>Bộ sưu tập cá nhân</span>
            <span aria-hidden="true">·</span>
            <span>Gen Z Lookbook</span>
          </div>
          <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D]">
            Lookbook Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-1">
            Lưu giữ các bản phối phong cách và chia sẻ dạng thẻ Story lên mạng xã hội.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterOutfitId('all')}
            className={`min-h-[44px] px-3.5 py-2 text-xs rounded-xl font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              filterOutfitId === 'all'
                ? 'bg-[#1E3F5A] text-white shadow-xs'
                : 'bg-white text-[#4A5560] border border-[#DED7C6] hover:border-[#1E3F5A] hover:text-[#161A1D]'
            }`}
          >
            Tất cả ({looks.length})
          </button>
          {KB_TRANG_PHUC.map((o) => (
            <button
              type="button"
              key={o.id}
              title={getOutfitHoverNote(o)}
              onClick={() => setFilterOutfitId(o.id)}
              className={`min-h-[44px] px-3.5 py-2 text-xs rounded-xl font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                filterOutfitId === o.id
                  ? 'bg-[#1E3F5A] text-white shadow-xs'
                  : 'bg-white text-[#4A5560] border border-[#DED7C6] hover:border-[#1E3F5A] hover:text-[#161A1D]'
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
          {filteredLooks.map((look, idx) => {
            const outfit = getTrangPhucById(look.outfitId);
            const boiCanh = getBoiCanhById(look.purposeId) || BOI_CANH[0];
            const palette =
              POTTERY_SILK_PALETTES.find((c) => c.id === look.customization.colorSchemeId) ||
              POTTERY_SILK_PALETTES[0];
            const levelName = getRemixLevelTitle(look.customization.remixLevel);

            return (
              <motion.div
                key={look.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.24,
                  delay: shouldReduceMotion ? 0 : idx * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="heritage-card rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Visual Thumbnail using SVG Line-art */}
                <div className="relative aspect-[4/3] w-full bg-[#FAF8F3] p-3 flex items-center justify-center border-b border-[#DED7C6]">
                  <OutfitVectorIllustration
                    id={look.outfitId}
                    size="md"
                    className="border-0 bg-transparent w-full h-full"
                    colorSchemeId={look.customization.colorSchemeId}
                    selectedAccessoryIds={look.customization.selectedAccessoryIds}
                    remixLevel={look.customization.remixLevel}
                  />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveStoryCard(look)}
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-white/95 border border-[#DED7C6] text-[#1E3F5A] hover:bg-[#1E3F5A] hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Xem & Chia sẻ thẻ Story"
                      aria-label={`Chia sẻ thẻ Story cho ${look.title}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLook(look.id)}
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-white/95 border border-[#DED7C6] text-[#8E2516] hover:bg-[#B93826] hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title="Xóa khỏi Lookbook"
                      aria-label={`Xóa ${look.title} khỏi Lookbook`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 text-[#161A1D] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-[#DED7C6] shadow-2xs">
                    <div className="text-xs text-[#4A5560] font-mono mb-0.5 truncate">
                      {boiCanh.ten} · {levelName}
                    </div>
                    <h3 className="font-heritage-display text-sm sm:text-base font-bold text-[#1E3F5A] leading-tight truncate">
                      {look.title}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#4A5560] font-medium flex-wrap">
                      <span title={getOutfitHoverNote(outfit)} className="text-[#161A1D] font-semibold">
                        {outfit?.ten || 'Trang phục'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: palette.primaryHex }}
                          aria-hidden="true"
                        />
                        <span>{palette?.name}</span>
                      </span>
                    </div>

                    {look.notes && (
                      <p className="text-xs text-[#4A5560] leading-relaxed line-clamp-2">
                        {look.notes}
                      </p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="pt-2.5 border-t border-[#DED7C6]/70 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStoryCard(look)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] hover:border-[#1E3F5A] text-xs font-semibold text-[#1E3F5A] cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>Thẻ Story</span>
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemixLook(look)}
                      className="min-h-[44px] px-3.5 py-2 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Tùy biến tiếp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* STORY CARD MODAL FOR GEN Z SOCIAL SHARING */}
      {activeStoryCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#161A1D] text-white rounded-3xl border border-[#3A424A] max-w-sm w-full overflow-hidden shadow-2xl p-5 relative"
          >
            <button
              type="button"
              onClick={() => setActiveStoryCard(null)}
              className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer z-10 transition-colors"
              aria-label="Đóng thẻ Story"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Story Card Header */}
            <div className="text-center mb-3.5">
              <span className="text-xs font-mono uppercase tracking-widest text-[#DED7C6]">
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
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/15 bg-[#FAF8F3] p-3 flex flex-col items-center justify-center">
                    <OutfitVectorIllustration
                      id={activeStoryCard.outfitId}
                      size="lg"
                      className="border-0 bg-transparent w-full h-full"
                      colorSchemeId={activeStoryCard.customization.colorSchemeId}
                      selectedAccessoryIds={activeStoryCard.customization.selectedAccessoryIds}
                      remixLevel={activeStoryCard.customization.remixLevel}
                    />

                    <div className="absolute bottom-3 left-3 right-3 text-[#161A1D] bg-white/95 p-3 rounded-xl border border-[#DED7C6] shadow-sm">
                      <div
                        title={getOutfitHoverNote(outfit)}
                        className="text-xs text-[#4A5560] font-semibold"
                      >
                        {outfit?.ten}
                      </div>
                      <h4 className="font-heritage-display text-base font-bold text-[#1E3F5A] leading-tight">
                        {activeStoryCard.title}
                      </h4>
                      <div className="mt-1 text-xs text-[#4A5560]">
                        Bối cảnh: {boiCanh.ten} · {levelName}
                      </div>
                    </div>
                  </div>

                  {/* Verification Footer */}
                  <div className="p-3.5 bg-white/10 rounded-xl border border-white/15 text-xs">
                    <div className="flex items-center justify-between text-[#F8F6F0] mb-1">
                      <span className="font-semibold text-xs">
                        {certaintyLabel}
                      </span>
                    </div>
                    <div className="text-xs text-[#DED7C6] line-clamp-1 font-mono">
                      Nguồn đối chiếu: {outfit?.nguon.map((c) => `[${c}]`).join(' ')}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyStoryText(activeStoryCard)}
                      className="flex-1 min-h-[44px] py-2.5 bg-[#B93826] hover:bg-[#8E2516] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {copiedStory ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã sao chép caption!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép Caption Story</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
};
