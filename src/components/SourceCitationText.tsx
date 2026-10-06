import React from 'react';
import { KBNguonMap } from '../types/kb';
import { KB_NGUON, getLoaiNguonLabel } from '../data/kb';

interface SourceCitationTextProps {
  text: string;
  sourceMap?: KBNguonMap;
  onSelectSource?: (code: string) => void;
  className?: string;
}

export const formatNoSourceText = (text: string): string => {
  if (!text || text.trim() === '') return 'Chưa có nguồn';
  return text.replace(/Chưa có nguồn xác nhận(\s+trong các trích đoạn)?/gi, 'Chưa có nguồn');
};

export const SourceCitationText: React.FC<SourceCitationTextProps> = ({
  text,
  sourceMap = KB_NGUON,
  onSelectSource,
  className = '',
}) => {
  if (!text || text.trim() === '') {
    return <span className="text-[#8E7E6B] italic">Chưa có nguồn</span>;
  }

  // Replace phrases containing "Chưa có nguồn xác nhận" with "Chưa có nguồn"
  const sanitizedText = formatNoSourceText(text);

  // Match pattern like [VOV, SOI] or [BB] or [GN, VHVN]
  const regex = /\[([A-Za-z0-9,\s]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sanitizedText)) !== null) {
    const preText = sanitizedText.substring(lastIndex, match.index);
    if (preText) {
      parts.push(<span key={`text-${lastIndex}`}>{preText}</span>);
    }

    const citationGroup = match[1];
    const codes = citationGroup.split(',').map((c) => c.trim()).filter(Boolean);

    parts.push(
      <span key={`group-${match.index}`} className="inline-flex items-center gap-1 mx-1 align-baseline">
        {codes.map((code) => {
          const sourceInfo = sourceMap[code];
          const chipTitle = sourceInfo
            ? `${sourceInfo.ten} (${getLoaiNguonLabel(sourceInfo.loai)})`
            : `Nguồn: ${code}`;

          if (!onSelectSource) {
            return (
              <span
                key={`chip-${code}-${match!.index}`}
                title={chipTitle}
                className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-[#EBF2F7] text-[#1E3F5A] border border-[#1E3F5A]/25"
              >
                [{code}]
              </span>
            );
          }

          return (
            <button
              type="button"
              key={`chip-${code}-${match!.index}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSource(code);
              }}
              title={chipTitle}
              className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-[#EBF2F7] text-[#1E3F5A] border border-[#1E3F5A]/25 hover:bg-[#1E3F5A] hover:text-white transition-colors cursor-pointer"
            >
              [{code}]
            </button>
          );
        })}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < sanitizedText.length) {
    parts.push(<span key={`text-${lastIndex}`}>{sanitizedText.substring(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
};
