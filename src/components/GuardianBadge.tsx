import React, { useState } from 'react';
import {
  ShieldCheck,
  Info,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { KBMucChacChan } from '../types/kb';
import { OptionGuardianState, GuardianLoaiLyDo } from '../types/vietphuc';
import { KB_NGUON, getLoaiNguonLabel, BOI_CANH } from '../data/kb';
import { formatNoSourceText } from './SourceCitationText';

export function getGuardianLoaiLyDoLabel(loai?: GuardianLoaiLyDo | string): string {
  switch (loai) {
    case 'lich_su':
      return 'Lịch sử';
    case 'thong_le':
      return 'Thông lệ, không phải quy định';
    case 'tham_my':
      return 'Gợi ý thẩm mỹ';
    case 'chua_du_can_cu':
      return 'Chưa đủ căn cứ';
    case 'nguyen_tac_app':
      return 'Nguyên tắc của app';
    default:
      return 'Thông lệ, không phải quy định';
  }
}

export function getGuardianCertaintyLabel(muc?: KBMucChacChan | string): string {
  switch (muc) {
    case 'cao':
      return 'Cao';
    case 'trung_binh':
      return 'Trung bình';
    case 'thap':
    default:
      return 'Thấp';
  }
}

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
  evaluation?: OptionGuardianState;
  onRetry?: () => void;
}

