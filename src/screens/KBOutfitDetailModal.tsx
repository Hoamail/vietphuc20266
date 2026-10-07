import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, ExternalLink, Sparkles, BookOpen, AlertCircle, Info, Check, Shirt } from 'lucide-react';
import { KBTrangPhuc, KBNguonMap } from '../types/kb';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { SourceCitationText } from '../components/SourceCitationText';

interface KBOutfitDetailModalProps {
  outfit: KBTrangPhuc;
  sourceMap: KBNguonMap;
  onClose: () => void;
  onSelectForRemix: (outfitId: string) => void;
}

export const KBOutfitDetailModal: React.FC<KBOutfitDetailModalProps> = ({
  outfit,
  sourceMap,
  onClose,
  onSelectForRemix,
}) => {
  const [highlightedSourceCode, setHighlightedSourceCode] = useState<string | null>(null);

  const getCertaintyBadge = (level: string) => {
    switch (level) {
      case 'cao':
        return {
          label: 'Mức chắc chắn: Cao',
          bg: 'bg-[#EBF2F7]',
          text: 'text-[#1E3F5A]',
          border: 'border-[#1E3F5A]/30',
          desc: 'Có nhiều nguồn tư liệu lịch sử uy tín độc lập đối chiếu.',
        };
      case 'trung_binh':
        return {
          label: 'Mức chắc chắn: Trung bình',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#7C4D1B]',
          border: 'border-[#C88E1B]/40',
          desc: 'Tư liệu còn giả thuyết chưa thống nhất hoặc chỉ dựa trên một nguồn duy nhất.',
        };
      case 'thap':
      default:
        return {
          label: 'Mức chắc chắn: Thấp',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#8E2516]',
          border: 'border-[#B93826]/35',
          desc: 'Chưa có đủ nguồn tư liệu xác thực.',
        };
    }
  };

  const getGroupBadge = (group: string) => {
    switch (group) {
      case 'co_phuc':
        return { label: 'Cổ phục', color: 'bg-[#EBF2F7] text-[#1E3F5A] border border-[#1E3F5A]/25' };
      case 'dan_gian':
        return { label: 'Dân gian', color: 'bg-[#FDF9F0] text-[#7C4D1B] border border-[#C88E1B]/35' };
      case 'hien_dai_cach_tan':
        return { label: 'Hiện đại cách tân', color: 'bg-[#FBEFEF] text-[#8E2516] border border-[#B93826]/30' };
      default:
        return { label: group, color: 'bg-[#F8F6F0] text-[#4A5560] border border-[#DED7C6]' };
    }
  };

  const certainty = getCertaintyBadge(outfit.muc_chac_chan);
  const group = getGroupBadge(outfit.nhom);

  const formatSourceType = (type: string) => {
    switch (type) {
      case 'bao_chi_nha_nuoc':
        return 'Báo chí nhà nước';
      case 'bao_chi':
        return 'Báo chí';
      case 'tap_chi_hoc_thuat':
        return 'Tạp chí học thuật';
      case 'tap_chi_van_hoa_doc_lap':
        return 'Tạp chí văn hóa độc lập';
      case 'tap_chi':
        return 'Tạp chí';
      case 'co_quan_nghien_cuu':
        return 'Cơ quan nghiên cứu';
      case 'thuong_mai':
        return 'Đơn vị thương mại';
      case 'tai_lieu_hoc_sinh':
        return 'Tài liệu học tập';
      case 'blog':
        return 'Blog văn hóa';
      case 'chua_xac_dinh':
      default:
        return 'Chưa xác định';
    }
  };

  const handleSelectChipSource = (code: string) => {
    setHighlightedSourceCode(code);
    const element = document.getElementById(`source-item-${code}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#F8F6F0] rounded-2xl sm:rounded-3xl border border-[#DED7C6] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#161A1D]"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#DED7C6] bg-white/90 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#FAF8F3] border border-[#DED7C6] hover:border-[#1E3F5A] text-[#4A5560] hover:text-[#161A1D] flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Đóng trang chi tiết"
              aria-label="Đóng trang chi tiết"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heritage-display text-lg sm:text-xl font-bold leading-tight">
                  {outfit.ten}
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${group.color}`}>
                  {group.label}
                </span>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold border ${certainty.bg} ${certainty.text} ${certainty.border}`}>
                  {certainty.label}
                </span>
              </div>
              <div className="text-xs text-[#4A5560] mt-1">
                Thời kỳ: <SourceCitationText text={outfit.thoi_ky} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-1 -mt-1 rounded-xl hover:bg-[#EFECE3] text-[#4A5560] hover:text-[#161A1D] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Neutral SVG Vector Illustration Frame */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DED7C6] shadow-2xs">
            <div className="text-xs text-[#4A5560] font-semibold uppercase tracking-wider mb-2.5 flex items-center justify-between flex-wrap gap-2">
              <span>Minh họa cấu trúc trang phục</span>
            </div>
            <OutfitVectorIllustration id={outfit.id} size="lg" />
          </div>

          {/* 1. Bộ phận cấu tạo (bo_phan) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3.5">
            <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#1E3F5A] flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#1E3F5A]" />
              <span>1. Bộ Phận Cấu Tạo Trang Phục</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6]">
                <div className="font-bold text-[#1E3F5A] mb-1">Cổ áo:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.co || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6]">
                <div className="font-bold text-[#1E3F5A] mb-1">Tay áo:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.tay || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6] sm:col-span-2">
                <div className="font-bold text-[#1E3F5A] mb-1">Thân áo & Vạt cúc:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.than || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6] sm:col-span-2">
                <div className="font-bold text-[#1E3F5A] mb-1">Vật liệu vải truyền thống:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.vat_lieu || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Đặc điểm nhận diện hình ảnh (dac_diem_nhan_dien_hinh_anh) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3.5">
            <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#1E3F5A] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E6254]" />
              <span>2. Đặc Điểm Nhận Diện Hình Ảnh</span>
            </h3>

            {outfit.dac_diem_nhan_dien_hinh_anh.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {outfit.dac_diem_nhan_dien_hinh_anh.map((item, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] text-[#4A5560] leading-relaxed flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3F5A] mt-1.5 shrink-0" />
                    <div>
                      <SourceCitationText text={item} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#4A5560] italic">Chưa có nguồn</p>
            )}
          </section>

          {/* 3. Tránh nhầm lẫn (tranh_nham_voi) nếu có */}
          {outfit.tranh_nham_voi && outfit.tranh_nham_voi.length > 0 && (
            <section className="bg-[#FBEFEF] rounded-2xl p-5 border border-[#B93826]/35 space-y-2.5">
              <h3 className="font-heritage-display text-sm sm:text-base font-bold text-[#8E2516] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B93826]" />
                <span>Tránh Nhầm Lẫn Với Các Trang Phục Khác</span>
              </h3>
              <div className="space-y-2 text-xs">
                {outfit.tranh_nham_voi.map((item, idx) => (
                  <div key={idx} className="bg-white/90 rounded-xl p-3.5 border border-[#B93826]/25">
                    <div className="font-bold text-[#8E2516]">{item.ten}</div>
                    {item.diem_khac_biet && (
                      <div className="text-[#4A5560] mt-1 leading-relaxed">
                        <SourceCitationText text={item.diem_khac_biet} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Gợi ý phối đồ (goi_y_phoi_do) */}
          {/* REQUIREMENT: Phần goi_y_phoi_do luôn có nhãn "Gợi ý của app, không phải sự thật lịch sử" */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#1E3F5A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C88E1B]" />
                <span>3. Gợi Ý Phối Đồ Hiện Đại (Styling Remix)</span>
              </h3>
              <span className="text-xs font-semibold text-[#8E2516] bg-[#FBEFEF] px-2.5 py-0.5 rounded-full border border-[#B93826]/30">
                Gợi ý của app, không phải sự thật lịch sử
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {outfit.goi_y_phoi_do.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6] space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-[#1E3F5A]">
                      {item.loai === 'boi_canh' && 'Bối cảnh xuất hiện'}
                      {item.loai === 'phu_kien' && 'Phụ kiện phối kèm'}
                      {item.loai === 'phoi_hien_dai' && 'Phong cách dạo phố / Hiện đại'}
                      {!['boi_canh', 'phu_kien', 'phoi_hien_dai'].includes(item.loai) && item.loai}
                    </span>
                    <span className="text-xs text-[#7C4D1B] font-semibold bg-[#FDF9F0] px-2 py-0.5 rounded-md border border-[#C88E1B]/30">
                      Gợi ý của app, không phải sự thật lịch sử
                    </span>
                  </div>
                  <p className="text-[#4A5560] leading-relaxed">
                    {item.noi_dung}
                  </p>
                  {item.ghi_chu && (
                    <div className="text-xs text-[#4A5560] italic pt-1 border-t border-[#DED7C6]/60">
                      Ghi chú: {item.ghi_chu}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 5. Danh sách nguồn tham chiếu (nguon) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3.5">
            <h3 className="font-heritage-display text-base sm:text-lg font-bold text-[#1E3F5A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E3F5A]" />
              <span>4. Danh Sách Nguồn Tham Chiếu ({outfit.nguon.length})</span>
            </h3>
            <p className="text-xs text-[#4A5560]">
              Trích xuất từ danh bạ nguồn tri thức lịch sử đã được kiểm định. Bấm vào mã nguồn để tra cứu:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {outfit.nguon.map((code) => {
                const src = sourceMap[code];
                const isHighlighted = highlightedSourceCode === code;
                if (!src) {
                  return (
                    <div key={code} className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#DED7C6]">
                      <span className="font-mono font-bold text-[#1E3F5A]">[{code}]</span>
                      <span className="text-[#4A5560] ml-2">Chưa có nguồn</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={code}
                    id={`source-item-${code}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHighlighted
                        ? 'border-[#1E3F5A] ring-2 ring-[#1E3F5A]/30 bg-[#EBF2F7]'
                        : 'border-[#DED7C6] bg-[#FAF8F3] hover:border-[#1E3F5A]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#1E3F5A] bg-white px-2 py-0.5 rounded-md border border-[#DED7C6]">
                        [{code}]
                      </span>
                      <span className="text-xs text-[#4A5560] font-semibold">
                        {formatSourceType(src.loai)}
                      </span>
                    </div>

                    <div className="font-semibold text-[#161A1D] mt-1 leading-snug">
                      {src.ten}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#DED7C6]/60 flex items-center justify-between">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs text-[#1E3F5A] hover:underline font-semibold"
                      >
                        <span>Mở liên kết nguồn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 6. Ghi chú cần kiểm chứng nếu có */}
          {outfit.ghi_chu_can_kiem_chung && (
            <div className="p-4 bg-[#FDF9F0] rounded-2xl border border-[#C88E1B]/40 text-xs">
              <div className="font-bold text-[#7C4D1B] flex items-center gap-1.5 mb-1">
                <Info className="w-4 h-4 text-[#C88E1B]" />
                <span>Ghi chú cần kiểm chứng & Tính trung thực dữ liệu</span>
              </div>
              <p className="text-[#5A4630] leading-relaxed">
                {outfit.ghi_chu_can_kiem_chung}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 border-t border-[#DED7C6] bg-white/95 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 border border-[#DED7C6] text-xs font-semibold text-[#4A5560] hover:text-[#161A1D] rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectForRemix(outfit.id);
              onClose();
            }}
            className="min-h-[44px] px-5 py-2.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>Chọn trang phục này để Phối đồ</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
