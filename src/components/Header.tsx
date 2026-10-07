import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

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

  const isRemixSection =
    currentTab === 'select' || currentTab === 'customize' || currentTab === 'result';

  const navItems = [
    { id: 'home', label: 'Trang chủ', active: currentTab === 'home' },
    { id: 'select', label: 'Phối đồ', active: isRemixSection },
    {
      id: 'compare',
      label: 'So sánh',
      active: currentTab === 'compare',
      count: compareCount,
      countColor: 'text-[#1E3F5A]',
    },
    {
      id: 'lookbook',
      label: 'Lookbook',
      active: currentTab === 'lookbook',
      count: lookbookCount,
      countColor: 'text-[#B93826]',
    },
    {
      id: 'image-guardian',
      label: 'Kiểm tra ảnh',
      active: currentTab === 'image-guardian',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#F8F6F0]/95 backdrop-blur-md border-b border-[#DED7C6] transition-colors">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-15 flex items-center justify-between gap-2">
        {/* Zone 1: Single text wordmark in Display font */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="min-h-[44px] inline-flex items-center text-left group cursor-pointer rounded-lg px-1 -ml-1"
        >
          <span className="font-heritage-display text-lg sm:text-xl font-bold tracking-tight text-[#161A1D] group-hover:text-[#1E3F5A] transition-colors duration-200 whitespace-nowrap">
            Việt Phục Remix
          </span>
        </button>

        {/* Zone 2: Clean text navigation links with animated heritage underline */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-[#4A5560]"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative min-h-[44px] px-1 inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-200 whitespace-nowrap ${
                item.active
                  ? 'text-[#1E3F5A] font-semibold'
                  : 'text-[#4A5560] hover:text-[#161A1D]'
              }`}
            >
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className={`text-xs font-mono tabular-nums font-bold ${item.countColor}`}>
                  ({item.count})
                </span>
              )}
              {item.active && (
                <motion.span
                  layoutId="header-nav-underline"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-1.5 left-0 right-0 h-0.5 bg-[#1E3F5A] rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: API Health Indicator & Primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {hasServerKey !== null && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 border border-[#DED7C6] text-xs font-medium text-[#4A5560] whitespace-nowrap"
              title="Trạng thái cấu hình GEMINI_API_KEY từ /api/health"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasServerKey ? 'bg-[#2E6254]' : 'bg-[#B93826]'
                }`}
              />
              <span className="hidden xs:inline sm:inline">
                {hasServerKey ? 'API Key OK' : 'Thiếu API Key'}
              </span>
              <span className="xs:hidden sm:hidden">
                {hasServerKey ? 'API OK' : 'Thiếu Key'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('select')}
            className="min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#1E3F5A] hover:bg-[#12283A] active:scale-[0.98] rounded-xl transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap inline-flex items-center justify-center"
          >
            Phối đồ ngay
          </button>
        </div>
      </div>
    </header>
  );
};

