import React, { useState, useRef, useEffect } from 'react';
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
  RotateCw,
} from 'lucide-react';
import { KB_TRANG_PHUC, getTrangPhucById } from '../data/kb';
import { ImageGuardianResult } from '../types/vietphuc';

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
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(initialOutfitId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);

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
    // Không xoá kết quả kiểm tra cũ ở đây: kết quả chỉ mất khi người dùng bấm kiểm tra ảnh mới

    // Kiểm tra định dạng (JPG / PNG)
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setApiError('Định dạng tệp không hợp lệ. Vui lòng chỉ chọn ảnh định dạng JPG hoặc PNG.');
      return;
    }

    // Kiểm tra kích thước tối đa 4 MB
    if (file.size > 4 * 1024 * 1024) {
      setApiError('Dung lượng tệp vượt quá 4 MB. Vui lòng chọn ảnh có kích thước nhỏ hơn.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Chuyển sang base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBase64Data(base64);
    };
    reader.onerror = () => {
      setApiError('Không thể đọc dữ liệu ảnh. Vui lòng thử lại với tệp khác.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
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
          mimeType: selectedFile!.type,
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
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          dot: 'bg-emerald-500',
          desc: 'Các đặc điểm nhận diện chính trên ảnh khớp với tư liệu KB-v3.',
        };
      case 'can_luu_y':
        return {
          label: 'Cần lưu ý',
          bg: 'bg-amber-50 border-amber-300 text-amber-800',
          dot: 'bg-amber-500',
          desc: 'Có chi tiết bị che hoặc chưa đủ căn cứ đối chiếu trong ảnh.',
        };
      case 'de_sai_lech':
      default:
        return {
          label: 'Dễ sai lệch',
          bg: 'bg-rose-50 border-rose-300 text-rose-800',
          dot: 'bg-rose-500',
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
    <div className="pb-16 max-w-5xl mx-auto animate-in fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-[#4A5560] hover:text-[#161A1D] rounded-md hover:bg-[#EAE4D7] transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-heritage-display text-2xl sm:text-3xl font-bold text-[#161A1D] flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#1E3F5A]" />
              Kiểm tra ảnh trang phục (Image Guardian)
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5560] mt-0.5">
              Đối chiếu chi tiết hình ảnh thực tế với đặc điểm nhận diện trong cơ sở dữ liệu KB-v3.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3 mb-6 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] text-xs text-[#52606D] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#1E3F5A] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Bảo mật & Quyền riêng tư:</strong> Ảnh tải lên chỉ phân tích trực tiếp trong phiên này và không lưu trữ trên máy chủ. Tính năng hỗ trợ nhận diện hình thức trực quan, không nhận diện danh tính hay ngoại hình người mặc.
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (Trang phục, Ảnh, Cam kết, Captcha) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Chọn trang phục đối chiếu */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DED7C6] shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
              1. Trang phục cần đối chiếu
            </label>
            <select
              value={selectedOutfitId}
              onChange={(e) => {
                setSelectedOutfitId(e.target.value);
                setApiError(null);
                // Giữ nguyên kết quả kiểm tra cũ cho đến khi người dùng bấm kiểm tra ảnh mới
              }}
              className="w-full text-sm font-semibold border border-[#DED7C6] rounded-xl p-2.5 bg-[#FAF8F5] text-[#161A1D] focus:outline-none focus:ring-2 focus:ring-[#1E3F5A] cursor-pointer"
            >
              {KB_TRANG_PHUC.map((outfit) => (
                <option key={outfit.id} value={outfit.id}>
                  {outfit.ten}
                </option>
              ))}
            </select>
          </div>

          {/* Card: Tải ảnh */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DED7C6] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
                2. Tải ảnh trang phục (JPG / PNG ≤ 4MB)
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Gỡ ảnh
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className="border-2 border-dashed border-[#DED7C6] hover:border-[#1E3F5A] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#FAF8F5] hover:bg-[#F3EFE6] flex flex-col items-center justify-center gap-2"
              >
                <div className="w-11 h-11 rounded-full bg-[#EAE4D7] flex items-center justify-center text-[#1E3F5A]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-[#161A1D]">
                  Chọn ảnh hoặc kéo thả vào đây
                </div>
                <div className="text-xs text-[#7A8691]">
                  Chấp nhận JPG hoặc PNG, dung lượng tối đa 4 MB
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-[#DED7C6] bg-black/5 flex items-center justify-center max-h-64">
                  <img
                    src={previewUrl}
                    alt="Xem trước ảnh trang phục"
                    className="max-h-64 w-full object-contain mx-auto"
                  />
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between text-[11px] text-[#7A8691] px-1">
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
                <div className="text-[11px] text-[#7A8691] italic text-center">
                  Ảnh do người dùng tải lên, chỉ dùng để phân tích trong phiên này và không lưu trữ trên máy chủ.
                </div>
              </div>
            )}
          </div>

          {/* Card: Xác nhận cam kết & Captcha bảo mật */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DED7C6] shadow-xs space-y-3.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F5A]">
              3. Xác thực bảo mật & Cam kết
            </label>

            {/* Checkbox cam kết */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#1E3F5A] border-[#DED7C6] rounded focus:ring-[#1E3F5A] cursor-pointer"
              />
              <span className="text-xs text-[#161A1D] leading-relaxed select-none">
                Tôi xác nhận: <strong>Đây là ảnh của tôi hoặc tôi được phép dùng ảnh này, và không có người khác trong ảnh nếu họ chưa đồng ý.</strong>
              </span>
            </label>

            {/* Khối Captcha xác nhận */}
            <div className="pt-2 border-t border-[#EAE4D7] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#4A5560]">
                <span>Mã xác nhận bảo mật:</span>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="text-xs text-[#1E3F5A] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  title="Đổi mã khác"
                >
                  <RotateCw className="w-3 h-3" />
                  Đổi mã
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Visual Captcha Box */}
                <div
                  className="h-10 px-3.5 bg-[#1E3F5A] text-[#FAF8F5] rounded-xl flex items-center justify-center font-mono font-bold tracking-[0.3em] text-base select-none shrink-0 shadow-inner relative overflow-hidden"
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
                  className={`flex-1 h-10 px-3 text-sm font-mono uppercase tracking-widest border rounded-xl bg-[#FAF8F5] text-[#161A1D] focus:outline-none focus:ring-2 focus:ring-[#1E3F5A] transition-colors ${
                    captchaInput.length === 4
                      ? isCaptchaValid
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-rose-400 bg-rose-50/30'
                      : 'border-[#DED7C6]'
                  }`}
                />
              </div>

              {captchaInput.length > 0 && !isCaptchaValid && (
                <div className="text-[11px] text-rose-600">
                  Mã chưa đúng, vui lòng nhập chính xác 4 ký tự viết hoa.
                </div>
              )}
            </div>
          </div>

          {/* Nút phân tích */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!isSubmitReady}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              !isSubmitReady
                ? 'bg-[#EAE4D7] text-[#7A8691] cursor-not-allowed opacity-75'
                : 'bg-[#1E3F5A] hover:bg-[#152e42] text-white shadow-md'
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
          </button>
        </div>

        {/* Right Column: Kết quả kiểm tra / Trạng thái loading / Hướng dẫn */}
        <div className="lg:col-span-7 space-y-4">
          {apiError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Chưa kiểm tra được</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                {apiError}
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!isSubmitReady}
                className="text-xs font-semibold text-rose-800 underline hover:no-underline pt-1 cursor-pointer"
              >
                Thử kiểm tra lại
              </button>
            </div>
          )}

          {isLoading && (
            <div className="p-8 rounded-2xl bg-white border border-[#DED7C6] shadow-xs text-center space-y-3">
              <div className="w-12 h-12 border-3 border-[#1E3F5A] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-[#161A1D]">
                Đang đối chiếu chi tiết ảnh với tư liệu KB...
              </div>
              <div className="text-xs text-[#7A8691] max-w-sm mx-auto leading-relaxed">
                Kiểm tra cấu tạo nẹp cổ, hàng cúc, phom tay áo và hướng vạt áo theo quy chuẩn trang phục {selectedOutfit.ten}.
              </div>
            </div>
          )}

          {result && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DED7C6] shadow-xs space-y-5 animate-in fade-in">
              {/* Header result */}
              <div className="flex items-start justify-between pb-3.5 border-b border-[#DED7C6] gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#7A8691]">
                    Kết quả đối chiếu hình ảnh
                  </div>
                  <div className="text-lg font-bold text-[#161A1D]">
                    {selectedOutfit.ten}
                  </div>
                </div>

                {/* Huy hiệu nhãn */}
                {(() => {
                  const badge = getNhanBadge(result.nhan);
                  return (
                    <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 shrink-0 ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Mức chắc chắn tư liệu */}
              <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
                <span className="text-[#4A5560]">Mức chắc chắn tư liệu trong KB:</span>
                <span className="font-semibold text-[#161A1D]">
                  {getCertaintyLabel(result.do_chac_chan)}
                </span>
              </div>

              {/* Cảnh báo cố định (Áo giao lĩnh nếu có) */}
              {result.canh_bao_co_dinh && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Lưu ý phom dáng</span>
                  </div>
                  <p className="leading-relaxed">{result.canh_bao_co_dinh}</p>
                </div>
              )}

              {/* 1. Điểm khớp */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đặc điểm nhận diện khớp ({result.diem_khop.length})</span>
                </div>
                {result.diem_khop.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-[#161A1D]">
                    {result.diem_khop.map((item, idx) => (
                      <li key={idx} className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-[#7A8691] italic pl-2">
                    Không ghi nhận điểm khớp rõ ràng trên ảnh.
                  </div>
                )}
              </div>

              {/* 2. Điểm không khớp (mâu thuẫn rõ) */}
              {result.diem_khong_khop.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Đặc điểm mâu thuẫn / sai lệch ({result.diem_khong_khop.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#161A1D]">
                    {result.diem_khong_khop.map((item, idx) => (
                      <li key={idx} className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-100 flex items-start gap-2">
                        <span className="text-rose-600 font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Điểm không xác định được (do góc chụp / bị che) */}
              {result.diem_khong_xac_dinh.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#4A5560] flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-[#7A8691] shrink-0" />
                    <span>Đặc điểm chưa xác định được ({result.diem_khong_xac_dinh.length})</span>
                  </div>
                  <div className="text-[11px] text-[#7A8691] italic">
                    Chi tiết bị che hoặc không rõ góc chụp trong ảnh, không coi là sai.
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4A5560]">
                    {result.diem_khong_xac_dinh.map((item, idx) => (
                      <li key={idx} className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#DED7C6] flex items-start gap-2">
                        <span className="text-[#7A8691] font-bold">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions footer */}
              <div className="pt-3.5 border-t border-[#DED7C6] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs text-[#4A5560] hover:text-[#161A1D] underline cursor-pointer"
                >
                  Tải ảnh khác để kiểm tra
                </button>

                {onSelectOutfitForRemix && (
                  <button
                    type="button"
                    onClick={() => onSelectOutfitForRemix(selectedOutfit.id)}
                    className="text-xs font-semibold bg-[#1E3F5A] text-white px-3.5 py-2 rounded-xl hover:bg-[#152e42] transition-colors cursor-pointer shadow-2xs"
                  >
                    Phối đồ với {selectedOutfit.ten}
                  </button>
                )}
              </div>
            </div>
          )}

          {!result && !isLoading && !apiError && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DED7C6] text-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center mx-auto text-[#1E3F5A]">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#161A1D]">
                Sẵn sàng kiểm tra ảnh trang phục
              </h3>
              <p className="text-xs text-[#7A8691] max-w-md mx-auto leading-relaxed">
                Tải lên ảnh chụp góc thẳng hoặc rõ nẹp cổ, hàng cúc và phom tay áo để Cultural Guardian đối chiếu trực tiếp với quy chuẩn trang phục trong cơ sở dữ liệu KB-v3.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#52606D]">
                <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#EAE4D7]">
                  ✓ Kiểm tra nẹp cổ & hướng vạt
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#EAE4D7]">
                  ✓ Kiểm tra phom tay áo
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#EAE4D7]">
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
