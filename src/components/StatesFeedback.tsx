import React from 'react';
import { AlertCircle, FolderSearch, RefreshCw, Sparkles, BookOpen } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Đang tải tư liệu di sản...',
  subMessage = 'Đối chiếu văn bản điển chế và phục dựng mô hình trang phục',
}) => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-[#EBF2F7] border border-[#1E3F5A]/20 flex items-center justify-center text-[#1E3F5A] mb-4">
        <RefreshCw className="w-6 h-6 animate-spin text-[#1E3F5A]" />
      </div>
      <h4 className="font-heritage-display text-base font-bold text-[#161A1D]">
        {message}
      </h4>
      <p className="text-xs text-[#6C7A87] mt-1 max-w-sm">
        {subMessage}
      </p>

      {/* Ceramic skeleton preview cards */}
      <div className="w-full max-w-md mt-6 space-y-3">
        <div className="h-28 bg-[#EFECE3]/70 rounded-2xl border border-[#DED7C6]" />
        <div className="h-10 bg-[#EFECE3]/50 rounded-xl" />
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  iconType?: 'lookbook' | 'compare' | 'search';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  iconType = 'lookbook',
}) => {
  return (
    <div className="py-14 px-4 bg-white/70 rounded-2xl border border-[#DED7C6] flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-[#F8F6F0] border border-[#DED7C6] flex items-center justify-center text-[#8E7E6B] mb-4">
        {iconType === 'lookbook' && <BookOpen className="w-6 h-6 text-[#1E3F5A]" />}
        {iconType === 'compare' && <Sparkles className="w-6 h-6 text-[#B93826]" />}
        {iconType === 'search' && <FolderSearch className="w-6 h-6 text-[#2E6254]" />}
      </div>

      <h3 className="font-heritage-display text-lg font-bold text-[#161A1D]">
        {title}
      </h3>
      <p className="text-xs text-[#6C7A87] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-[#1E3F5A] hover:bg-[#12283A] rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Không thể tải dữ liệu trang phục',
  message,
  onRetry,
}) => {
  return (
    <div className="p-5 bg-[#FBEFEF] rounded-2xl border border-[#B93826]/30 max-w-lg mx-auto my-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#B93826] shrink-0 border border-[#B93826]/20">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-heritage-display text-sm font-bold text-[#8E2516]">
            {title}
          </h4>
          <p className="text-xs text-[#78261A] mt-1 leading-relaxed">
            {message}
          </p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[#B93826] hover:bg-[#8E2516] rounded-lg transition-colors cursor-pointer"
            >
              Thử lại ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
