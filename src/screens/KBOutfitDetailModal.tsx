import React, { useState } from 'react';
import { X, ArrowLeft, ExternalLink, ShieldCheck, Sparkles, BookOpen, AlertCircle, Info, Check, Shirt } from 'lucide-react';
import { KBTrangPhuc, KBNguonMap, KBNguonItem } from '../types/kb';
import { getOutfitHoverNote } from '../data/kb';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { SourceCitationText, formatNoSourceText } from '../components/SourceCitationText';

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
          border: 'border-[#1E3F5A]/25',
          desc: 'Có nhiều nguồn tư liệu lịch sử uy tín độc lập đối chiếu.',
        };
      case 'trung_binh':
        return {
          label: 'Mức chắc chắn: Trung bình',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#C88E1B]',
          border: 'border-[#C88E1B]/35',
          desc: 'Tư liệu còn giả thuyết chưa thống nhất hoặc chỉ dựa trên một nguồn duy nhất.',
        };
      case 'thap':
      default:
        return {
          label: 'Mức chắc chắn: Thấp',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#B93826]',
          border: 'border-[#B93826]/30',
          desc: 'Chưa có đủ nguồn tư liệu xác thực.',
        };
    }
  };

  const getGroupBadge = (group: string) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F6F0] rounded-2xl sm:rounded-3xl border border-[#DED7C6] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#161A1D]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#DED7C6] bg-white/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#EFECE3] text-[#52606D] hover:text-[#161A1D] cursor-pointer transition-colors"
              title="Đóng trang chi tiết"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  title={getOutfitHoverNote(outfit)}
                  className="relative group/modalname font-heritage-display text-lg sm:text-xl font-bold leading-tight inline-flex items-center gap-1"
                >
                  <span className={getOutfitHoverNote(outfit) ? 'underline decoration-dotted decoration-[#8E7E6B] underline-offset-4' : ''}>
                    {outfit.ten}
                  </span>
                  {getOutfitHoverNote(outfit) && (
                    <span className="pointer-events-none opacity-0 group-hover/modalname:opacity-100 transition-opacity absolute left-0 -bottom-7 z-30 whitespace-nowrap rounded-md bg-[#161A1D] px-2 py-0.5 font-sans text-[11px] font-medium text-white shadow-md">
                      {getOutfitHoverNote(outfit)}
                    </span>
                  )}
                </h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${group.color}`}>
                  {group.label}
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold border ${certainty.bg} ${certainty.text} ${certainty.border}`}>
                  {certainty.label}
                </span>
              </div>
              <div className="text-xs text-[#6C7A87] mt-0.5">
                Thời kỳ: <SourceCitationText text={outfit.thoi_ky} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#EFECE3] text-[#7A8691] hover:text-[#161A1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Neutral SVG Vector Illustration Frame */}
          <div className="bg-white rounded-2xl p-4 border border-[#DED7C6] shadow-2xs">
            <div className="text-xs text-[#7A8691] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Minh họa cấu trúc kỹ thuật (Line-art SVG trung tính không bản quyền)</span>
              <span className="text-[11px] font-mono text-[#1E3F5A]">Chuẩn hóa KB-v3</span>
            </div>
            <OutfitVectorIllustration id={outfit.id} size="lg" />
          </div>

          {/* 1. Bộ phận cấu tạo (bo_phan) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3">
            <h3 className="font-heritage-display text-base font-bold text-[#1E3F5A] flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#1E3F5A]" />
              <span>1. Bộ Phận Cấu Tạo Trang Phục</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6]">
                <div className="font-bold text-[#1E3F5A] mb-1">Cổ áo:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.co || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6]">
                <div className="font-bold text-[#1E3F5A] mb-1">Tay áo:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.tay || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6] sm:col-span-2">
                <div className="font-bold text-[#1E3F5A] mb-1">Thân áo & Vạt cúc:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.than || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>

              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6] sm:col-span-2">
                <div className="font-bold text-[#1E3F5A] mb-1">Vật liệu vải truyền thống:</div>
                <div className="text-[#4A5560] leading-relaxed">
                  <SourceCitationText text={outfit.bo_phan?.vat_lieu || ''} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Đặc điểm nhận diện hình ảnh (dac_diem_nhan_dien_hinh_anh) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3">
            <h3 className="font-heritage-display text-base font-bold text-[#1E3F5A] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E6254]" />
              <span>2. Đặc Điểm Nhận Diện Hình Ảnh</span>
            </h3>

            {outfit.dac_diem_nhan_dien_hinh_anh.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {outfit.dac_diem_nhan_dien_hinh_anh.map((item, idx) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-[#F8F6F0] border border-[#DED7C6]/70 text-[#4A5560] leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3F5A] mt-1.5 shrink-0" />
                    <div>
                      <SourceCitationText text={item} sourceMap={sourceMap} onSelectSource={handleSelectChipSource} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#8E7E6B] italic">Chưa có nguồn</p>
            )}
          </section>

          {/* 3. Tránh nhầm lẫn (tranh_nham_voi) nếu có */}
          {outfit.tranh_nham_voi && outfit.tranh_nham_voi.length > 0 && (
            <section className="bg-[#FBEFEF] rounded-2xl p-5 border border-[#B93826]/30 space-y-2">
              <h3 className="font-heritage-display text-sm font-bold text-[#B93826] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Tránh Nhầm Lẫn Với Các Trang Phục Khác</span>
              </h3>
              <div className="space-y-2 text-xs">
                {outfit.tranh_nham_voi.map((item, idx) => (
                  <div key={idx} className="bg-white/80 rounded-xl p-3 border border-[#B93826]/20">
                    <div className="font-semibold text-[#8E2516]">{item.ten}</div>
                    {item.diem_khac_biet && (
                      <div className="text-[#52606D] mt-1">
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
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-heritage-display text-base font-bold text-[#1E3F5A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C88E1B]" />
                <span>3. Gợi Ý Phối Đồ Hiện Đại (Styling Remix)</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#B93826] bg-[#FBEFEF] px-2 py-0.5 rounded-full border border-[#B93826]/25">
                Gợi ý của app, không phải sự thật lịch sử
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {outfit.goi_y_phoi_do.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1E3F5A]">
                      {item.loai === 'boi_canh' && 'Bối cảnh xuất hiện'}
                      {item.loai === 'phu_kien' && 'Phụ kiện phối kèm'}
                      {item.loai === 'phoi_hien_dai' && 'Phong cách dạo phố / Hiện đại'}
                      {!['boi_canh', 'phu_kien', 'phoi_hien_dai'].includes(item.loai) && item.loai}
                    </span>
                    <span className="text-[10px] text-[#B93826] font-medium">
                      Gợi ý của app, không phải sự thật lịch sử
                    </span>
                  </div>
                  <p className="text-[#4A5560] leading-relaxed">
                    {item.noi_dung}
                  </p>
                  {item.ghi_chu && (
                    <div className="text-[11px] text-[#6C7A87] italic pt-1 border-t border-[#DED7C6]/40">
                      Ghi chú: {item.ghi_chu}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 5. Danh sách nguồn tham chiếu (nguon) */}
          <section className="bg-white rounded-2xl p-5 border border-[#DED7C6] shadow-2xs space-y-3">
            <h3 className="font-heritage-display text-base font-bold text-[#1E3F5A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E3F5A]" />
              <span>4. Danh Sách Nguồn Tham Chiếu ({outfit.nguon.length})</span>
            </h3>
            <p className="text-xs text-[#6C7A87]">
              Trích xuất từ danh bạ nguồn tri thức lịch sử đã được kiểm định. Bấm vào mã nguồn để tra cứu:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {outfit.nguon.map((code) => {
                const src = sourceMap[code];
                const isHighlighted = highlightedSourceCode === code;
                if (!src) {
                  return (
                    <div key={code} className="p-3 bg-[#F8F6F0] rounded-xl border border-[#DED7C6]">
                      <span className="font-mono font-bold text-[#1E3F5A]">[{code}]</span>
                      <span className="text-[#7A8691] ml-2">Chưa có nguồn</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={code}
                    id={`source-item-${code}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHighlighted
                        ? 'border-[#1E3F5A] ring-2 ring-[#1E3F5A]/25 bg-[#EBF2F7]'
                        : 'border-[#DED7C6] bg-[#F8F6F0] hover:border-[#1E3F5A]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-[#1E3F5A] bg-white px-1.5 py-0.5 rounded border border-[#DED7C6]">
                        [{code}]
                      </span>
                      <span className="text-[11px] text-[#7A8691] font-medium">
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
                        className="inline-flex items-center gap-1 text-[11px] text-[#1E3F5A] hover:underline font-medium"
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
            <div className="p-4 bg-[#FDF9F0] rounded-2xl border border-[#C88E1B]/30 text-xs">
              <div className="font-bold text-[#8E5E15] flex items-center gap-1.5 mb-1">
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
        <div className="p-4 border-t border-[#DED7C6] bg-white/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#DED7C6] text-xs font-medium rounded-xl hover:bg-[#EFECE3] transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            onClick={() => {
              onSelectForRemix(outfit.id);
              onClose();
            }}
            className="px-5 py-2.5 bg-[#1E3F5A] hover:bg-[#12283A] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>Chọn trang phục này để Phối đồ</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
