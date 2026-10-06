import React, { useState } from 'react';
import { ShieldCheck, Info, BookOpen, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { KBMucChacChan } from '../types/kb';
import { formatNoSourceText } from './SourceCitationText';

export interface GuardianBadgeProps {
  label?: string; // e.g. "Chưa kiểm tra" or "Mức chắc chắn: Cao"
  certaintyLevel?: KBMucChacChan;
  sources?: Array<{
    code: string;
    ten: string;
    loai: string;
    url?: string;
  }>;
  warnings?: Array<{
    noi_dung?: string;
    loai_quy_tac?: string;
    can_cu?: string;
  } | string>;
  suggestions?: Array<{
    noi_dung: string;
    loai: string;
    nhan: string;
    ghi_chu?: string;
  }>;
  compact?: boolean;
}

export const GuardianBadge: React.FC<GuardianBadgeProps> = ({
  label = 'Chưa kiểm tra',
  certaintyLevel,
  sources = [],
  warnings = [],
  suggestions = [],
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Style resolution based on certaintyLevel or pending status
  const getBadgeStyle = () => {
    if (label === 'Chưa kiểm tra') {
      return {
        title: 'Chưa kiểm tra qua AI',
        desc: 'Đang kết nối dịch vụ đối chiếu bảo chứng tự động.',
        color: 'text-[#6C7A87]',
        bg: 'bg-[#F2EFE9]',
        borderColor: 'border-[#DED7C6]',
        tagBg: 'bg-white text-[#52606D]',
      };
    }
    switch (certaintyLevel) {
      case 'cao':
        return {
          title: 'Mức chắc chắn: Cao',
          desc: 'Có nhiều nguồn tư liệu lịch sử uy tín độc lập đối chiếu.',
          color: 'text-[#1E3F5A]',
          bg: 'bg-[#EBF2F7]',
          borderColor: 'border-[#1E3F5A]/25',
          tagBg: 'bg-white text-[#1E3F5A]',
        };
      case 'trung_binh':
        return {
          title: 'Mức chắc chắn: Trung bình',
          desc: 'Tư liệu còn giả thuyết chưa thống nhất hoặc chỉ dựa trên một nguồn đơn lẻ.',
          color: 'text-[#8B5A2B]',
          bg: 'bg-[#FDF9F0]',
          borderColor: 'border-[#C88E1B]/35',
          tagBg: 'bg-white text-[#8B5A2B]',
        };
      case 'thap':
      default:
        return {
          title: 'Mức chắc chắn: Thấp',
          desc: 'Chưa có đủ nguồn tư liệu xác thực trong các trích đoạn đối chiếu.',
          color: 'text-[#B93826]',
          bg: 'bg-[#FBEFEF]',
          borderColor: 'border-[#B93826]/30',
          tagBg: 'bg-white text-[#B93826]',
        };
    }
  };

  const style = getBadgeStyle();

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-xs text-[#1E3F5A] hover:text-[#12283A] font-medium cursor-pointer transition-colors group text-left"
          title="Xem nguồn tư liệu và quy chuẩn văn hóa"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#B93826] shrink-0" />
          <span className="font-semibold underline underline-offset-2 decoration-[#DED7C6]">
            {label}
          </span>
        </button>

        {showModal && (
          <GuardianDetailModal
            label={label}
            style={style}
            sources={sources}
            warnings={warnings}
            suggestions={suggestions}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className={`rounded-xl border ${style.borderColor} ${style.bg} p-4 text-[#161A1D] transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/90 border border-[#DED7C6] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <ShieldCheck className="w-4 h-4 text-[#B93826]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm tracking-tight text-[#161A1D]">
                {label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border border-[#DED7C6] font-semibold ${style.tagBg}`}>
                {style.title}
              </span>
            </div>
            <p className="text-xs text-[#52606D] mt-0.5 leading-relaxed">
              {style.desc}
            </p>
          </div>
        </div>

        {sources.length > 0 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs font-medium text-[#1E3F5A] hover:text-[#12283A] underline underline-offset-2 shrink-0 cursor-pointer pt-0.5"
          >
            Nguồn tư liệu ({sources.length})
          </button>
        )}
      </div>

      {showModal && (
        <GuardianDetailModal
          label={label}
          style={style}
          sources={sources}
          warnings={warnings}
          suggestions={suggestions}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

interface GuardianDetailModalProps {
  label: string;
  style: {
    title: string;
    desc: string;
    color: string;
    bg: string;
    borderColor: string;
  };
  sources: Array<{
    code: string;
    ten: string;
    loai: string;
    url?: string;
  }>;
  warnings: Array<{
    noi_dung?: string;
    loai_quy_tac?: string;
    can_cu?: string;
  } | string>;
  suggestions: Array<{
    noi_dung: string;
    loai: string;
    nhan: string;
    ghi_chu?: string;
  }>;
  onClose: () => void;
}

const GuardianDetailModal: React.FC<GuardianDetailModalProps> = ({
  label,
  style,
  sources,
  warnings,
  suggestions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F6F0] rounded-2xl border border-[#DED7C6] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl p-5 sm:p-6 text-[#161A1D]">
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base sm:text-lg font-bold">
                Bảo Chứng Văn Hóa & Nguồn Tư Liệu
              </h3>
              <p className="text-xs text-[#6C7A87]">
                Tiêu chuẩn minh bạch dữ liệu AI Arena Vietnam 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#EFECE3] text-[#7A8691] hover:text-[#161A1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certainty level */}
        <div className="bg-white rounded-xl p-4 border border-[#DED7C6] mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A8691]">
              Trạng thái kiểm tra
            </span>
            <span className="font-semibold text-xs text-[#1E3F5A] px-2 py-0.5 rounded bg-[#EBF2F7]">
              {label}
            </span>
          </div>
          <p className="text-xs text-[#52606D] mt-1 leading-relaxed">
            {style.desc}
          </p>
        </div>

        {/* Sources from KB */}
        {sources.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A8691] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Nguồn tư liệu đối chiếu ({sources.length})
            </h4>
            <div className="space-y-2">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 border border-[#DED7C6]/70 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-[#1E3F5A]">[{src.code}]</span>
                    <span className="text-[#7A8691] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D8]">
                      {src.loai}
                    </span>
                  </div>
                  <div className="font-medium text-[#161A1D]">{src.ten}</div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#1E3F5A] hover:underline mt-1 inline-block truncate max-w-full"
                    >
                      {src.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings from khong_nen_khi_remix */}
        {warnings.length > 0 && (
          <div className="mb-4">
            <div className="bg-[#FBEFEF] rounded-xl p-3.5 border border-[#B93826]/20">
              <div className="text-xs font-semibold text-[#B93826] flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Lưu ý khi phối đồ / cách tân
              </div>
              <ul className="text-xs space-y-1.5 text-[#78261A] list-disc list-inside">
                {warnings.map((w, idx) => {
                  const content = typeof w === 'string' ? w : w.noi_dung || '';
                  return <li key={idx} className="leading-snug">{formatNoSourceText(content)}</li>;
                })}
              </ul>
            </div>
          </div>
        )}

        {/* App suggestions disclaimer */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <div className="bg-[#E9F2EE] rounded-xl p-3.5 border border-[#2E6254]/20">
              <div className="text-xs font-semibold text-[#2E6254] flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gợi ý phối đồ
              </div>
              <div className="text-[10px] font-semibold text-[#8B5A2B] bg-[#FDF9F0] px-2 py-0.5 rounded border border-[#C88E1B]/30 inline-block mb-2">
                Gợi ý của app, không phải sự thật lịch sử
              </div>
              <ul className="text-xs space-y-1 text-[#334D43] list-disc list-inside">
                {suggestions.map((s, idx) => (
                  <li key={idx} className="leading-snug">{s.noi_dung}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#DED7C6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1E3F5A] text-white text-xs font-medium rounded-lg hover:bg-[#12283A] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
