import React, { useState } from 'react';
import { ArrowLeft, Scale, Share2, Check, ExternalLink, Info } from 'lucide-react';
import {
  getTrangPhucById,
  KB_TRANG_PHUC,
  BOI_CANH,
  getBoiCanhById,
  POTTERY_SILK_PALETTES,
  getAccessoriesForGarment,
  KB_NGUON,
  getLoaiNguonLabel,
  formatNguonText,
} from '../data/kb';
import { RemixCustomization, SavedLook, WeatherCondition } from '../types/vietphuc';
import { GuardianBadge } from '../components/GuardianBadge';
import { OutfitVectorIllustration } from '../components/OutfitVectorIllustration';
import { SourceCitationText } from '../components/SourceCitationText';

interface ResultScreenProps {
  selectedOutfitId: string;
  customization: RemixCustomization;
  onBackToCustomize: () => void;
  onSaveToLookbook: (item: SavedLook) => void;
  onAddToCompare: (outfitId: string) => void;
  isSavedInLookbook: boolean;
  isInCompare: boolean;
  onNavigateToLookbook: () => void;
  onNavigateToCompare: () => void;
}

function resolveCitedSources(nguonChiSo: number[] | undefined, nguonList: string[]): string[] {
  if (!Array.isArray(nguonList) || nguonList.length === 0) return [];
  if (!Array.isArray(nguonChiSo) || nguonChiSo.length === 0) return [];
  return nguonChiSo
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < nguonList.length)
    .map((idx) => nguonList[idx]);
}

