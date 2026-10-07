import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  X,
  ArrowLeft,
  FileCheck2,
  FileText,
  RotateCw,
} from 'lucide-react';
import { KB_TRANG_PHUC, getTrangPhucById, getOutfitHoverNote } from '../data/kb';
import { ImageGuardianResult } from '../types/vietphuc';

const ALLOWED_GUARDIAN_MIMES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

function resolveGuardianMimeType(file: File): string {
  const rawType = (file.type || '').trim().toLowerCase();
  if (rawType === 'image/jpg' || rawType === 'image/pjpeg') return 'image/jpeg';
  if (rawType === 'image/x-ms-bmp' || rawType === 'image/x-bmp') return 'image/bmp';
  if (ALLOWED_GUARDIAN_MIMES.has(rawType)) return rawType;

  const ext = file.name.split('.').pop()?.trim().toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'jfif':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'pdf':
      return 'application/pdf';
    default:
      return rawType;
  }
}

interface ImageGuardianScreenProps {
  initialOutfitId?: string;
  onBack?: () => void;
  onSelectOutfitForRemix?: (outfitId: string) => void;
}

function generateCaptchaCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const ImageGuardianScreen: React.FC<ImageGuardianScreenProps> = ({
  initialOutfitId = 'ao_ngu_than_tay_chen',
  onBack,
  onSelectOutfitForRemix,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(initialOutfitId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resolvedMimeType, setResolvedMimeType] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState<boolean>(false);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Ô cam kết & Captcha xác nhận
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageGuardianResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCaptchaCode(generateCaptchaCode());
  }, []);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
  };

  const selectedOutfit = getTrangPhucById(selectedOutfitId) || KB_TRANG_PHUC[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setApiError(null);
    setImagePreviewFailed(false);
    // Không xoá kết quả kiểm tra cũ ở đây: kết quả chỉ mất khi người dùng bấm kiểm tra ảnh mới

    const detectedMime = resolveGuardianMimeType(file);

    // Kiểm tra định dạng (JPG / JPEG / PNG / WEBP / GIF / BMP / HEIC / HEIF / PDF)
    if (!ALLOWED_GUARDIAN_MIMES.has(detectedMime)) {
      setApiError(
        'Định dạng tệp không hợp lệ. Vui lòng chọn ảnh hoặc tài liệu định dạng JPG, JPEG, PNG, WEBP, GIF, BMP, HEIC/HEIF hoặc PDF.'
      );
      return;
    }

    // Kiểm tra kích thước tối đa 4 MB
    if (file.size > 4 * 1024 * 1024) {
      setApiError('Dung lượng tệp vượt quá 4 MB. Vui lòng chọn tệp có kích thước nhỏ hơn.');
      return;
    }

    setSelectedFile(file);
    setResolvedMimeType(detectedMime);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Chuyển sang base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBase64Data(base64);
    };
    reader.onerror = () => {
      setApiError('Không thể đọc dữ liệu tệp. Vui lòng thử lại với tệp khác.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setResolvedMimeType('');
    setPreviewUrl(null);
    setImagePreviewFailed(false);
    setBase64Data(null);
    setApiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Giữ nguyên kết quả kiểm tra trước đó theo yêu cầu: chỉ mất khi bắt đầu kiểm tra ảnh mới
  };

  const isCaptchaValid =
    captchaCode.length > 0 &&
    captchaInput.trim().toUpperCase() === captchaCode.toUpperCase();

  const isSubmitReady =
    Boolean(selectedOutfit) &&
    Boolean(base64Data) &&
    Boolean(selectedFile) &&
    consentChecked &&
    isCaptchaValid &&
    !isLoading;

  const handleAnalyze = async () => {
    if (!isSubmitReady) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    // QOL: Kết quả kiểm tra của ảnh cũ CHỈ MẤT KHI BẮT ĐẦU KIỂM TRA ẢNH MỚI
    setResult(null);

    try {
      const res = await fetch('/api/guard-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfitId: selectedOutfit.id,
          imageBase64: base64Data,
          mimeType: resolvedMimeType || resolveGuardianMimeType(selectedFile!),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.success !== true) {
        setApiError(data?.message || 'Chưa kiểm tra được');
        setIsLoading(false);
        // Refresh captcha sau khi gửi
        handleRefreshCaptcha();
        return;
      }

      setResult(data.result);
      // Đổi mã captcha mới cho lượt kiểm tra tiếp theo
      handleRefreshCaptcha();
    } catch {
      setApiError('Chưa kiểm tra được (kết nối mạng gián đoạn hoặc máy chủ không phản hồi).');
    } finally {
      setIsLoading(false);
    }
  };

  const getNhanBadge = (nhan: string) => {
    switch (nhan) {
      case 'hai_hoa':
        return {
          label: 'Hài hoà',
          bg: 'bg-[#E9F2EE] border-[#2E6254]/40 text-[#2E6254]',
          dot: 'bg-[#2E6254]',
          desc: 'Các đặc điểm nhận diện chính trên ảnh khớp với tư liệu KB-v3.',
        };
      case 'can_luu_y':
        return {
          label: 'Cần lưu ý',
          bg: 'bg-[#FDF9F0] border-[#C88E1B]/45 text-[#7C4D1B]',
          dot: 'bg-[#C88E1B]',
          desc: 'Có chi tiết bị che hoặc chưa đủ căn cứ đối chiếu trong ảnh.',
        };
      case 'de_sai_lech':
      default:
        return {
          label: 'Dễ sai lệch',
          bg: 'bg-[#FBEFEF] border-[#B93826]/40 text-[#8E2516]',
          dot: 'bg-[#B93826]',
          desc: 'Phát hiện đặc điểm mâu thuẫn hoặc phom dáng dễ gây nhầm lẫn.',
        };
    }
  };

  const getCertaintyLabel = (level: string) => {
    switch (level) {
      case 'cao':
        return 'Cao';
      case 'thap':
        return 'Thấp';
      case 'trung_binh':
      default:
        return 'Trung bình';
    }
  };

  return (
    <div className="pb-16 max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] px-3 text-[#4A5560] hover:text-[#161A1D] rounded-xl bg-white border border-[#DED7C6] hover:border-[#1E3F5A] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 text-xs text-[#1E3F5A] uppercase tracking-wider font-bold mb-1">
              <span>Thẩm định trực quan</span>
              <span aria-hidden="true">·</span>
              <span>Cultural Guardian Vision</span>
            </div>
            <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D] flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#1E3F5A] shrink-0" />
              <span>Kiểm tra ảnh trang phục (Image Guardian)</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5560] mt-1 leading-relaxed">
              Đối chiếu chi tiết hình ảnh thực tế với đặc điểm nhận diện trong cơ sở dữ liệu KB-v3.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#DED7C6] text-xs text-[#4A5560] flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-[#EBF2F7] border border-[#1E3F5A]/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#1E3F5A]" />
        </div>
        <div className="leading-relaxed">
          <strong className="text-[#161A1D]">Bảo mật & Quyền riêng tư:</strong> Ảnh tải lên chỉ phân tích trực tiếp trong phiên này và không lưu trữ trên máy chủ. Tính năng hỗ trợ nhận diện hình thức trực quan, không nhận diện danh tính hay ngoại hình người mặc.
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (Trang phục, Ảnh, Cam kết, Captcha) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Chọn trang phục đối chiếu */}
          <div className="heritage-card p-5 rounded-2xl space-y-2.5">
            <label htmlFor="guardian-outfit-select" className="block text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
              1. Trang phục cần đối chiếu
            </label>
            <select
              id="guardian-outfit-select"
              value={selectedOutfitId}
              title={getOutfitHoverNote(selectedOutfit)}
              onChange={(e) => {
                setSelectedOutfitId(e.target.value);
                setApiError(null);
                // Giữ nguyên kết quả kiểm tra cũ cho đến khi người dùng bấm kiểm tra ảnh mới
              }}
              className="w-full min-h-[44px] text-sm font-semibold border border-[#DED7C6] rounded-xl px-3.5 py-2.5 bg-[#FAF8F3] text-[#161A1D] focus:outline-none focus:ring-2 focus:ring-[#1E3F5A] cursor-pointer transition-colors"
            >
              {KB_TRANG_PHUC.map((outfit) => (
                <option key={outfit.id} value={outfit.id} title={getOutfitHoverNote(outfit)}>
                  {outfit.ten}
                </option>
              ))}
            </select>
          </div>

          {/* Card: Tải ảnh / PDF */}
          <div className="heritage-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
                2. Tải ảnh / PDF trang phục (≤ 4MB)
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#FBEFEF] border border-[#B93826]/30 text-xs text-[#8E2516] hover:bg-[#F6DFDF] flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Gỡ tệp</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-[#1E3F5A] bg-[#EBF2F7]/60 scale-[0.99]'
                    : 'border-[#DED7C6] hover:border-[#1E3F5A] bg-[#FAF8F3] hover:bg-[#F3EFE6]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#DED7C6] flex items-center justify-center text-[#1E3F5A] shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-[#161A1D]">
                  Chọn ảnh / tệp PDF hoặc kéo thả vào đây
                </div>
                <div className="text-xs text-[#4A5560]">
                  Hỗ trợ JPG, JPEG, PNG, WEBP, GIF, BMP, HEIC/HEIF, PDF (tối đa 4 MB)
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="relative rounded-2xl overflow-hidden border border-[#DED7C6] bg-[#FAF8F3] flex items-center justify-center max-h-64">
                  {resolvedMimeType === 'application/pdf' ? (
                    <div className="w-full p-6 bg-[#FAF8F3] flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#DED7C6] flex items-center justify-center text-[#1E3F5A] shadow-2xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#161A1D] truncate max-w-full px-2">
                        {selectedFile?.name || 'Tài liệu PDF'}
                      </div>
                      <div className="text-xs text-[#4A5560]">
                        Tệp PDF đã sẵn sàng để đối chiếu với Cultural Guardian
                      </div>
                    </div>
                  ) : imagePreviewFailed ? (
                    <div className="w-full p-6 bg-[#FAF8F3] flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#DED7C6] flex items-center justify-center text-[#1E3F5A] shadow-2xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#161A1D] truncate max-w-full px-2">
                        {selectedFile?.name || 'Tệp hình ảnh'}
                      </div>
                      <div className="text-xs text-[#4A5560]">
                        Định dạng {resolvedMimeType.replace('image/', '').toUpperCase()} đã sẵn sàng để kiểm tra
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Xem trước ảnh trang phục"
                      onError={() => setImagePreviewFailed(true)}
                      className="max-h-64 w-full object-contain mx-auto"
                    />
                  )}
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between text-xs text-[#4A5560] px-1">
                    <span className="truncate max-w-[200px] font-medium text-[#161A1D]">{selectedFile.name}</span>
                    <span className="font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
                <div className="text-xs text-[#4A5560] italic text-center">
                  Tệp do người dùng tải lên, chỉ dùng để phân tích trong phiên này và không lưu trữ trên máy chủ.
                </div>
              </div>
            )}
          </div>

          {/* Card: Xác nhận cam kết & Captcha bảo mật */}
          <div className="heritage-card p-5 rounded-2xl space-y-3.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
              3. Xác thực bảo mật & Cam kết
            </label>

            {/* Checkbox cam kết */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F3] border border-[#DED7C6] hover:border-[#1E3F5A]/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#1E3F5A] border-[#DED7C6] rounded focus:ring-[#1E3F5A] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#161A1D] leading-relaxed select-none">
                Tôi xác nhận: <strong>Đây là ảnh của tôi hoặc tôi được phép dùng ảnh này, và không có người khác trong ảnh nếu họ chưa đồng ý.</strong>
              </span>
            </label>

            {/* Khối Captcha xác nhận */}
            <div className="pt-2.5 border-t border-[#EAE4D7] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#4A5560]">
                <span className="font-medium">Mã xác nhận bảo mật:</span>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#FAF8F3] border border-[#DED7C6] hover:border-[#1E3F5A] text-xs text-[#1E3F5A] flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                  title="Đổi mã khác"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Đổi mã</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Visual Captcha Box */}
                <div
                  className="min-h-[44px] px-4 bg-[#1E3F5A] text-[#FAF8F3] rounded-xl flex items-center justify-center font-mono font-bold tracking-[0.3em] text-base select-none shrink-0 shadow-inner relative overflow-hidden"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {/* Decorative background lines for captcha texture */}
                  <span className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]" />
                  <span>{captchaCode}</span>
                </div>

                {/* Input Captcha */}
                <input
                  type="text"
                  maxLength={4}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="Nhập 4 ký tự"
                  aria-label="Nhập mã xác nhận bảo mật 4 ký tự"
                  className={`flex-1 min-h-[44px] px-3.5 text-sm font-mono uppercase tracking-widest border rounded-xl bg-[#FAF8F3] text-[#161A1D] focus:outline-none focus:ring-2 focus:ring-[#1E3F5A] transition-colors ${
                    captchaInput.length === 4
                      ? isCaptchaValid
                        ? 'border-[#2E6254] bg-[#E9F2EE]/50'
                        : 'border-[#B93826] bg-[#FBEFEF]/50'
                      : 'border-[#DED7C6]'
                  }`}
                />
              </div>

              {captchaInput.length > 0 && !isCaptchaValid && (
                <div className="text-xs text-[#8E2516] font-medium">
                  Mã chưa đúng, vui lòng nhập chính xác 4 ký tự viết hoa.
                </div>
              )}
            </div>
          </div>

          {/* Nút phân tích */}
          <motion.button
            type="button"
            whileTap={isSubmitReady && !shouldReduceMotion ? { scale: 0.98 } : undefined}
            onClick={handleAnalyze}
            disabled={!isSubmitReady}
            className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isSubmitReady
                ? 'bg-[#EAE4D7] text-[#4A5560] cursor-not-allowed border border-[#DED7C6]'
                : 'bg-[#1E3F5A] hover:bg-[#12283A] text-white shadow-md'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang đối chiếu chi tiết ảnh với tư liệu KB...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Bắt đầu kiểm tra ảnh với Cultural Guardian</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Right Column: Kết quả kiểm tra / Trạng thái loading / Hướng dẫn */}
        <div className="lg:col-span-7 space-y-4">
          {apiError && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-[#FBEFEF] border border-[#B93826]/35 text-[#8E2516] space-y-2.5"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-[#B93826] shrink-0" />
                <span>Chưa kiểm tra được</span>
              </div>
              <p className="text-xs text-[#78261A] leading-relaxed">
                {apiError}
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!isSubmitReady}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white border border-[#B93826]/30 text-xs font-semibold text-[#8E2516] hover:bg-[#FAF8F3] cursor-pointer transition-colors"
              >
                Thử kiểm tra lại
              </button>
            </motion.div>
          )}

          {isLoading && (
            <div className="heritage-card p-6 sm:p-8 rounded-3xl space-y-5" aria-busy="true">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EBF2F7] border border-[#1E3F5A]/25 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-[#1E3F5A] animate-spin" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#161A1D]">
                    Đang đối chiếu chi tiết ảnh với tư liệu KB...
                  </div>
                  <div className="text-xs text-[#4A5560] mt-0.5 leading-relaxed">
                    Kiểm tra cấu tạo nẹp cổ, hàng cúc, phom tay áo và hướng vạt áo theo quy chuẩn trang phục {selectedOutfit.ten}.
                  </div>
                </div>
              </div>

              {/* Structured Skeleton */}
              <div className="space-y-3 pt-2 border-t border-[#DED7C6]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 w-1/3 heritage-skeleton rounded-lg" />
                  <div className="h-7 w-28 heritage-skeleton rounded-full" />
                </div>
                <div className="h-10 w-full heritage-skeleton rounded-xl" />
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-2/5 heritage-skeleton rounded" />
                  <div className="h-12 w-full heritage-skeleton rounded-xl" />
                  <div className="h-12 w-full heritage-skeleton rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {result && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="heritage-card p-5 sm:p-6 rounded-3xl space-y-5"
            >
              {/* Header result - Điểm nhấn thẩm định */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F4F7FA] via-[#FAF8F3] to-[#F3EFE4] border-2 border-[#1E3F5A]/25 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#1E3F5A] font-bold">
                    Kết quả đối chiếu hình ảnh · Cultural Guardian
                  </div>
                  <div
                    title={getOutfitHoverNote(selectedOutfit)}
                    className="font-heritage-display text-lg sm:text-xl font-bold text-[#161A1D]"
                  >
                    {selectedOutfit.ten}
                  </div>
                </div>

                {/* Huy hiệu nhãn */}
                {(() => {
                  const badge = getNhanBadge(result.nhan);
                  return (
                    <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 shrink-0 shadow-2xs ${badge.bg}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Mức chắc chắn tư liệu */}
              <div className="flex items-center justify-between text-xs px-4 py-3 bg-[#FAF8F3] rounded-xl border border-[#DED7C6]">
                <span className="text-[#4A5560] font-medium">Mức chắc chắn tư liệu trong KB:</span>
                <span className="font-bold text-[#1E3F5A] px-2.5 py-0.5 rounded-md bg-white border border-[#DED7C6]">
                  {getCertaintyLabel(result.do_chac_chan)}
                </span>
              </div>

              {/* Cảnh báo cố định (Áo giao lĩnh nếu có) */}
              {result.canh_bao_co_dinh && (
                <div className="p-4 bg-[#FDF9F0] border border-[#C88E1B]/40 rounded-2xl text-xs text-[#7C4D1B] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#C88E1B] shrink-0" />
                    <span>Lưu ý phom dáng</span>
                  </div>
                  <p className="leading-relaxed text-[#5A4630]">{result.canh_bao_co_dinh}</p>
                </div>
              )}

              {/* 1. Điểm khớp */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#2E6254] flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-[#2E6254] shrink-0" />
                  <span>Đặc điểm nhận diện khớp ({result.diem_khop.length})</span>
                </div>
                {result.diem_khop.length > 0 ? (
                  <ul className="space-y-2 text-xs text-[#161A1D]">
                    {result.diem_khop.map((item, idx) => (
                      <li key={idx} className="p-3 bg-[#E9F2EE]/70 rounded-xl border border-[#2E6254]/25 flex items-start gap-2">
                        <span className="text-[#2E6254] font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-[#4A5560] italic pl-2">
                    Không ghi nhận điểm khớp rõ ràng trên ảnh.
                  </div>
                )}
              </div>

              {/* 2. Điểm không khớp (mâu thuẫn rõ) */}
              {result.diem_khong_khop.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#8E2516] flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-[#B93826] shrink-0" />
                    <span>Đặc điểm mâu thuẫn / sai lệch ({result.diem_khong_khop.length})</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#161A1D]">
                    {result.diem_khong_khop.map((item, idx) => (
                      <li key={idx} className="p-3 bg-[#FBEFEF]/80 rounded-xl border border-[#B93826]/30 flex items-start gap-2">
                        <span className="text-[#B93826] font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Điểm không xác định được (do góc chụp / bị che) */}
              {result.diem_khong_xac_dinh.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1E3F5A] flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-[#4A5560] shrink-0" />
                    <span>Đặc điểm chưa xác định được ({result.diem_khong_xac_dinh.length})</span>
                  </div>
                  <div className="text-xs text-[#4A5560] italic">
                    Chi tiết bị che hoặc không rõ góc chụp trong ảnh, không coi là sai.
                  </div>
                  <ul className="space-y-2 text-xs text-[#4A5560]">
                    {result.diem_khong_xac_dinh.map((item, idx) => (
                      <li key={idx} className="p-3 bg-[#FAF8F3] rounded-xl border border-[#DED7C6] flex items-start gap-2">
                        <span className="text-[#4A5560] font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions footer */}
              <div className="pt-4 border-t border-[#DED7C6] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DED7C6] hover:border-[#1E3F5A] text-xs font-semibold text-[#4A5560] hover:text-[#161A1D] cursor-pointer transition-colors"
                >
                  Tải ảnh khác để kiểm tra
                </button>

                {onSelectOutfitForRemix && (
                  <button
                    type="button"
                    title={getOutfitHoverNote(selectedOutfit)}
                    onClick={() => onSelectOutfitForRemix(selectedOutfit.id)}
                    className="min-h-[44px] text-xs font-semibold bg-[#1E3F5A] text-white px-4 py-2 rounded-xl hover:bg-[#12283A] transition-colors cursor-pointer shadow-xs"
                  >
                    Phối đồ với {selectedOutfit.ten}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {!result && !isLoading && !apiError && (
            <div className="heritage-card p-6 sm:p-8 rounded-3xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#DED7C6] flex items-center justify-center mx-auto text-[#1E3F5A] shadow-2xs">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-heritage-display text-lg font-bold text-[#161A1D]">
                Sẵn sàng kiểm tra ảnh trang phục
              </h3>
              <p className="text-xs sm:text-sm text-[#4A5560] max-w-md mx-auto leading-relaxed">
                Tải lên ảnh chụp góc thẳng hoặc rõ nẹp cổ, hàng cúc và phom tay áo để Cultural Guardian đối chiếu trực tiếp với quy chuẩn trang phục trong cơ sở dữ liệu KB-v3.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[#4A5560] font-medium">
                <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6]">
                  ✓ Kiểm tra nẹp cổ & hướng vạt
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6]">
                  ✓ Kiểm tra phom tay áo
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DED7C6]">
                  ✓ Nhận diện điểm mâu thuẫn
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
