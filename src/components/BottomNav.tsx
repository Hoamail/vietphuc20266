import React from 'react';
import { motion } from 'motion/react';
import { Home, Sparkles, Scale, BookMarked, Camera } from 'lucide-react';

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

  const items = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      active: currentTab === 'home',
    },
    {
      id: 'select',
      label: 'Phối đồ',
      icon: Sparkles,
      active: isRemixActive,
    },
    {
      id: 'compare',
      label: 'So sánh',
      icon: Scale,
      active: currentTab === 'compare',
      badge: compareCount,
      badgeBg: 'bg-[#1E3F5A]',
    },
    {
      id: 'lookbook',
      label: 'Lookbook',
      icon: BookMarked,
      active: currentTab === 'lookbook',
      badge: lookbookCount,
      badgeBg: 'bg-[#B93826]',
    },
    {
      id: 'image-guardian',
      label: 'Xét ảnh',
      ariaLabel: 'Kiểm tra ảnh',
      icon: Camera,
      active: currentTab === 'image-guardian',
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F6F0]/95 backdrop-blur-md border-t border-[#DED7C6] shadow-[0_-4px_16px_rgba(22,26,29,0.05)]"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto px-1 py-1">
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.ariaLabel || item.label}
              onClick={() => onNavigate(item.id)}
              className={`relative min-h-[48px] flex flex-col items-center justify-center px-0.5 py-1 rounded-xl transition-colors duration-200 cursor-pointer ${
                item.active
                  ? 'text-[#1E3F5A]'
                  : 'text-[#4A5560] hover:text-[#161A1D]'
              }`}
            >
              {item.active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-0 left-3 right-3 h-0.5 bg-[#1E3F5A] rounded-full"
                />
              )}

              <IconComponent
                className="w-4 h-4 shrink-0"
                strokeWidth={item.active ? 2.4 : 1.9}
              />

              <span
                className={`text-xs leading-tight tracking-tight mt-1 whitespace-nowrap truncate max-w-full ${
                  item.active ? 'font-semibold text-[#1E3F5A]' : 'font-normal text-[#4A5560]'
                }`}
              >
                {item.label}
              </span>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`absolute top-1 right-2 min-w-[16px] h-4 px-1 ${item.badgeBg} text-white text-xs leading-none font-mono tabular-nums font-bold rounded-full flex items-center justify-center shadow-2xs`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