function formatWeatherSummary(w: WeatherCondition): string {
  const seasonMap: Record<WeatherCondition['season'], string> = {
    xuan: 'Mùa Xuân',
    ha: 'Mùa Hạ',
    thu: 'Mùa Thu',
    dong: 'Mùa Đông',
  };
  const tempMap: Record<WeatherCondition['temperature'], string> = {
    mat_me: 'Mát mẻ',
    nong_am: 'Nắng ấm / Nóng',
    se_lanh: 'Se lạnh',
  };
  const todMap: Record<WeatherCondition['timeOfDay'], string> = {
    buoi_sang: 'Buổi sáng',
    buoi_chieu: 'Buổi chiều',
    buoi_toi: 'Buổi tối',
  };
  return `${seasonMap[w.season] || w.season} · ${tempMap[w.temperature] || w.temperature} · ${todMap[w.timeOfDay] || w.timeOfDay}`;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  selectedOutfitId,
  customization,
  onBackToCustomize,
  onSaveToLookbook,
  onAddToCompare,
  isSavedInLookbook,
  isInCompare,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'styling' | 'anatomy' | 'history'>('styling');

  const outfit = getTrangPhucById(selectedOutfitId) || KB_TRANG_PHUC[0];
  const boiCanh = getBoiCanhById(customization.purposeId) || BOI_CANH[0];
  const colorScheme =
    POTTERY_SILK_PALETTES.find((c) => c.id === customization.colorSchemeId) || POTTERY_SILK_PALETTES[0];

  const accessoryOptions = getAccessoriesForGarment(outfit);
  const selectedAccessories = accessoryOptions.filter((a) =>
    customization.selectedAccessoryIds.includes(a.id)
  );

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

  const levelName = getRemixLevelTitle(customization.remixLevel);
  const resultTitle = `${outfit.ten} · Phối ${colorScheme.name}`;
  const resultSubtitle = `${boiCanh.ten} · Phong cách ${levelName}`;

  const priorityRecommendation = boiCanh.nen_uu_tien.find(
    (item) => item.trang_phuc_id === outfit.id
  );

  const sourceDetails = outfit.nguon.map((code) => {
    const info = KB_NGUON[code];
    return {
      code,
      ten: info ? info.ten : code,
      loai: info ? getLoaiNguonLabel(info.loai) : 'Chưa xác định',
      url: info?.url,
    };
  });

  const handleSaveLook = () => {
    const newLook: SavedLook = {
      id: `look-${Date.now()}`,
      title: resultTitle,
      outfitId: outfit.id,
      purposeId: boiCanh.id,
      customization,
      savedAt: new Date().toISOString(),
      tags: [
        outfit.ten,
        colorScheme.name.split(' ')[0],
        levelName,
        boiCanh.ten,
      ],
      notes: `Bối cảnh: ${boiCanh.ten} (${levelName}) · Điều kiện: ${formatWeatherSummary(customization.weather)}.`,
    };
    onSaveToLookbook(newLook);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToCustomize}
          className="text-xs font-medium text-[#52606D] hover:text-[#161A1D] flex items-center gap-1.5 cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tùy biến lại</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Add to Compare */}
          <button
            type="button"
            onClick={() => onAddToCompare(outfit.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isInCompare
                ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/30'
                : 'bg-white text-[#4A5560] border-[#DED7C6] hover:border-[#1E3F5A]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isInCompare ? 'Đã thêm So sánh' : 'Thêm vào So sánh'}</span>
          </button>

          {/* Save to Lookbook */}
          <button
            type="button"
            onClick={handleSaveLook}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSavedInLookbook
                ? 'bg-[#E9F2EE] text-[#2E6254] border border-[#2E6254]/30'
                : 'bg-[#B93826] hover:bg-[#8E2516] text-white shadow-2xs'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSavedInLookbook ? 'Đã lưu Lookbook' : 'Lưu vào Lookbook'}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg border border-[#DED7C6] bg-white text-[#52606D] hover:text-[#161A1D] cursor-pointer"
            title="Sao chép liên kết"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#2E6254]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl border border-[#DED7C6] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Column: Always Vector SVG */}
          <div className="md:col-span-5 bg-[#FAF8F5] relative flex flex-col justify-between overflow-hidden p-5 border-b md:border-b-0 md:border-r border-[#DED7C6]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-[#1E3F5A] font-semibold border border-[#DED7C6]">
                {levelName}
              </span>
              <span className="text-[10px] text-[#7A8691] font-mono">
                Minh họa Line-art SVG
              </span>
            </div>

            {/* Always SVG Illustration */}
            <div className="relative aspect-[3/4] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-[#E8E2D8] p-3">
              <OutfitVectorIllustration id={outfit.id} size="lg" className="border-0 bg-transparent w-full h-full" />
            </div>

            <div className="mt-3 text-center text-[11px] text-[#7A8691]">
              Minh họa vector trung tính line-art theo chuẩn KB-v3
            </div>
          </div>

          {/* Right Column: Detailed Breakdown */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              <div>
                <div className="flex items-center gap-2 text-xs text-[#7A8691] font-medium mb-1 flex-wrap">
                  <span>{formatNguonText(outfit.thoi_ky)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Bối cảnh: {boiCanh.ten}</span>
                </div>
                <h1 className="font-heritage-display text-2xl font-bold text-[#161A1D] leading-tight">
                  {resultTitle}
                </h1>
                <p className="text-xs text-[#52606D] mt-1">
                  {resultSubtitle} · {formatWeatherSummary(customization.weather)}
                </p>
              </div>

              {/* Cultural Guardian Badge: Tạm hiện "Chưa kiểm tra" theo yêu cầu */}
              <div className="mt-4">
                <GuardianBadge
                  label="Chưa kiểm tra"
                  certaintyLevel={outfit.muc_chac_chan}
                  sources={sourceDetails}
                  warnings={outfit.khong_nen_khi_remix}
                  suggestions={outfit.goi_y_phoi_do}
                />
              </div>

              {/* Detail Tabs */}
              <div className="mt-5 border-b border-[#DED7C6] pb-1">
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('styling')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'styling'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Bối cảnh & Gợi ý phối đồ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('anatomy')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'anatomy'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Đặc điểm cấu tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`pb-1.5 cursor-pointer transition-colors ${
                      activeTab === 'history'
                        ? 'text-[#1E3F5A] border-b-2 border-[#1E3F5A]'
                        : 'text-[#7A8691] hover:text-[#161A1D]'
                    }`}
                  >
                    Nguồn gốc & Lịch sử
                  </button>
                </div>
              </div>

              {/* Tab 1: Bối cảnh & Gợi ý phối đồ */}
              {activeTab === 'styling' && (
                <div className="mt-4 space-y-3">
                  {/* Đánh giá bối cảnh từ boi-canh.json */}
                  <div className="space-y-2.5">
                    {priorityRecommendation ? (
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="font-bold text-[#1E3F5A] flex items-center gap-1.5">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>Gợi ý của app cho bối cảnh này</span>
                          </div>
                          <span className="text-[10px] text-[#7A8691] italic">chưa có nguồn</span>
                        </div>
                        <p className="text-[#4A5560] leading-relaxed">{priorityRecommendation.ly_do}</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DED7C6] text-xs text-[#52606D] flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#7A8691] shrink-0" />
                        <span>Chưa có khuyến nghị cho trang phục này trong dữ liệu bối cảnh</span>
                      </div>
                    )}

                    {/* Lưu ý của bối cảnh */}
                    {boiCanh.luu_y.map((item, idx) => {
                      const loaiLabel =
                        item.loai === 'thong_le_ung_xu'
                          ? 'Thông lệ, không phải quy định'
                          : 'Gợi ý thẩm mỹ';
                      const citedUrls = resolveCitedSources(item.nguon_chi_so, boiCanh.nguon);
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs space-y-1.5">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              item.loai === 'thong_le_ung_xu'
                                ? 'bg-[#EBF2F7] text-[#1E3F5A] border-[#1E3F5A]/25'
                                : 'bg-[#FDF9F0] text-[#8B5A2B] border-[#C88E1B]/30'
                            }`}
                          >
                            {loaiLabel}
                          </span>
                          <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                          <div className="text-[10px] text-[#6C7A87] flex flex-wrap items-center gap-1.5">
                            <span>Nguồn:</span>
                            {citedUrls.length > 0 ? (
                              citedUrls.map((url, uIdx) => (
                                <a
                                  key={uIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[#1E3F5A] hover:underline break-all"
                                >
                                  <span>{url}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))
                            ) : (
                              <span>Chưa có nguồn</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#DED7C6]/60">
                    <div className="text-[11px] font-semibold text-[#8B5A2B] bg-[#FDF9F0] px-2.5 py-1 rounded border border-[#C88E1B]/30 inline-block mb-2">
                      Gợi ý của app, không phải sự thật lịch sử
                    </div>

                    {outfit.goi_y_phoi_do.length === 0 ? (
                      <div className="text-xs text-[#7A8691] italic">Chưa có nguồn</div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {outfit.goi_y_phoi_do.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                            <p className="text-[#161A1D] leading-relaxed">{item.noi_dung}</p>
                            {item.ghi_chu && (
                              <p className="text-[11px] text-[#7A8691] mt-1 italic">{item.ghi_chu}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phụ kiện đã chọn */}
                  {selectedAccessories.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-[#1E3F5A] mb-1.5">
                        Phụ kiện đã chọn ({selectedAccessories.length}):
                      </div>
                      <div className="space-y-1.5">
                        {selectedAccessories.map((acc) => (
                          <div
                            key={acc.id}
                            className="p-2 rounded-lg bg-white border border-[#DED7C6] text-xs flex items-center justify-between gap-2"
                          >
                            <span className="text-[#161A1D] font-medium">{acc.name}</span>
                            <span className="text-[10px] text-[#7A8691] shrink-0">
                              {acc.isAppSuggestion
                                ? 'Gợi ý của app, không phải sự thật lịch sử'
                                : 'Tư liệu KB-v3'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Đặc điểm cấu tạo */}
              {activeTab === 'anatomy' && (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                    <div>
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Cổ áo:</span>
                      <SourceCitationText text={outfit.bo_phan.co || 'Chưa có nguồn'} />
                    </div>
                    <div className="pt-2 border-t border-[#E8E2D8]">
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Tay áo:</span>
                      <SourceCitationText text={outfit.bo_phan.tay || 'Chưa có nguồn'} />
                    </div>
                    <div className="pt-2 border-t border-[#E8E2D8]">
                      <span className="font-bold text-[#1E3F5A] block mb-0.5">Thân áo & Vạt áo:</span>
                      <SourceCitationText text={outfit.bo_phan.than || 'Chưa có nguồn'} />
                    </div>
                    {outfit.bo_phan.vat_lieu && (
                      <div className="pt-2 border-t border-[#E8E2D8]">
                        <span className="font-bold text-[#1E3F5A] block mb-0.5">Vật liệu:</span>
                        <SourceCitationText text={outfit.bo_phan.vat_lieu} />
                      </div>
                    )}
                  </div>

                  {/* Đặc điểm nhận diện hình ảnh */}
                  {outfit.dac_diem_nhan_dien_hinh_anh.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                      <span className="font-bold text-[#1E3F5A] block mb-1.5">
                        Đặc điểm nhận diện hình ảnh:
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-[#4A5560]">
                        {outfit.dac_diem_nhan_dien_hinh_anh.map((item, idx) => (
                          <li key={idx}>
                            <SourceCitationText text={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Nguồn gốc & Lịch sử */}
              {activeTab === 'history' && (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                    <span className="font-bold text-[#1E3F5A] block mb-0.5">Thời kỳ lịch sử:</span>
                    <SourceCitationText text={outfit.thoi_ky} />
                  </div>

                  {outfit.boi_canh_su_dung && outfit.boi_canh_su_dung.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                      <span className="font-bold text-[#1E3F5A] block mb-1">Bối cảnh sử dụng:</span>
                      <ul className="space-y-1 list-disc list-inside text-[#4A5560]">
                        {outfit.boi_canh_su_dung.map((b, idx) => (
                          <li key={idx}>
                            <SourceCitationText text={b} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Danh sách nguồn tư liệu */}
                  <div className="p-3 rounded-xl bg-white border border-[#DED7C6]">
                    <span className="font-bold text-[#1E3F5A] block mb-1.5">
                      Nguồn đối chiếu ({outfit.nguon.length}):
                    </span>
                    <div className="space-y-1.5">
                      {sourceDetails.map((src) => (
                        <div key={src.code} className="flex items-center justify-between text-[11px] pb-1 border-b border-[#F0EBE0] last:border-b-0">
                          <div>
                            <span className="font-bold text-[#1E3F5A] mr-1.5">[{src.code}]</span>
                            <span className="text-[#161A1D]">{src.ten}</span>
                          </div>
                          <span className="text-[10px] text-[#7A8691] px-1.5 py-0.2 rounded bg-[#FAF7F2] border border-[#E8E2D8]">
                            {src.loai}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Color Scheme Note */}
            <div className="pt-3 border-t border-[#DED7C6]/60 flex items-center justify-between text-xs text-[#7A8691]">
              <span>Màu sắc: <strong>{colorScheme.name}</strong></span>
              <span>{colorScheme.note}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