export const GuardianBadge: React.FC<GuardianBadgeProps> = ({
  label = 'Chưa kiểm tra',
  certaintyLevel,
  sources = [],
  warnings = [],
  suggestions = [],
  compact = false,
  evaluation,
  onRetry,
}) => {
  const [showModal, setShowModal] = useState(false);

  // If this is an Option Guardian evaluation badge
  if (evaluation) {
    const { status, result } = evaluation;

    if (status === 'loading') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F2] text-[#6C7A87] border border-[#DED7C6]"
          title="Đang gửi thẩm định Cultural Guardian"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C88E1B] shrink-0" />
          <span>Đang kiểm tra</span>
        </span>
      );
    }

    if (status === 'error' || !result) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FBEFEF] text-[#B93826] border border-[#B93826]/30 hover:bg-[#F6DFDF] cursor-pointer transition-colors"
            title="Bấm để xem chi tiết hoặc thử lại"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Chưa kiểm tra được</span>
          </button>

          {showModal && (
            <OptionGuardianErrorModal
              onRetry={onRetry}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      );
    }

    // Status is 'success' with result
    let badgeText = 'Cần lưu ý';
    let badgeStyle = {
      bg: 'bg-[#FDF9F0]',
      text: 'text-[#8B5A2B]',
      border: 'border-[#C88E1B]/35',
      hover: 'hover:bg-[#F9F2E0]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#C88E1B] shrink-0" />,
    };

    if (result.danh_gia === 'hai_hoa') {
      badgeText = 'Hài hoà';
      badgeStyle = {
        bg: 'bg-[#E9F2EE]',
        text: 'text-[#2E6254]',
        border: 'border-[#2E6254]/30',
        hover: 'hover:bg-[#D9EAE2]',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-[#2E6254] shrink-0" />,
      };
    } else if (result.danh_gia === 'de_sai_lech') {
      badgeText = 'Dễ sai lệch văn hoá';
      badgeStyle = {
        bg: 'bg-[#FBEFEF]',
        text: 'text-[#B93826]',
        border: 'border-[#B93826]/30',
        hover: 'hover:bg-[#F6DFDF]',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[#B93826] shrink-0" />,
      };
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border} ${badgeStyle.hover} cursor-pointer transition-colors shadow-2xs`}
          title="Bấm để xem chi tiết bảo chứng Cultural Guardian"
        >
          {badgeStyle.icon}
          <span>{badgeText}</span>
        </button>

        {showModal && (
          <OptionGuardianDetailModal
            result={result}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Fallback: Default outfit-level badge
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

// Modal for Option Guardian Evaluation Details
interface OptionGuardianDetailModalProps {
  result: NonNullable<OptionGuardianState['result']>;
  onClose: () => void;
}

const OptionGuardianDetailModal: React.FC<OptionGuardianDetailModalProps> = ({
  result,
  onClose,
}) => {
  const getDanhGiaBadge = () => {
    switch (result.danh_gia) {
      case 'hai_hoa':
        return {
          label: 'Hài hoà',
          bg: 'bg-[#E9F2EE]',
          text: 'text-[#2E6254]',
          border: 'border-[#2E6254]/30',
          desc: 'Phương án phối đồ tôn trọng cấu trúc cốt lõi của trang phục và phù hợp với tinh thần bối cảnh.',
        };
      case 'can_luu_y':
        return {
          label: 'Cần lưu ý',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#8B5A2B]',
          border: 'border-[#C88E1B]/35',
          desc: 'Có điểm cần lưu ý về điều kiện di chuyển, không gian hoặc thông lệ ứng xử.',
        };
      case 'de_sai_lech':
      default:
        return {
          label: 'Dễ sai lệch văn hoá',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#B93826]',
          border: 'border-[#B93826]/30',
          desc: 'Bản phối có nguy cơ vi phạm điều kỵ hoặc làm sai lệch kết cấu nhận diện cốt lõi của trang phục.',
        };
    }
  };

  const badge = getDanhGiaBadge();

  const renderSourceContent = (maNguon: string | null) => {
    if (!maNguon) {
      return <span className="text-[#7A8691] italic">Chưa có nguồn</span>;
    }

    const kbSrc = KB_NGUON[maNguon];
    if (kbSrc) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded border border-[#1E3F5A]/20">
            [{maNguon}]
          </span>
          <span className="font-medium text-[#161A1D]">{kbSrc.ten}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#DED7C6] text-[#52606D] font-semibold">
            {getLoaiNguonLabel(kbSrc.loai)}
          </span>
          {kbSrc.url && (
            <a
              href={kbSrc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E3F5A] hover:underline inline-flex items-center gap-0.5"
            >
              <span>Xem tư liệu</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          )}
        </div>
      );
    }

    const bcMatch = /^BC-([a-z0-9_]+)-(\d+)$/i.exec(maNguon);
    if (bcMatch) {
      const bcId = bcMatch[1];
      const oneBasedIdx = parseInt(bcMatch[2], 10);
      const targetBc = BOI_CANH.find((b) => b.id === bcId);
      const url =
        targetBc && Array.isArray(targetBc.nguon) && oneBasedIdx >= 1 && oneBasedIdx <= targetBc.nguon.length
          ? targetBc.nguon[oneBasedIdx - 1]
          : undefined;

      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-1.5 py-0.5 rounded border border-[#1E3F5A]/20">
            [{maNguon}]
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FDF9F0] border border-[#C88E1B]/30 text-[#8B5A2B] font-semibold">
            Thông lệ bối cảnh
          </span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E3F5A] hover:underline inline-flex items-center gap-0.5 break-all"
            >
              <span>{url}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          ) : (
            <span className="text-[#161A1D]">Bối cảnh {targetBc?.ten || bcId}</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="font-mono font-bold text-[#1E3F5A]">[{maNguon}]</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F6F0] rounded-2xl border border-[#DED7C6] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl p-5 sm:p-6 text-[#161A1D]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base sm:text-lg font-bold">
                Bảo Chứng Văn Hóa (Cultural Guardian)
              </h3>
              <p className="text-xs text-[#6C7A87]">
                Thẩm định tính hài hoà và chuẩn mực văn hoá cho phương án phối đồ
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

        {/* Status & Certainty Banner */}
        <div className={`p-4 rounded-xl border ${badge.border} ${badge.bg} mb-4`}>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border bg-white ${badge.border} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-[#DED7C6] text-[#1E3F5A]">
                Mức chắc chắn: {getGuardianCertaintyLabel(result.muc_chac_chan)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#4A5560] leading-relaxed mt-1">
            {badge.desc}
          </p>
        </div>

        {/* Color Harmony Score (only if not null) */}
        {result.diem_hai_hoa_mau !== null && (
          <div className="p-3 rounded-xl bg-white border border-[#DED7C6] mb-3 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E3F5A]">Điểm hài hoà màu:</span>
              <span className="font-mono font-bold text-sm text-[#C88E1B] bg-[#FDF9F0] px-2 py-0.5 rounded border border-[#C88E1B]/30">
                {result.diem_hai_hoa_mau}/10
              </span>
            </div>
            <span className="text-[11px] text-[#7A8691] italic">
              điểm hài hoà màu mang tính tham khảo
            </span>
          </div>
        )}

        {/* Reason (ly_do) with Type Tag */}
        <div className="p-3.5 rounded-xl bg-white border border-[#DED7C6] mb-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-[#1E3F5A]">Lý do thẩm định:</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#DED7C6] text-[#6C7A87]">
              {getGuardianLoaiLyDoLabel(result.loai_ly_do)}
            </span>
          </div>
          <p className="text-[#3E4A56] leading-relaxed">
            {result.ly_do}
          </p>
        </div>

        {/* Source citation */}
        <div className="p-3 rounded-xl bg-white border border-[#DED7C6] mb-3 text-xs">
          <span className="font-bold text-[#1E3F5A] block">Nguồn đối chiếu:</span>
          {renderSourceContent(result.ma_nguon)}
        </div>

        {/* Suggested adjustment (goi_y_sua) */}
        {result.goi_y_sua && (
          <div className="p-3 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/30 mb-4 text-xs space-y-1">
            <div className="font-bold text-[#8B5A2B]">Gợi ý điều chỉnh:</div>
            <p className="text-[#5A4630] leading-relaxed">
              {result.goi_y_sua}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#DED7C6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1E3F5A] text-white text-xs font-semibold rounded-lg hover:bg-[#12283A] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Error Modal for Option Guardian
interface OptionGuardianErrorModalProps {
  onRetry?: () => void;
  onClose: () => void;
}

const OptionGuardianErrorModal: React.FC<OptionGuardianErrorModalProps> = ({
  onRetry,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F6F0] rounded-2xl border border-[#DED7C6] max-w-md w-full shadow-xl p-5 sm:p-6 text-[#161A1D]">
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base font-bold text-[#8E2516]">
                Chưa kiểm tra được
              </h3>
              <p className="text-xs text-[#6C7A87]">
                Dịch vụ bảo chứng Cultural Guardian
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

        <div className="p-3.5 rounded-xl bg-white border border-[#DED7C6] text-xs space-y-2 mb-4 text-[#4A5560]">
          <p>
            Hệ thống chưa thể hoàn thành đối chiếu bảo chứng văn hoá tự động cho phương án này vào lúc này.
          </p>
          <p className="text-[11px] text-[#7A8691]">
            Vui lòng kiểm tra lại kết nối mạng hoặc thử lại. Các thông tin trích dẫn lịch sử từ KB-v3 vẫn giữ nguyên giá trị.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DED7C6]">
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-3.5 py-1.5 bg-[#B93826] text-white text-xs font-semibold rounded-lg hover:bg-[#8E2516] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#DED7C6] text-[#4A5560] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal for Outfit-level Guardian details
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
