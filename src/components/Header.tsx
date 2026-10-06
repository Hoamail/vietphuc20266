import React, { useEffect, useState } from 'react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lookbookCount: number;
  compareCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  lookbookCount,
  compareCount,
}) => {
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setHasServerKey(Boolean(data && data.hasServerKey === true));
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasServerKey(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#F8F6F0]/95 backdrop-blur-md border-b border-[#DED7C6]/60 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Zone 1: Single text wordmark in Display font */}
        <button
          onClick={() => onNavigate('home')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="font-heritage-display text-lg sm:text-xl font-bold tracking-tight text-[#161A1D] group-hover:text-[#1E3F5A] transition-colors">
            Việt Phục Remix
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs text-[#8E7E6B] font-normal tracking-wide">
            · AI Arena 2026
          </span>
        </button>

        {/* Zone 2: Clean text navigation links (No pills, subtle hover underlines) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5560]">
          <button
            onClick={() => onNavigate('home')}
            className={`cursor-pointer transition-colors hover:text-[#161A1D] pb-0.5 ${
              currentTab === 'home'
                ? 'text-[#1E3F5A] font-semibold border-b-2 border-[#1E3F5A]'
                : ''
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onNavigate('select')}
            className={`cursor-pointer transition-colors hover:text-[#161A1D] pb-0.5 ${
              currentTab === 'select' || currentTab === 'customize' || currentTab === 'result'
                ? 'text-[#1E3F5A] font-semibold border-b-2 border-[#1E3F5A]'
                : ''
            }`}
          >
            Phối đồ
          </button>
          <button
            onClick={() => onNavigate('compare')}
            className={`cursor-pointer transition-colors hover:text-[#161A1D] pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'compare'
                ? 'text-[#1E3F5A] font-semibold border-b-2 border-[#1E3F5A]'
                : ''
            }`}
          >
            <span>So sánh</span>
            {compareCount > 0 && (
              <span className="text-xs text-[#1E3F5A] font-mono tabular-nums font-bold">
                ({compareCount})
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('lookbook')}
            className={`cursor-pointer transition-colors hover:text-[#161A1D] pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'lookbook'
                ? 'text-[#1E3F5A] font-semibold border-b-2 border-[#1E3F5A]'
                : ''
            }`}
          >
            <span>Lookbook</span>
            {lookbookCount > 0 && (
              <span className="text-xs text-[#B93826] font-mono tabular-nums font-bold">
                ({lookbookCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: API Health Indicator & Primary action */}
        <div className="flex items-center gap-2.5">
          {hasServerKey !== null && (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 border border-[#DED7C6] text-[11px] font-medium text-[#4A5560] whitespace-nowrap"
              title="Trạng thái cấu hình GEMINI_API_KEY từ /api/health"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasServerKey ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span>{hasServerKey ? 'API Key OK' : 'Thiếu API Key'}</span>
            </div>
          )}

          <button
            onClick={() => onNavigate('select')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3F5A] hover:bg-[#12283A] rounded-lg transition-colors cursor-pointer min-h-[36px] shadow-sm whitespace-nowrap"
          >
            Phối đồ ngay
          </button>
        </div>
      </div>
    </header>
  );
};
