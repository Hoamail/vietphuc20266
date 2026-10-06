import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, BookOpen, Layers, CheckCircle2, Camera } from 'lucide-react';
import { getTrangPhucById, KB_NGUON, getLoaiNguonLabel, formatNguonText } from '../data/kb';
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
  // 3 thẻ nổi bật theo yêu cầu: ao_ngu_than_tay_chen, ao_tac, ao_giao_linh
  const featuredIds = ['ao_ngu_than_tay_chen', 'ao_tac', 'ao_giao_linh'];
  const featuredOutfits = featuredIds
    .map((id) => getTrangPhucById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getTrangPhucById>>[];

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Hero Section với nền hoa văn SVG tự vẽ */}
      <section className="relative overflow-hidden rounded-3xl border border-[#DED7C6] bg-[#1E3F5A] text-white shadow-sm p-6 sm:p-10">
        {/* Nền họa tiết hoa sen & kỷ hà SVG tự vẽ */}
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heritage-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 3" />
                <path d="M30 12 L30 48 M12 30 L48 30" stroke="#FFFFFF" strokeWidth="0.8" />
                <circle cx="30" cy="30" r="4" fill="#FFFFFF" fillOpacity="0.4" />
                <path d="M0 0 L15 15 M60 0 L45 15 M0 60 L15 45 M60 60 L45 45" stroke="#FFFFFF" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heritage-pattern)" />
          </svg>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#2C5373] opacity-40 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-[#DED7C6] mb-2 font-medium tracking-wide">
            <span>AI Arena Vietnam 2026</span>
            <span aria-hidden="true">·</span>
            <span>Kho tri thức di sản KB-v3</span>
          </div>

          <h1 className="font-heritage-display text-2xl sm:text-4xl font-bold tracking-tight text-white text-balance leading-tight">
            Khám Phá & Phối Việt Phục Theo Hơi Thở Đương Đại
          </h1>

          <p className="text-xs sm:text-sm text-[#EFECE3] mt-3 max-w-xl leading-relaxed">
            Giải pháp sáng tạo giúp học sinh, sinh viên khám phá các dạng thức trang phục truyền thống Việt Nam theo bối cảnh sống động — minh bạch nguồn gốc tư liệu và mức chắc chắn.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-1">
            <button
              type="button"
              onClick={() => onStartRemix()}
              className="px-5 py-2.5 bg-[#B93826] hover:bg-[#8E2516] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>Bắt đầu phối đồ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCompare}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer border border-white/20"
            >
              Ma trận so sánh
            </button>

            {onOpenImageGuardian && (
              <button
                type="button"
                onClick={onOpenImageGuardian}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer border border-white/20 flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Kiểm tra ảnh (Vision)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3 Trụ Cột Giá Trị Cốt Lõi */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#EBF2F7] text-[#1E3F5A] flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base font-bold text-[#161A1D]">
            Minh bạch nguồn gốc tư liệu và mức chắc chắn
          </h2>
          <p className="text-xs text-[#52606D] mt-1.5 leading-relaxed">
            Trung thực về mức độ chắc chắn tư liệu lịch sử (cao / trung bình / thấp). Trích dẫn rõ ràng nguồn gốc báo chí, tạp chí và khảo cứu.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#E9F2EE] text-[#2E6254] flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base font-bold text-[#161A1D]">
            3 Cấp Độ Cách Tân Gen Z
          </h2>
          <p className="text-xs text-[#52606D] mt-1.5 leading-relaxed">
            Linh hoạt từ bảo tồn nguyên bản, cách tân thanh lịch đến phong cách dạo phố phá cách hiện đại.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#FBEFEF] text-[#B93826] flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="font-heritage-display text-base font-bold text-[#161A1D]">
            Minh Họa Line-art SVG
          </h2>
          <p className="text-xs text-[#52606D] mt-1.5 leading-relaxed">
            Toàn bộ minh họa vector nội bộ, không dùng ảnh chụp hay ảnh AI, thể hiện đúng từng đặc điểm kết cấu cổ áo và tà áo.
          </p>
        </div>
      </section>

      {/* 3 Trang Phục Tiêu Biểu */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heritage-display text-xl sm:text-2xl font-bold text-[#161A1D]">
              Trang Phục Tiêu Biểu
            </h2>
            <p className="text-xs text-[#6C7A87] mt-0.5">
              Dữ liệu đối chiếu chuẩn từ nguồn tri thức KB-v3
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartRemix()}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#1E3F5A] hover:underline cursor-pointer"
          >
            <span>Tất cả 6 trang phục</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredOutfits.map((outfit) => {
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
              <div
                key={outfit.id}
                className="group bg-white rounded-2xl border border-[#DED7C6] overflow-hidden flex flex-col hover:border-[#1E3F5A] hover:shadow-md transition-all"
              >
                {/* Vector SVG Frame */}
                <div className="relative p-2 bg-[#FAF8F5]">
                  <OutfitVectorIllustration id={outfit.id} size="md" className="border-0 bg-transparent" />
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-heritage-display text-base font-bold text-[#161A1D] leading-tight">
                      {outfit.ten}
                    </h3>
                    <div className="text-[11px] font-mono text-[#8E7E6B] mt-0.5 mb-1.5">
                      {formatNguonText(outfit.thoi_ky)}
                    </div>
                    <p className="text-xs text-[#52606D] line-clamp-2 leading-relaxed">
                      {formatNguonText(outfit.bo_phan.than || outfit.boi_canh_su_dung?.[0])}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#DED7C6]/60 flex items-center justify-between">
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
                      className="px-3 py-1.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Phối ngay
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cam Kết Bảo Chứng Văn Hóa */}
      <section className="bg-[#EBF2F7] rounded-3xl p-6 sm:p-8 border border-[#1E3F5A]/20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E3F5A] mb-2">
            <ShieldCheck className="w-4 h-4 text-[#B93826]" />
            Cam kết minh bạch học thuật · AI Arena 2026
          </div>
          <h2 className="font-heritage-display text-xl sm:text-2xl font-bold text-[#161A1D]">
            Sáng Tạo Đương Đại Trên Nền Tảng Di Sản Chuẩn Xác
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5560] mt-2 leading-relaxed">
            Chúng tôi đảm bảo mọi thông tin về cấu tạo cổ áo, tay áo và thân vải đều trích xuất trung thực từ tư liệu được lưu trữ trong KB-v3; không suy diễn hay tạo lập dữ liệu chưa có kiểm chứng.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#1E3F5A] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6254]" />
              Minh bạch từng mã nguồn tư liệu
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6254]" />
              Phân loại 3 mức chắc chắn rõ ràng
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6254]" />
              Nhãn riêng biệt cho gợi ý của ứng dụng
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
