import React from 'react';
import { Home, Sparkles, Scale, BookMarked } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lookbookCount: number;
  compareCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  lookbookCount,
  compareCount,
}) => {
  const isRemixActive = ['select', 'customize', 'result'].includes(currentTab);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F6F0]/95 backdrop-blur-md border-t border-[#DED7C6] transition-transform duration-200"
      style={{ maxHeight: '64px' }}
    >
      <div className="grid grid-cols-4 items-center h-15 max-w-md mx-auto px-1">
        {/* Tab 1: Trang chủ */}
        <button
          onClick={() => onNavigate('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            currentTab === 'home' ? 'text-[#1E3F5A]' : 'text-[#7A8691] hover:text-[#161A1D]'
          }`}
        >
          <Home className="w-5 h-5" strokeWidth={currentTab === 'home' ? 2.3 : 1.8} />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              currentTab === 'home' ? 'font-semibold text-[#1E3F5A]' : 'font-normal'
            }`}
          >
            Trang chủ
          </span>
        </button>

        {/* Tab 2: Phối đồ */}
        <button
          onClick={() => onNavigate('select')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            isRemixActive ? 'text-[#1E3F5A]' : 'text-[#7A8691] hover:text-[#161A1D]'
          }`}
        >
          <Sparkles className="w-5 h-5" strokeWidth={isRemixActive ? 2.3 : 1.8} />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              isRemixActive ? 'font-semibold text-[#1E3F5A]' : 'font-normal'
            }`}
          >
            Phối đồ
          </span>
        </button>

        {/* Tab 3: So sánh */}
        <button
          onClick={() => onNavigate('compare')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer ${
            currentTab === 'compare' ? 'text-[#1E3F5A]' : 'text-[#7A8691] hover:text-[#161A1D]'
          }`}
        >
          <Scale className="w-5 h-5" strokeWidth={currentTab === 'compare' ? 2.3 : 1.8} />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              currentTab === 'compare' ? 'font-semibold text-[#1E3F5A]' : 'font-normal'
            }`}
          >
            So sánh
          </span>
          {compareCount > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 bg-[#1E3F5A] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
              {compareCount}
            </span>
          )}
        </button>

        {/* Tab 4: Lookbook */}
        <button
          onClick={() => onNavigate('lookbook')}
          className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer ${
            currentTab === 'lookbook' ? 'text-[#1E3F5A]' : 'text-[#7A8691] hover:text-[#161A1D]'
          }`}
        >
          <BookMarked className="w-5 h-5" strokeWidth={currentTab === 'lookbook' ? 2.3 : 1.8} />
          <span
            className={`text-[10px] tracking-tight mt-0.5 ${
              currentTab === 'lookbook' ? 'font-semibold text-[#1E3F5A]' : 'font-normal'
            }`}
          >
            Lookbook
          </span>
          {lookbookCount > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 bg-[#B93826] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
              {lookbookCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
