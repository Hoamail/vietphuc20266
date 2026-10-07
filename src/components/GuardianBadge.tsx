import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
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
import { isInsufficientBasisResult } from '../utils/guardianRules';

export function getGuardianLoaiLyDoLabel(loai?: GuardianLoaiLyDo | string): string {
  switch (loai) {
    case 'lich_su':
      return 'Tư liệu';
    case 'thong_le_ung_xu':
      return 'Thông lệ, không phải quy định';
    case 'tham_my':
      return 'Gợi ý thẩm mỹ';
    case 'thieu_can_cu':
      return 'Chưa đủ căn cứ';
    case 'nguyen_tac_app':
      return 'Gợi ý của app';
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
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] text-[#4A5560] border border-[#DED7C6]"
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
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FBEFEF] text-[#8E2516] border border-[#B93826]/35 hover:bg-[#F6DFDF] cursor-pointer transition-colors"
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
    const isInsufficientBasis = isInsufficientBasisResult(result);
    let badgeText = 'Cần lưu ý';
    let badgeStyle = {
      bg: 'bg-[#FDF9F0]',
      text: 'text-[#7C4D1B]',
      border: 'border-[#C88E1B]/40',
      hover: 'hover:bg-[#F9F2E0]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#C88E1B] shrink-0" />,
    };

    if (result.nhan === 'hai_hoa' && isInsufficientBasis) {
      badgeText = 'Chưa đủ căn cứ';
      badgeStyle = {
        bg: 'bg-[#F2EFE9]',
        text: 'text-[#4A5560]',
        border: 'border-[#DED7C6]',
        hover: 'hover:bg-[#E8E3D9]',
        icon: <AlertCircle className="w-3.5 h-3.5 text-[#4A5560] shrink-0" />,
      };
    } else if (result.nhan === 'hai_hoa') {
      badgeText = 'Hài hoà';
      badgeStyle = {
        bg: 'bg-[#E9F2EE]',
        text: 'text-[#2E6254]',
        border: 'border-[#2E6254]/35',
        hover: 'hover:bg-[#D9EAE2]',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-[#2E6254] shrink-0" />,
      };
    } else if (result.nhan === 'de_sai_lech') {
      badgeText = 'Dễ sai lệch văn hoá';
      badgeStyle = {
        bg: 'bg-[#FBEFEF]',
        text: 'text-[#8E2516]',
        border: 'border-[#B93826]/35',
        hover: 'hover:bg-[#F6DFDF]',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[#B93826] shrink-0" />,
      };
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border} ${badgeStyle.hover} cursor-pointer transition-colors shadow-2xs`}
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
        color: 'text-[#4A5560]',
        bg: 'bg-[#F2EFE9]',
        borderColor: 'border-[#DED7C6]',
        tagBg: 'bg-white text-[#4A5560]',
      };
    }
    switch (certaintyLevel) {
      case 'cao':
        return {
          title: 'Mức chắc chắn: Cao',
          desc: 'Có nhiều nguồn tư liệu lịch sử uy tín độc lập đối chiếu.',
          color: 'text-[#1E3F5A]',
          bg: 'bg-[#EBF2F7]',
          borderColor: 'border-[#1E3F5A]/30',
          tagBg: 'bg-white text-[#1E3F5A]',
        };
      case 'trung_binh':
        return {
          title: 'Mức chắc chắn: Trung bình',
          desc: 'Tư liệu còn giả thuyết chưa thống nhất hoặc chỉ dựa trên một nguồn đơn lẻ.',
          color: 'text-[#7C4D1B]',
          bg: 'bg-[#FDF9F0]',
          borderColor: 'border-[#C88E1B]/40',
          tagBg: 'bg-white text-[#7C4D1B]',
        };
      case 'thap':
      default:
        return {
          title: 'Mức chắc chắn: Thấp',
          desc: 'Chưa có đủ nguồn tư liệu xác thực trong các trích đoạn đối chiếu.',
          color: 'text-[#8E2516]',
          bg: 'bg-[#FBEFEF]',
          borderColor: 'border-[#B93826]/35',
          tagBg: 'bg-white text-[#8E2516]',
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
          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs text-[#1E3F5A] hover:text-[#12283A] font-medium cursor-pointer transition-colors group text-left"
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
    <div className={`rounded-2xl border ${style.borderColor} ${style.bg} p-4 text-[#161A1D] transition-all shadow-2xs`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#DED7C6] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <ShieldCheck className="w-4 h-4 text-[#B93826]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-[#161A1D]">
                {label}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-md border border-[#DED7C6] font-semibold ${style.tagBg}`}>
                {style.title}
              </span>
            </div>
            <p className="text-xs text-[#4A5560] mt-1 leading-relaxed">
              {style.desc}
            </p>
          </div>
        </div>

        {sources.length > 0 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#DED7C6] hover:border-[#1E3F5A] text-xs font-semibold text-[#1E3F5A] hover:text-[#12283A] shrink-0 cursor-pointer self-start transition-colors shadow-2xs"
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
  const isInsufficientBasis = isInsufficientBasisResult(result);

  const getDanhGiaBadge = () => {
    if (result.nhan === 'hai_hoa' && isInsufficientBasis) {
      return {
        label: 'Chưa đủ căn cứ',
        bg: 'bg-[#F2EFE9]',
        text: 'text-[#4A5560]',
        border: 'border-[#DED7C6]',
        desc: 'Dữ liệu bối cảnh hiện chưa nêu trang phục này trong danh mục ưu tiên đối chiếu.',
      };
    }
    switch (result.nhan) {
      case 'hai_hoa':
        return {
          label: 'Hài hoà',
          bg: 'bg-[#E9F2EE]',
          text: 'text-[#2E6254]',
          border: 'border-[#2E6254]/35',
          desc: 'Phương án phối đồ tôn trọng cấu trúc cốt lõi của trang phục và phù hợp với tinh thần bối cảnh.',
        };
      case 'can_luu_y':
        return {
          label: 'Cần lưu ý',
          bg: 'bg-[#FDF9F0]',
          text: 'text-[#7C4D1B]',
          border: 'border-[#C88E1B]/40',
          desc: 'Có điểm cần lưu ý về thông lệ ứng xử theo bối cảnh hoặc cách phối đồ.',
        };
      case 'de_sai_lech':
      default:
        return {
          label: 'Dễ sai lệch văn hoá',
          bg: 'bg-[#FBEFEF]',
          text: 'text-[#8E2516]',
          border: 'border-[#B93826]/35',
          desc: 'Bản phối có nguy cơ vi phạm quy tắc lịch sử hoặc làm sai lệch kết cấu nhận diện cốt lõi của trang phục.',
        };
    }
  };

  const badge = getDanhGiaBadge();

  const renderSourceContent = (maNguon: string | null) => {
    if (!maNguon || !maNguon.trim()) {
      return <span className="text-[#4A5560] italic">Chưa có nguồn</span>;
    }

    const codes = maNguon
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      return <span className="text-[#4A5560] italic">Chưa có nguồn</span>;
    }

    const kbCodes = codes.filter((c) => Boolean(KB_NGUON[c]));
    const bcCodes = codes.filter((c) => /^BC-([a-z0-9_]+)-(\d+)$/i.test(c));
    const otherCodes = codes.filter(
      (c) => !KB_NGUON[c] && !/^BC-([a-z0-9_]+)-(\d+)$/i.test(c)
    );

    const visibleKbCodes = kbCodes.slice(0, 3);
    const extraKbCount = kbCodes.length > 3 ? kbCodes.length - 3 : 0;

    return (
      <div className="inline-flex flex-wrap items-center gap-1.5 mt-0.5">
        {visibleKbCodes.map((code) => {
          const kbSrc = KB_NGUON[code];
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1 font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25"
              title={`${kbSrc.ten} (${getLoaiNguonLabel(kbSrc.loai)})`}
            >
              <span>[{code}]</span>
              {kbSrc.url && (
                <a
                  href={kbSrc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1E3F5A] hover:underline inline-flex items-center"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </span>
          );
        })}
        {extraKbCount > 0 && (
          <span
            className="font-mono font-bold text-[#4A5560] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#DED7C6]"
            title={kbCodes.slice(3).join(', ')}
          >
            +{extraKbCount}
          </span>
        )}
        {bcCodes.map((code) => {
          const bcMatch = /^BC-([a-z0-9_]+)-(\d+)$/i.exec(code);
          if (!bcMatch) return null;
          const bcId = bcMatch[1];
          const oneBasedIdx = parseInt(bcMatch[2], 10);
          const targetBc = BOI_CANH.find((b) => b.id === bcId);
          const url =
            targetBc &&
            Array.isArray(targetBc.nguon) &&
            oneBasedIdx >= 1 &&
            oneBasedIdx <= targetBc.nguon.length
              ? targetBc.nguon[oneBasedIdx - 1]
              : undefined;

          if (!url) {
            return (
              <span
                key={code}
                className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25"
              >
                [{code}]
              </span>
            );
          }

          let domain = url;
          try {
            domain = new URL(url).hostname.replace(/^www\./i, '');
          } catch {
            domain = url;
          }

          return (
            <a
              key={code}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E3F5A] bg-[#EBF2F7] hover:bg-[#DCE8F2] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>{domain}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          );
        })}
        {otherCodes.map((code) => (
          <span
            key={code}
            className="font-mono font-bold text-[#1E3F5A] bg-[#EBF2F7] px-2 py-0.5 rounded-md border border-[#1E3F5A]/25"
          >
            [{code}]
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#F8F6F0] rounded-3xl border border-[#DED7C6] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl p-5 sm:p-6 text-[#161A1D]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base sm:text-lg font-bold">
                Bảo Chứng Văn Hóa (Cultural Guardian)
              </h3>
              <p className="text-xs text-[#4A5560]">
                Thẩm định tính hài hoà và chuẩn mực văn hoá cho phương án phối đồ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-xl hover:bg-[#EFECE3] text-[#4A5560] hover:text-[#161A1D] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Certainty Banner */}
        <div className={`p-4 rounded-2xl border ${badge.border} ${badge.bg} mb-4`}>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border bg-white ${badge.border} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white border border-[#DED7C6] text-[#1E3F5A]">
                Mức chắc chắn: {getGuardianCertaintyLabel(result.do_chac_chan)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#4A5560] leading-relaxed mt-1">
            {badge.desc}
          </p>
        </div>

        {/* Color Harmony Score (only if not null) */}
        {result.diem_hai_hoa_mau !== null && (
          <div className="p-3.5 rounded-xl bg-white border border-[#DED7C6] mb-3.5 flex items-center justify-between text-xs gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E3F5A]">Điểm hài hoà màu:</span>
              <span className="font-mono font-bold text-sm text-[#7C4D1B] bg-[#FDF9F0] px-2.5 py-0.5 rounded-md border border-[#C88E1B]/35">
                {result.diem_hai_hoa_mau}/10
              </span>
            </div>
            <span className="text-xs text-[#4A5560] italic">
              điểm hài hoà màu mang tính tham khảo
            </span>
          </div>
        )}

        {/* Reasons (ly_do list) */}
        <div className="space-y-2.5 mb-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
            Lý do thẩm định ({result.ly_do.length}):
          </div>
          {result.ly_do.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white border border-[#DED7C6] space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DED7C6] text-[#4A5560]">
                  {getGuardianLoaiLyDoLabel(item.loai)}
                </span>
                <span className="text-xs text-[#4A5560] font-mono">Mục 0{idx + 1}</span>
              </div>
              <p className="text-[#161A1D] leading-relaxed whitespace-pre-line">
                {item.noi_dung}
              </p>
              <div className="pt-1.5 border-t border-[#F0EBE0] text-xs flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#4A5560]">Nguồn:</span>
                {renderSourceContent(item.ma_nguon)}
              </div>
            </div>
          ))}
        </div>

        {/* Suggested adjustment (goi_y_sua) */}
        {result.goi_y_sua && result.goi_y_sua.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#FDF9F0] border border-[#C88E1B]/35 mb-4 text-xs space-y-1.5">
            <div className="font-bold text-[#7C4D1B]">Gợi ý điều chỉnh:</div>
            <ul className="space-y-1 text-[#5A4630] list-disc list-inside">
              {result.goi_y_sua.map((g, idx) => (
                <li key={idx} className="leading-relaxed">
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-[#DED7C6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#1E3F5A] text-white text-xs font-semibold rounded-xl hover:bg-[#12283A] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#F8F6F0] rounded-3xl border border-[#DED7C6] max-w-md w-full shadow-xl p-5 sm:p-6 text-[#161A1D]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base font-bold text-[#8E2516]">
                Chưa kiểm tra được
              </h3>
              <p className="text-xs text-[#4A5560]">
                Dịch vụ bảo chứng Cultural Guardian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-xl hover:bg-[#EFECE3] text-[#4A5560] hover:text-[#161A1D] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DED7C6] text-xs space-y-2 mb-4 text-[#4A5560]">
          <p>
            Hệ thống chưa thể hoàn thành đối chiếu bảo chứng văn hoá tự động cho phương án này vào lúc này.
          </p>
          <p className="text-xs text-[#4A5560]">
            Vui lòng kiểm tra lại kết nối mạng hoặc thử lại. Các thông tin trích dẫn lịch sử từ tư liệu vẫn giữ nguyên giá trị.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED7C6]">
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="min-h-[44px] px-4 py-2 bg-[#B93826] text-white text-xs font-semibold rounded-xl hover:bg-[#8E2516] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-white border border-[#DED7C6] text-[#4A5560] text-xs font-semibold rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#F8F6F0] rounded-3xl border border-[#DED7C6] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl p-5 sm:p-6 text-[#161A1D]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DED7C6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B93826]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#B93826]" />
            </div>
            <div>
              <h3 className="font-heritage-display text-base sm:text-lg font-bold">
                Bảo Chứng Văn Hóa & Nguồn Tư Liệu
              </h3>
              <p className="text-xs text-[#4A5560]">
                Tiêu chuẩn minh bạch dữ liệu AI Arena Vietnam 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-xl hover:bg-[#EFECE3] text-[#4A5560] hover:text-[#161A1D] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certainty level */}
        <div className="bg-white rounded-2xl p-4 border border-[#DED7C6] mb-4">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5560]">
              Trạng thái kiểm tra
            </span>
            <span className="font-semibold text-xs text-[#1E3F5A] px-2.5 py-0.5 rounded-md bg-[#EBF2F7] border border-[#1E3F5A]/20">
              {label}
            </span>
          </div>
          <p className="text-xs text-[#4A5560] mt-1 leading-relaxed">
            {style.desc}
          </p>
        </div>

        {/* Sources from KB */}
        {sources.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Nguồn tư liệu đối chiếu ({sources.length})
            </h4>
            <div className="space-y-2">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3.5 border border-[#DED7C6] text-xs"
                >
                  <div className="flex items-center justify-between text-xs mb-1 gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#1E3F5A]">[{src.code}]</span>
                    <span className="text-[#4A5560] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#DED7C6] font-semibold">
                      {src.loai}
                    </span>
                  </div>
                  <div className="font-semibold text-[#161A1D]">{src.ten}</div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1E3F5A] hover:underline mt-1 inline-block truncate max-w-full"
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
            <div className="bg-[#FBEFEF] rounded-2xl p-3.5 border border-[#B93826]/30">
              <div className="text-xs font-bold text-[#8E2516] flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B93826]" />
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
            <div className="bg-[#E9F2EE] rounded-2xl p-3.5 border border-[#2E6254]/30">
              <div className="text-xs font-bold text-[#2E6254] flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gợi ý phối đồ
              </div>
              <div className="text-xs font-semibold text-[#7C4D1B] bg-[#FDF9F0] px-2.5 py-0.5 rounded-md border border-[#C88E1B]/35 inline-block mb-2">
                Gợi ý của app, không phải sự thật lịch sử
              </div>
              <ul className="text-xs space-y-1 text-[#21473C] list-disc list-inside">
                {suggestions.map((s, idx) => (
                  <li key={idx} className="leading-snug">{s.noi_dung}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3.5 border-t border-[#DED7C6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#1E3F5A] text-white text-xs font-semibold rounded-xl hover:bg-[#12283A] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
};
