import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, BookOpen, Layers, CheckCircle2, Camera } from 'lucide-react';
import { getTrangPhucById, KB_NGUON, getLoaiNguonLabel, formatNguonText, getOutfitHoverNote } from '../data/kb';
import { GuardianBadge } from '../components/GuardianBadge';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';

interface HomeScreenProps {
  onStartRemix: (outfitId?: string) => void;
  onOpenLookbook: () => void;
  onOpenCompare: () => void;
  onOpenImageGuardian?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartRemix,
  onOpenLookbook,
  onOpenCompare,
  onOpenImageGuardian,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // 3 thẻ nổi bật theo yêu cầu: ao_ngu_than_tay_chen, ao_tac, ao_giao_linh
  const featuredIds = ['ao_ngu_than_tay_chen', 'ao_tac', 'ao_giao_linh'];
  const featuredOutfits = featuredIds
    .map((id) => getTrangPhucById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getTrangPhucById>>[];

  return (
    <div className="space-y-9 sm:space-y-12 pb-8">
      {/* Hero Section với nền hoa văn SVG tự vẽ & khung di sản gốm - lụa */}
      <motion.section
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-[#C88E1B]/40 bg-gradient-to-br from-[#1E3F5A] via-[#18344B] to-[#12283A] text-white shadow-lg p-6 sm:p-10 lg:p-12"
      >
        {/* Viền chỉ tơ tằm nội khung */}
        <div className="absolute inset-2.5 sm:inset-3.5 rounded-2xl border border-[#C88E1B]/25 pointer-events-none" />

        {/* Nền họa tiết hoa sen & kỷ hà SVG tự vẽ */}
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heritage-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
                <circle cx="32" cy="32" r="20" fill="none" stroke="#F8F6F0" strokeWidth="0.9" strokeDasharray="2 3" />
                <path d="M32 12 L32 52 M12 32 L52 32" stroke="#F8F6F0" strokeWidth="0.75" />
                <circle cx="32" cy="32" r="4" fill="#C88E1B" fillOpacity="0.6" />
                <path d="M0 0 L16 16 M64 0 L48 16 M0 64 L16 48 M64 64 L48 48" stroke="#F8F6F0" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heritage-pattern)" />
          </svg>
        </div>

        {/* Ánh men ngọc và tơ tằm góc phải */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#C88E1B]/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-[#2E6254]/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex flex-wrap items-center gap-2 text-xs text-[#F3EFE6] mb-3 font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#C88E1B]" />
            <span>AI Arena Vietnam 2026</span>
            <span aria-hidden="true" className="text-[#C88E1B]">·</span>
            <span>Kho tri thức di sản KB-v3</span>
          </div>

          <h1 className="font-heritage-display text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white text-balance leading-[1.18]">
            Khám Phá &amp; Phối Việt Phục Theo Hơi Thở Đương Đại
          </h1>

          <p className="text-xs sm:text-base text-[#F3EFE6] mt-3.5 max-w-xl leading-relaxed">
            Giải pháp sáng tạo giúp học sinh, sinh viên khám phá các dạng thức trang phục truyền thống Việt Nam theo bối cảnh sống động — minh bạch nguồn gốc tư liệu và mức chắc chắn.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <button
              type="button"
              onClick={() => onStartRemix()}
              className="min-h-[44px] px-5 py-2.5 bg-[#B93826] hover:bg-[#9E2C1C] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md"
            >
              <span>Bắt đầu phối đồ</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={onOpenCompare}
              className="min-h-[44px] px-4 py-2.5 bg-white/12 hover:bg-white/22 active:scale-[0.98] text-white backdrop-blur-md text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer border border-white/25"
            >
              Ma trận so sánh
            </button>

            {onOpenImageGuardian && (
              <button
                type="button"
                onClick={onOpenImageGuardian}
                className="min-h-[44px] px-4 py-2.5 bg-white/12 hover:bg-white/22 active:scale-[0.98] text-white backdrop-blur-md text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer border border-white/25 flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4 shrink-0 text-[#F3EFE6]" />
                <span>Kiểm tra ảnh (Vision)</span>
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* 3 Trụ Cột Giá Trị Cốt Lõi */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="heritage-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E3F5A]" />
          <div className="w-10 h-10 rounded-xl bg-[#EBF2F7] text-[#1E3F5A] flex items-center justify-center mb-3.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D] leading-snug">
            Minh bạch nguồn gốc tư liệu và mức chắc chắn
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-2 leading-relaxed">
            Trung thực về mức độ chắc chắn tư liệu lịch sử (cao / trung bình / thấp). Trích dẫn rõ ràng nguồn gốc báo chí, tạp chí và khảo cứu.
          </p>
        </div>

        <div className="heritage-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E6254]" />
          <div className="w-10 h-10 rounded-xl bg-[#E9F2EE] text-[#2E6254] flex items-center justify-center mb-3.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D] leading-snug">
            3 Cấp Độ Cách Tân Gen Z
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-2 leading-relaxed">
            Linh hoạt từ bảo tồn nguyên bản, cách tân thanh lịch đến phong cách dạo phố phá cách hiện đại.
          </p>
        </div>

        <div className="heritage-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#B93826]" />
          <div className="w-10 h-10 rounded-xl bg-[#FBEFEF] text-[#B93826] flex items-center justify-center mb-3.5">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base sm:text-lg font-bold text-[#161A1D] leading-snug">
            Minh Họa Line-art SVG
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-2 leading-relaxed">
            Toàn bộ minh họa vector nội bộ, không dùng ảnh chụp hay ảnh AI, thể hiện đúng từng đặc điểm kết cấu cổ áo và tà áo.
          </p>
        </div>
      </section>

      {/* 3 Trang Phục Tiêu Biểu */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#DED7C6] pb-3">
          <div>
            <h2 className="font-heritage-display text-xl sm:text-2xl font-bold text-[#161A1D]">
              Trang Phục Tiêu Biểu
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5560] mt-0.5">
              Dữ liệu đối chiếu chuẩn từ nguồn tri thức KB-v3
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartRemix()}
            className="min-h-[44px] px-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1E3F5A] hover:text-[#12283A] hover:underline cursor-pointer"
          >
            <span>Tất cả 6 trang phục</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredOutfits.map((outfit, idx) => {
            const sourceDetails = outfit.nguon.map((code) => {
              const info = KB_NGUON[code];
              return {
                code,
                ten: info ? info.ten : code,
                loai: info ? getLoaiNguonLabel(info.loai) : 'Chưa xác định',
                url: info?.url,
              };
            });

            const certaintyLabelText =
              outfit.muc_chac_chan === 'cao'
                ? 'Mức chắc chắn: Cao'
                : outfit.muc_chac_chan === 'trung_binh'
                ? 'Mức chắc chắn: Trung bình'
                : 'Mức chắc chắn: Thấp';

            return (
              <motion.div
                key={outfit.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: shouldReduceMotion ? 0 : idx * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group heritage-card heritage-card-interactive rounded-2xl overflow-hidden flex flex-col hover:border-[#1E3F5A]"
              >
                {/* Vector SVG Frame */}
                <div className="relative p-3 bg-gradient-to-b from-[#FAF8F3] to-[#F2EDE2] border-b border-[#DED7C6]/60">
                  <OutfitVectorIllustration id={outfit.id} size="md" className="border-0 bg-transparent" />
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3
                      title={getOutfitHoverNote(outfit)}
                      className="font-heritage-display text-lg font-bold text-[#161A1D] group-hover:text-[#1E3F5A] transition-colors leading-snug"
                    >
                      {outfit.ten}
                    </h3>
                    <div className="text-xs font-mono text-[#6E5D4B] mt-1 mb-2">
                      {formatNguonText(outfit.thoi_ky)}
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A5560] line-clamp-2 leading-relaxed">
                      {formatNguonText(outfit.bo_phan.than || outfit.boi_canh_su_dung?.[0])}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#DED7C6]/70 flex items-center justify-between gap-2">
                    <GuardianBadge
                      compact
                      certaintyLevel={outfit.muc_chac_chan}
                      label={certaintyLabelText}
                      sources={sourceDetails}
                      warnings={outfit.khong_nen_khi_remix}
                      suggestions={outfit.goi_y_phoi_do}
                    />

                    <button
                      type="button"
                      onClick={() => onStartRemix(outfit.id)}
                      className="min-h-[44px] px-3.5 py-2 bg-[#1E3F5A] hover:bg-[#12283A] active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shrink-0 inline-flex items-center gap-1"
                    >
                      <span>Phối ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Cam Kết Bảo Chứng Văn Hóa */}
      <section className="bg-[#EBF2F7] rounded-3xl p-6 sm:p-8 border border-[#1E3F5A]/25 shadow-2xs">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E3F5A] mb-2">
            <ShieldCheck className="w-4 h-4 text-[#B93826] shrink-0" />
            <span>Cam kết minh bạch học thuật · AI Arena 2026</span>
          </div>
          <h2 className="font-heritage-display text-xl sm:text-2xl font-bold text-[#161A1D] text-balance">
            Sáng Tạo Đương Đại Trên Nền Tảng Di Sản Chuẩn Xác
          </h2>
          <p className="text-xs sm:text-sm text-[#3E4C59] mt-2 leading-relaxed">
            Chúng tôi đảm bảo mọi thông tin về cấu tạo cổ áo, tay áo và thân vải đều trích xuất trung thực từ tư liệu được lưu trữ trong KB-v3; không suy diễn hay tạo lập dữ liệu chưa có kiểm chứng.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 text-xs text-[#1E3F5A] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E6254] shrink-0" />
              Minh bạch từng mã nguồn tư liệu
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E6254] shrink-0" />
              Phân loại 3 mức chắc chắn rõ ràng
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E6254] shrink-0" />
              Nhãn riêng biệt cho gợi ý của ứng dụng
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

