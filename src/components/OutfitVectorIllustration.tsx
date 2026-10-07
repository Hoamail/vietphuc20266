import React, { useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { POTTERY_SILK_PALETTES, getTrangPhucById } from '../data/kb';

/**
 * QUY ƯỚC HƯỚNG HÌNH MINH HOẠ (THỐNG NHẤT):
 * - Hình vẽ thể hiện người mặc đứng nhìn thẳng về phía người xem (trục đối xứng ngang tại x = 120 trên viewBox 240x280).
 * - BÊN PHẢI NGƯỜI MẶC nằm ở BÊN TRÁI HÌNH (x < 120).
 * - BÊN TRÁI NGƯỜI MẶC nằm ở BÊN PHẢI HÌNH (x > 120).
 */

export interface SVGComponentProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  colorSchemeId?: string;
  selectedAccessoryIds?: string[];
  remixLevel?: 1 | 2 | 3;
}

type AccessorySlot = 'dau' | 'co' | 'tay' | 'mat' | 'chan';

type AccessoryShapeId =
  | 'khan_quan'
  | 'non_la'
  | 'non_quai_thao'
  | 'mu_tai_beo'
  | 'tram_cai'
  | 'quat_giay'
  | 'khan_ran'
  | 'kinh_ram'
  | 'guoc_moc'
  | 'giay_da'
  | 'sneaker'
  | 'giay_bup_be';

interface AccessoryShapeItem {
  shape: AccessoryShapeId;
  slot: AccessorySlot;
  label: string;
}

interface AccessoryMappingEntry {
  status: 'draw' | 'already_shown' | 'no_illustration';
  isModern?: boolean;
  items?: AccessoryShapeItem[];
  extraNote?: string;
  title: string;
}

const ACCESSORY_SHAPE_LABELS: Record<AccessoryShapeId, string> = {
  khan_quan: 'Khăn vấn / khăn đóng',
  non_la: 'Nón lá',
  non_quai_thao: 'Nón quai thao',
  mu_tai_beo: 'Mũ tai bèo',
  tram_cai: 'Trâm cài tóc',
  quat_giay: 'Quạt giấy cầm tay',
  khan_ran: 'Khăn rằn Nam Bộ',
  kinh_ram: 'Kính râm retro',
  guoc_moc: 'Guốc mộc',
  giay_da: 'Giày da / Boots',
  sneaker: 'Giày sneaker',
  giay_bup_be: 'Giày búp bê',
};

// Bảng ánh xạ phụ kiện theo đúng ID mục từ getAccessoriesForGarment (KHÔNG khớp từ khoá)
const ACCESSORY_TABLE: Record<string, AccessoryMappingEntry> = {
  // 1. ao_ngu_than_tay_chen
  'pk-ao_ngu_than_tay_chen-0': {
    status: 'already_shown',
    title: 'Quần vải màu trắng, ống rộng',
  },
  'gy-ao_ngu_than_tay_chen-1': {
    status: 'draw',
    title: 'Khăn đóng / khăn vành rây & Guốc mộc',
    items: [
      { shape: 'khan_quan', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.khan_quan },
      { shape: 'guoc_moc', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.guoc_moc },
    ],
  },
  'gy-ao_ngu_than_tay_chen-2': {
    status: 'draw',
    isModern: true,
    title: 'Giày da / giày thể thao mộc mạc',
    items: [{ shape: 'giay_da', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.giay_da }],
  },

  // 2. ao_tac
  'pk-ao_tac-0': {
    status: 'draw',
    title: 'Nam giới: Khăn vấn, khăn đóng',
    items: [{ shape: 'khan_quan', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.khan_quan }],
  },
  'pk-ao_tac-1': {
    status: 'draw',
    title: 'Nữ giới: Khăn vấn',
    extraNote: 'chưa có minh hoạ mũ phượng',
    items: [{ shape: 'khan_quan', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.khan_quan }],
  },
  'pk-ao_tac-2': {
    status: 'already_shown',
    title: 'Quần thụng màu trắng rộng',
  },
  'gy-ao_tac-1': {
    status: 'draw',
    title: 'Khăn xếp (khăn đóng)',
    items: [{ shape: 'khan_quan', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.khan_quan }],
  },
  'gy-ao_tac-2': {
    status: 'draw',
    isModern: true,
    title: 'Giày da Oxford/Chelsea boots & Kính râm retro',
    items: [
      { shape: 'giay_da', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.giay_da },
      { shape: 'kinh_ram', slot: 'mat', label: ACCESSORY_SHAPE_LABELS.kinh_ram },
    ],
  },

  // 3. ao_giao_linh
  'pk-ao_giao_linh-0': {
    status: 'already_shown',
    title: 'Quần dài mặc lót trong',
  },
  'pk-ao_giao_linh-1': {
    status: 'already_shown',
    title: 'Lớp thường (váy quây)',
  },
  'pk-ao_giao_linh-2': {
    status: 'already_shown',
    title: 'Đai thắt ngang eo',
  },
  'gy-ao_giao_linh-1': {
    status: 'draw',
    title: 'Trâm cài tóc & Quạt giấy cầm tay',
    items: [
      { shape: 'tram_cai', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.tram_cai },
      { shape: 'quat_giay', slot: 'tay', label: ACCESSORY_SHAPE_LABELS.quat_giay },
    ],
  },
  'gy-ao_giao_linh-2': {
    status: 'draw',
    isModern: true,
    title: 'Giày boots da cổ thấp',
    items: [{ shape: 'giay_da', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.giay_da }],
  },

  // 4. ao_tu_than
  'gy-ao_tu_than-1': {
    status: 'draw',
    title: 'Nón quai thao',
    items: [{ shape: 'non_quai_thao', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.non_quai_thao }],
  },
  'gy-ao_tu_than-2': {
    status: 'no_illustration',
    isModern: true,
    title: 'Chân váy xếp ly hiện đại / quần ống loe',
  },

  // 5. ao_dai_tan_thoi
  'pk-ao_dai_tan_thoi-0': {
    status: 'already_shown',
    title: 'Quần dài trắng',
  },
  'gy-ao_dai_tan_thoi-1': {
    status: 'draw',
    title: 'Nón lá truyền thống',
    items: [{ shape: 'non_la', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.non_la }],
  },
  'gy-ao_dai_tan_thoi-2': {
    status: 'draw',
    isModern: true,
    title: 'Giày sneaker hiện đại',
    items: [{ shape: 'sneaker', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.sneaker }],
  },

  // 6. ao_ba_ba
  'pk-ao_ba_ba-0': {
    status: 'already_shown',
    title: 'Quần lụa đen ống rộng',
  },
  'pk-ao_ba_ba-1': {
    status: 'draw',
    title: 'Khăn rằn & Mũ tai bèo',
    items: [
      { shape: 'khan_ran', slot: 'co', label: ACCESSORY_SHAPE_LABELS.khan_ran },
      { shape: 'mu_tai_beo', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.mu_tai_beo },
    ],
  },
  'gy-ao_ba_ba-1': {
    status: 'draw',
    title: 'Khăn rằn & Nón lá',
    items: [
      { shape: 'khan_ran', slot: 'co', label: ACCESSORY_SHAPE_LABELS.khan_ran },
      { shape: 'non_la', slot: 'dau', label: ACCESSORY_SHAPE_LABELS.non_la },
    ],
  },
  'gy-ao_ba_ba-2': {
    status: 'draw',
    isModern: true,
    title: 'Giày búp bê trơn',
    items: [{ shape: 'giay_bup_be', slot: 'chan', label: ACCESSORY_SHAPE_LABELS.giay_bup_be }],
  },
};

interface DefaultGarmentColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  circleFill: string;
  circleStroke: string;
  borderHex: string;
}

const DEFAULT_GARMENT_COLORS: Record<string, DefaultGarmentColors> = {
  ao_ngu_than_tay_chen: {
    primary: '#1E3F5A',
    secondary: '#EBF0F5',
    accent: '#C88E1B',
    bg: '#F9F7F2',
    circleFill: '#F4EFE6',
    circleStroke: '#E5DEC9',
    borderHex: '#E8E2D8',
  },
  ao_tac: {
    primary: '#B93826',
    secondary: '#FDF1EC',
    accent: '#C88E1B',
    bg: '#FAF6F2',
    circleFill: '#F5EFE8',
    circleStroke: '#E6DACD',
    borderHex: '#E8DFD5',
  },
  ao_giao_linh: {
    primary: '#2E6254',
    secondary: '#E7F2ED',
    accent: '#D4A017',
    bg: '#F3F8F5',
    circleFill: '#EBF4F0',
    circleStroke: '#D3E5DC',
    borderHex: '#DFEAE4',
  },
  ao_tu_than: {
    primary: '#7A4D2B',
    secondary: '#F5EDE4',
    accent: '#E5B14B',
    bg: '#FAF7F2',
    circleFill: '#F4EFE6',
    circleStroke: '#E5DEC9',
    borderHex: '#EAE2D5',
  },
  ao_dai_tan_thoi: {
    primary: '#9C2A3B',
    secondary: '#FCECEF',
    accent: '#C88E1B',
    bg: '#FAF4F4',
    circleFill: '#F6ECEC',
    circleStroke: '#E5D1D1',
    borderHex: '#EBDCDC',
  },
  ao_ba_ba: {
    primary: '#4A3B32',
    secondary: '#EDE7DD',
    accent: '#FDFBF7',
    bg: '#F6F4F1',
    circleFill: '#EFECE6',
    circleStroke: '#DCD5CC',
    borderHex: '#E3DED8',
  },
};

const OUTFIT_CAPTIONS: Record<string, string> = {
  ao_ngu_than_tay_chen: 'CỔ ĐỨNG · 5 CÚC CÀI BÊN PHẢI · TAY CHẼN',
  ao_tac: 'TAY THỤNG CHỮ NHẬT RỘNG · CỔ ĐỨNG 4CM',
  ao_giao_linh: 'CỔ CHÉO CHỮ V · VẠT TRÁI ĐÈ PHẢI · ĐAI THẮT',
  ao_tu_than: 'ĐƯỜNG SỐNG LƯNG · HAI VẠT THẮT NÚT · ÁO YẾM',
  ao_dai_tan_thoi: 'TAY RAGLAN · CÚC BẤM SƯỜN · 2 TÀ XẺ EO',
  ao_ba_ba: 'CỔ TRÒN · HÀNG CÚC DỌC GIỮA · DÀI NGANG HÔNG',
};

interface ResolvedSlotWinner {
  shape: AccessoryShapeId;
  slot: AccessorySlot;
  label: string;
  isAppSuggestion: boolean;
  sourceId: string;
}

interface ResolvedAccessoryState {
  winners: ResolvedSlotWinner[];
  overriddenLabels: string[];
  alreadyShownLabels: string[];
  noIllustrationLabels: string[];
  extraNotes: string[];
  hasBlockedModernInTraditional: boolean;
  hasAppSuggestion: boolean;
}

function resolveAccessories(
  selectedIds: string[] | undefined,
  remixLevel: 1 | 2 | 3 | undefined
): ResolvedAccessoryState {
  const state: ResolvedAccessoryState = {
    winners: [],
    overriddenLabels: [],
    alreadyShownLabels: [],
    noIllustrationLabels: [],
    extraNotes: [],
    hasBlockedModernInTraditional: false,
    hasAppSuggestion: false,
  };

  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return state;
  }

  const slotMap = new Map<AccessorySlot, ResolvedSlotWinner>();
  const effectiveLevel = remixLevel ?? 2;

  for (const rawId of selectedIds) {
    const isGy = rawId.startsWith('gy-');
    const isModernId = isGy && rawId.endsWith('-2');
    const entry = ACCESSORY_TABLE[rawId];

    if (isModernId && effectiveLevel === 1) {
      state.hasBlockedModernInTraditional = true;
      continue;
    }

    if (!entry) {
      state.noIllustrationLabels.push('Chưa có minh hoạ cho mục này');
      continue;
    }

    if (entry.extraNote && !state.extraNotes.includes(entry.extraNote)) {
      state.extraNotes.push(entry.extraNote);
    }

    if (entry.status === 'already_shown') {
      if (!state.alreadyShownLabels.includes(entry.title)) {
        state.alreadyShownLabels.push(entry.title);
      }
      continue;
    }

    if (entry.status === 'no_illustration' || !entry.items || entry.items.length === 0) {
      const msg = `Chưa có minh hoạ cho mục này (${entry.title})`;
      if (!state.noIllustrationLabels.includes(msg)) {
        state.noIllustrationLabels.push(msg);
      }
      continue;
    }

    for (const item of entry.items) {
      const existing = slotMap.get(item.slot);
      if (existing && existing.shape !== item.shape) {
        if (!state.overriddenLabels.includes(existing.label)) {
          state.overriddenLabels.push(existing.label);
        }
      }
      slotMap.set(item.slot, {
        shape: item.shape,
        slot: item.slot,
        label: item.label,
        isAppSuggestion: isGy,
        sourceId: rawId,
      });
    }
  }

  state.winners = Array.from(slotMap.values());
  state.hasAppSuggestion = state.winners.some((w) => w.isAppSuggestion);
  return state;
}

/**
 * Hình nộm tối giản trung tính (đầu-cổ và bàn chân, không mặt, không giới tính) làm điểm neo
 */
const NeutralMannequinAnchor: React.FC = () => (
  <g aria-hidden="true" className="opacity-75">
    {/* Đầu và cổ trung tính */}
    <circle cx="120" cy="28" r="13" fill="#F3EDE2" stroke="#B8ADA0" strokeWidth="1.3" />
    <path d="M115 41 L115 52 L125 52 L125 41" fill="#F3EDE2" stroke="#B8ADA0" strokeWidth="1.2" />
    {/* Hai bàn chân neo dưới ống quần */}
    <ellipse cx="97" cy="262" rx="11" ry="4.5" fill="#EDE6D8" stroke="#B8ADA0" strokeWidth="1.2" />
    <ellipse cx="143" cy="262" rx="11" ry="4.5" fill="#EDE6D8" stroke="#B8ADA0" strokeWidth="1.2" />
  </g>
);

/**
 * Vẽ từng hình phụ kiện trong thư viện SVG tối giản
 * - Mục "gy-": viền nét đứt kèm biểu tượng nhỏ ✦
 * - Mục "pk-": nét liền
 */
const AccessorySvgShape: React.FC<{ winner: ResolvedSlotWinner }> = ({ winner }) => {
  const dashProps = winner.isAppSuggestion ? { strokeDasharray: '3 1.5' } : {};
  const strokeMain = '#1E3F5A';

  const renderBadgeDot = (x: number, y: number) =>
    winner.isAppSuggestion ? (
      <g aria-hidden="true">
        <circle cx={x} cy={y} r="4.5" fill="#FDF9F0" stroke="#C88E1B" strokeWidth="1" />
        <path
          d={`M${x} ${y - 2.5} L${x + 0.8} ${y - 0.8} L${x + 2.5} ${y} L${x + 0.8} ${y + 0.8} L${x} ${y + 2.5} L${x - 0.8} ${y + 0.8} L${x - 2.5} ${y} L${x - 0.8} ${y - 0.8} Z`}
          fill="#C88E1B"
        />
      </g>
    ) : null;

  switch (winner.shape) {
    case 'khan_quan':
      return (
        <g>
          {/* Khăn đóng / khăn vấn xếp nếp chữ nhân */}
          <path
            d="M103 24 C103 13 137 13 137 24 L135 29 C125 26 115 26 105 29 Z"
            style={{ fill: 'var(--vp-primary)', stroke: '#161A1D' }}
            strokeWidth="1.5"
            {...dashProps}
          />
          <path d="M108 20 L120 26 L132 20" stroke="#FAF8F5" strokeWidth="1.1" />
          <path d="M112 16 L120 22 L128 16" stroke="#FAF8F5" strokeWidth="1" />
          {renderBadgeDot(141, 16)}
        </g>
      );

    case 'non_la':
      return (
        <g>
          {/* Nón lá chóp nhọn thanh thoát */}
          <path
            d="M84 27 L120 5 L156 27 Q120 32 84 27 Z"
            fill="#F6EBD8"
            stroke="#8B6B43"
            strokeWidth="1.5"
            {...dashProps}
          />
          <line x1="96" y1="20" x2="144" y2="20" stroke="#C5B08E" strokeWidth="1" />
          <line x1="106" y1="13" x2="134" y2="13" stroke="#C5B08E" strokeWidth="1" />
          <path d="M108 28 Q120 42 132 28" stroke="#B93826" strokeWidth="1.1" strokeDasharray="2 1.5" />
          {renderBadgeDot(156, 14)}
        </g>
      );

    case 'non_quai_thao':
      return (
        <g>
          {/* Nón quai thao mặt bằng rộng truyền thống Bắc Bộ */}
          <rect
            x="76"
            y="11"
            width="88"
            height="8"
            rx="3"
            fill="#EBD9BE"
            stroke="#7A4D2B"
            strokeWidth="1.5"
            {...dashProps}
          />
          <rect x="104" y="19" width="32" height="5" rx="1.5" fill="#C8B08F" stroke="#7A4D2B" strokeWidth="1.2" />
          <path d="M98 19 Q120 45 142 19" stroke="#C88E1B" strokeWidth="1.3" fill="none" />
          <circle cx="98" cy="25" r="2" fill="#B93826" />
          <circle cx="142" cy="25" r="2" fill="#B93826" />
          {renderBadgeDot(168, 12)}
        </g>
      );

    case 'mu_tai_beo':
      return (
        <g>
          {/* Mũ tai bèo vành lượn sóng mềm */}
          <path
            d="M104 22 C104 12 136 12 136 22 Z"
            fill="#5C6F58"
            stroke="#2E3B2B"
            strokeWidth="1.4"
            {...dashProps}
          />
          <path
            d="M92 23 Q106 19 120 23 Q134 27 148 23 Q136 28 120 27 Q104 28 92 23 Z"
            fill="#6D8268"
            stroke="#2E3B2B"
            strokeWidth="1.4"
            {...dashProps}
          />
          {renderBadgeDot(150, 14)}
        </g>
      );

    case 'tram_cai':
      return (
        <g>
          {/* Búi tóc cao và trâm cài ngang */}
          <ellipse cx="120" cy="14" rx="9" ry="5.5" fill="#2C2623" stroke="#161A1D" strokeWidth="1.2" />
          <line
            x1="96"
            y1="14"
            x2="144"
            y2="12"
            stroke="#C88E1B"
            strokeWidth="2"
            strokeLinecap="round"
            {...dashProps}
          />
          <circle cx="145" cy="12" r="3" fill="#B93826" stroke="#C88E1B" strokeWidth="1" />
          <path d="M145 15 L145 23" stroke="#C88E1B" strokeWidth="1.1" strokeDasharray="1.5 1" />
          {renderBadgeDot(154, 10)}
        </g>
      );

    case 'quat_giay':
      return (
        <g>
          {/* Quạt giấy xoè cầm tay bên phải hình */}
          <path
            d="M182 146 L162 118 A28 28 0 0 1 202 120 Z"
            fill="#FAF3E3"
            stroke={strokeMain}
            strokeWidth="1.5"
            {...dashProps}
          />
          <line x1="182" y1="146" x2="172" y2="115" stroke="#B89B72" strokeWidth="1" />
          <line x1="182" y1="146" x2="182" y2="113" stroke="#B89B72" strokeWidth="1" />
          <line x1="182" y1="146" x2="192" y2="115" stroke="#B89B72" strokeWidth="1" />
          {renderBadgeDot(205, 114)}
        </g>
      );

    case 'khan_ran':
      return (
        <g>
          {/* Khăn rằn Nam Bộ vắt quanh cổ */}
          <path
            d="M102 68 Q120 82 138 68 L143 78 Q120 92 97 78 Z"
            fill="#FFFFFF"
            stroke="#161A1D"
            strokeWidth="1.3"
            strokeDasharray="3 1.5"
          />
          <path
            d="M102 74 L98 112 L107 112 L109 78 Z"
            fill="#FFFFFF"
            stroke="#161A1D"
            strokeWidth="1.3"
            strokeDasharray="3 1.5"
          />
          <path
            d="M138 74 L142 108 L133 108 L131 78 Z"
            fill="#FFFFFF"
            stroke="#161A1D"
            strokeWidth="1.3"
            strokeDasharray="3 1.5"
          />
          <line x1="99" y1="106" x2="106" y2="106" stroke="#B93826" strokeWidth="1.5" />
          <line x1="134" y1="102" x2="141" y2="102" stroke="#B93826" strokeWidth="1.5" />
          {renderBadgeDot(148, 72)}
        </g>
      );

    case 'kinh_ram':
      return (
        <g>
          {/* Kính râm retro gọng tròn thanh lịch */}
          <circle
            cx="114"
            cy="28"
            r="4.2"
            fill="#1E252B"
            stroke="#C88E1B"
            strokeWidth="1.3"
            {...dashProps}
          />
          <circle
            cx="126"
            cy="28"
            r="4.2"
            fill="#1E252B"
            stroke="#C88E1B"
            strokeWidth="1.3"
            {...dashProps}
          />
          <line x1="118" y1="28" x2="122" y2="28" stroke="#C88E1B" strokeWidth="1.3" />
          <line x1="107" y1="27" x2="110" y2="28" stroke="#C88E1B" strokeWidth="1.2" />
          <line x1="130" y1="28" x2="133" y2="27" stroke="#C88E1B" strokeWidth="1.2" />
          {renderBadgeDot(139, 25)}
        </g>
      );

    case 'guoc_moc':
      return (
        <g>
          {/* Đôi guốc mộc đế gỗ quai ngang */}
          <rect
            x="84"
            y="260"
            width="24"
            height="6"
            rx="2"
            fill="#C69C6D"
            stroke="#5C3A21"
            strokeWidth="1.4"
            {...dashProps}
          />
          <path d="M88 260 Q96 253 104 260" fill="none" stroke="#161A1D" strokeWidth="2" />
          <rect
            x="132"
            y="260"
            width="24"
            height="6"
            rx="2"
            fill="#C69C6D"
            stroke="#5C3A21"
            strokeWidth="1.4"
            {...dashProps}
          />
          <path d="M136 260 Q144 253 152 260" fill="none" stroke="#161A1D" strokeWidth="2" />
          {renderBadgeDot(162, 258)}
        </g>
      );

    case 'giay_da':
      return (
        <g>
          {/* Giày da / Boots cổ thấp */}
          <path
            d="M83 255 L107 255 L109 265 L81 265 Q80 260 83 255 Z"
            fill="#3B271E"
            stroke="#161A1D"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="81" y1="265" x2="109" y2="265" stroke="#8B5A2B" strokeWidth="2" />
          <path
            d="M133 255 L157 255 L159 265 L131 265 Q130 260 133 255 Z"
            fill="#3B271E"
            stroke="#161A1D"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="131" y1="265" x2="159" y2="265" stroke="#8B5A2B" strokeWidth="2" />
          {renderBadgeDot(165, 258)}
        </g>
      );

    case 'sneaker':
      return (
        <g>
          {/* Giày sneaker đế trắng năng động */}
          <path
            d="M82 256 L108 256 L110 264 L80 264 Z"
            fill="#FFFFFF"
            stroke="#1E3F5A"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="80" y1="264" x2="110" y2="264" stroke="#B93826" strokeWidth="2" />
          <line x1="88" y1="259" x2="102" y2="261" stroke="#1E3F5A" strokeWidth="1.2" />
          <path
            d="M132 256 L158 256 L160 264 L130 264 Z"
            fill="#FFFFFF"
            stroke="#1E3F5A"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="130" y1="264" x2="160" y2="264" stroke="#B93826" strokeWidth="2" />
          <line x1="138" y1="261" x2="152" y2="259" stroke="#1E3F5A" strokeWidth="1.2" />
          {renderBadgeDot(166, 258)}
        </g>
      );

    case 'giay_bup_be':
      return (
        <g>
          {/* Giày búp bê mũi tròn quai mảnh */}
          <path
            d="M84 260 Q96 266 108 260 L107 265 L85 265 Z"
            fill="#5C3A2E"
            stroke="#2B1810"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="89" y1="259" x2="103" y2="259" stroke="#2B1810" strokeWidth="1.1" />
          <path
            d="M132 260 Q144 266 156 260 L155 265 L133 265 Z"
            fill="#5C3A2E"
            stroke="#2B1810"
            strokeWidth="1.4"
            {...dashProps}
          />
          <line x1="137" y1="259" x2="151" y2="259" stroke="#2B1810" strokeWidth="1.1" />
          {renderBadgeDot(162, 258)}
        </g>
      );
  }
};

const AccessoryLayer: React.FC<{ winners: ResolvedSlotWinner[] }> = ({ winners }) => (
  <AnimatePresence>
    {winners.map((w) => (
      <motion.g
        key={`${w.slot}-${w.shape}`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
      >
        <AccessorySvgShape winner={w} />
      </motion.g>
    ))}
  </AnimatePresence>
);

interface GarmentFrameShellProps {
  outfitId: string;
  className?: string;
  colorSchemeId?: string;
  selectedAccessoryIds?: string[];
  remixLevel?: 1 | 2 | 3;
  children: (ctx: {
    patternId: string;
    shadeGradId: string;
    hasCustomPalette: boolean;
    resolvedAcc: ResolvedAccessoryState;
  }) => React.ReactNode;
}

const GarmentFrameShell: React.FC<GarmentFrameShellProps> = ({
  outfitId,
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
  children,
}) => {
  const rawUid = useId().replace(/:/g, '');
  const patternId = `vp-weave-${rawUid}`;
  const shadeGradId = `vp-shade-${rawUid}`;

  const defaultColors =
    DEFAULT_GARMENT_COLORS[outfitId] || DEFAULT_GARMENT_COLORS.ao_ngu_than_tay_chen;

  const hasCustomPalette = Boolean(colorSchemeId);
  const matchedScheme = hasCustomPalette
    ? POTTERY_SILK_PALETTES.find((p) => p.id === colorSchemeId) || POTTERY_SILK_PALETTES[0]
    : null;

  const vpPrimary = matchedScheme ? matchedScheme.primaryHex : defaultColors.primary;
  const vpSecondary = matchedScheme ? matchedScheme.secondaryHex : defaultColors.secondary;
  const vpAccent = matchedScheme ? matchedScheme.accentHex : defaultColors.accent;
  const vpBg = matchedScheme ? matchedScheme.backgroundHex : defaultColors.bg;

  const resolvedAcc = resolveAccessories(selectedAccessoryIds, remixLevel);

  const outfitInfo = getTrangPhucById(outfitId);
  const outfitName = outfitInfo?.ten || 'Trang phục truyền thống';
  const paletteLabel = matchedScheme ? matchedScheme.name : 'Màu mặc định';
  const shownAccText =
    resolvedAcc.winners.length > 0
      ? resolvedAcc.winners.map((w) => w.label).join(', ')
      : 'không có phụ kiện bổ sung';

  const ariaLabel = `Minh hoạ ${outfitName}, bảng màu ${paletteLabel}, phụ kiện hiển thị: ${shownAccText}`;
  const captionText = OUTFIT_CAPTIONS[outfitId] || OUTFIT_CAPTIONS.ao_ngu_than_tay_chen;
  const hasInteractiveFeedback =
    Array.isArray(selectedAccessoryIds) && selectedAccessoryIds.length > 0;

  const rootStyle = {
    '--vp-primary': vpPrimary,
    '--vp-secondary': vpSecondary,
    '--vp-accent': vpAccent,
    '--vp-bg': vpBg,
    backgroundColor: 'var(--vp-bg)',
    borderColor: hasCustomPalette ? '#DED7C6' : defaultColors.borderHex,
  } as React.CSSProperties;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={rootStyle}
      className={`relative flex flex-col items-center justify-between rounded-xl overflow-hidden p-2 border transition-colors duration-200 motion-reduce:transition-none ${className}`}
    >
      <div className="w-full flex-1 min-h-0 flex items-center justify-center">
        <svg
          viewBox="0 -4 240 278"
          className="w-full h-full max-h-full select-none [&_path]:transition-[fill,stroke] [&_path]:duration-200 motion-reduce:[&_path]:transition-none [&_rect]:transition-[fill,stroke] [&_rect]:duration-200 motion-reduce:[&_rect]:transition-none [&_circle]:transition-[fill,stroke] [&_circle]:duration-200 motion-reduce:[&_circle]:transition-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Hoạ tiết dệt/gốm kỷ hà trừu tượng chung (không rồng/phượng) */}
            <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
              <path
                d="M6 1 L11 6 L6 11 L1 6 Z"
                fill="none"
                style={{ stroke: 'var(--vp-primary)' }}
                strokeWidth="0.5"
                strokeOpacity="0.14"
              />
              <circle
                cx="6"
                cy="6"
                r="0.8"
                style={{ fill: 'var(--vp-accent)' }}
                fillOpacity="0.22"
              />
            </pattern>
            {/* Đổ khối nhẹ tạo chiều sâu tà áo */}
            <linearGradient id={shadeGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Vòng tròn nền trang trí */}
          <circle
            cx="120"
            cy="140"
            r="105"
            style={{
              fill: hasCustomPalette ? 'var(--vp-secondary)' : defaultColors.circleFill,
              stroke: hasCustomPalette ? 'var(--vp-primary)' : defaultColors.circleStroke,
            }}
            fillOpacity={hasCustomPalette ? 0.35 : 1}
            strokeOpacity={hasCustomPalette ? 0.25 : 1}
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Điểm neo hình nộm trung tính (đầu-cổ và bàn chân) */}
          <NeutralMannequinAnchor />

          {/* Nội dung trang phục gốc */}
          {children({ patternId, shadeGradId, hasCustomPalette, resolvedAcc })}

          {/* Lớp phụ kiện động */}
          <AccessoryLayer winners={resolvedAcc.winners} />
        </svg>
      </div>

      {/* Chú thích HTML bên dưới hình (thay cho nhãn chữ trong SVG) */}
      <div className="w-full pt-1 space-y-1 text-center shrink-0">
        <div
          style={{ color: 'var(--vp-primary)' }}
          className="mx-auto inline-block max-w-full truncate rounded border border-[#D5CBB9] bg-white/95 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider shadow-2xs"
        >
          {captionText}
        </div>

        {/* Các dòng phản hồi phụ kiện khi có chọn phụ kiện */}
        {hasInteractiveFeedback && (
          <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] leading-tight">
            {resolvedAcc.hasAppSuggestion && (
              <span className="inline-flex items-center gap-0.5 rounded border border-[#C88E1B]/40 bg-[#FDF9F0] px-1.5 py-0.5 font-medium text-[#8B5A2B]">
                <span>✦</span>
                <span>Gợi ý của app</span>
              </span>
            )}
            {resolvedAcc.hasBlockedModernInTraditional && (
              <span className="inline-flex items-center rounded border border-[#B93826]/30 bg-[#FBEFEF] px-1.5 py-0.5 font-medium text-[#8E2516]">
                Mức Truyền thống không hiển thị gợi ý hiện đại
              </span>
            )}
            {resolvedAcc.overriddenLabels.length > 0 && (
              <span className="inline-flex items-center rounded border border-[#DED7C6] bg-white/90 px-1.5 py-0.5 text-[#52606D]">
                Cũng gợi ý: {resolvedAcc.overriddenLabels.join(', ')}
              </span>
            )}
            {resolvedAcc.alreadyShownLabels.length > 0 && (
              <span className="inline-flex items-center rounded border border-[#2E6254]/30 bg-[#E9F2EE] px-1.5 py-0.5 text-[#2E6254]">
                Đã thể hiện trong hình gốc
              </span>
            )}
            {resolvedAcc.noIllustrationLabels.map((msg, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded border border-[#DED7C6] bg-[#FAF8F5] px-1.5 py-0.5 italic text-[#6C7A87]"
              >
                {msg}
              </span>
            ))}
            {resolvedAcc.extraNotes.map((note, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded border border-[#C88E1B]/30 bg-[#FDF9F0] px-1.5 py-0.5 italic text-[#8B5A2B]"
              >
                ({note})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 1. Áo Ngũ Thân Tay Chẽn
 * Nhận diện: Cổ đứng vuông thấp (2-4cm), 5 cúc cài dọc chéo về bên phải người mặc,
 * ống tay chẽn thuôn nhỏ dần từ nách tới cổ tay, 5 thân vải.
 */
export const AoNguThanIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_ngu_than_tay_chen"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Lớp áo lót trong cổ trắng (áo đơn cốt - cố định) */}
          <path d="M112 56 L120 68 L128 56 Z" fill="#FFFFFF" stroke="#D5CBB9" strokeWidth="1.2" />

          {/* Cổ áo đứng vuông vức (khoảng 2-4cm) */}
          <rect
            x="106"
            y="50"
            width="28"
            height="15"
            rx="2"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
          <line
            x1="120"
            y1="50"
            x2="120"
            y2="65"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* Quần lụa trắng ống rộng bên dưới (GIỮ CỐ ĐỊNH theo KB) */}
          <path d="M88 215 L80 255 L114 255 L116 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
          <path d="M124 215 L126 255 L160 255 L152 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

          {/* Thân áo chính (5 thân vải ghép dọc, dáng chữ V mềm mại) */}
          <path
            d="M84 65 L156 65 L174 215 L66 215 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M84 65 L156 65 L174 215 L66 215 Z" fill={`url(#${patternId})`} />
          <path d="M84 65 L156 65 L174 215 L66 215 Z" fill={`url(#${shadeGradId})`} />

          {/* Vạt cài chéo đè sang phía bên phải người mặc (bên trái hình) */}
          <path
            d="M120 65 Q104 88 98 118 L96 215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Nếp gấp thân con (thân thứ 5 nằm bên trong, phía bên phải người mặc / bên trái hình) */}
          <path
            d="M120 65 L96 95 L96 215"
            style={{ fill: 'var(--vp-primary)' }}
            fillOpacity="0.12"
          />

          {/* 5 Cúc cài kim loại mạ vàng hình chữ quảng bên phải người mặc (bên trái hình) */}
          {/* 1. Cúc cổ */}
          <circle
            cx="118"
            cy="58"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          {/* 2. Cúc dưới vai */}
          <circle
            cx="106"
            cy="78"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          {/* 3. Cúc nách */}
          <circle
            cx="99"
            cy="98"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          {/* 4. Cúc dưới eo 1 */}
          <circle
            cx="97"
            cy="120"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          {/* 5. Cúc dưới eo 2 */}
          <circle
            cx="97"
            cy="142"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* Tay áo Chẽn: thu nhỏ dần từ nách tới cổ tay vừa khít */}
          {/* Tay trái */}
          <path
            d="M84 65 L48 138 L57 142 L95 95 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="48"
            y1="138"
            x2="57"
            y2="142"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />

          {/* Tay phải */}
          <path
            d="M156 65 L192 138 L183 142 L145 95 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="192"
            y1="138"
            x2="183"
            y2="142"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />

          {/* Gấu áo & đường viền chân tà */}
          <line
            x1="66"
            y1="215"
            x2="174"
            y2="215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * 2. Áo Tấc (Áo Thụng)
 * Nhận diện: Ống tay hình chữ nhật dài rộng (30-50cm) buông thẳng, không bó nách,
 * cổ đứng vuông ôm khít (khoảng 4cm), 5 cúc kim loại/đá/gỗ xếp hình chữ quảng.
 */
export const AoTacIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_tac"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Cổ đứng lập lĩnh cao khoảng 4cm */}
          <rect
            x="105"
            y="48"
            width="30"
            height="16"
            rx="2"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
          <line
            x1="120"
            y1="48"
            x2="120"
            y2="64"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="120"
            cy="56"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* Quần thụng màu trắng rộng (GIỮ CỐ ĐỊNH theo KB) */}
          <path d="M88 215 L82 255 L114 255 L116 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
          <path d="M124 215 L126 255 L158 255 L152 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

          {/* Thân áo thụng dáng rộng dài đến gối */}
          <path
            d="M82 64 L158 64 L180 215 L60 215 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M82 64 L158 64 L180 215 L60 215 Z" fill={`url(#${patternId})`} />
          <path d="M82 64 L158 64 L180 215 L60 215 Z" fill={`url(#${shadeGradId})`} />

          {/* Đường cài khuy chéo bên phải người mặc (bên trái hình) */}
          <path
            d="M120 64 Q102 88 96 116 L94 215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />

          {/* 5 Cúc kim loại/gỗ xếp hình chữ quảng bên phải người mặc (bên trái hình) */}
          <circle
            cx="112"
            cy="72"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="102"
            cy="90"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="96"
            cy="112"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="95"
            cy="134"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="95"
            cy="154"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI: Tay áo THỤNG hình chữ nhật dài rộng buông thẳng không bó nách */}
          {/* Ống tay trái rộng 40cm, buông rủ dài */}
          <path
            d="M82 64 L34 104 L34 195 L72 195 L88 115 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Viền cửa tay chữ nhật thẳng */}
          <line
            x1="34"
            y1="195"
            x2="72"
            y2="195"
            style={{ stroke: 'var(--vp-accent)' }}
            strokeWidth="2.5"
          />

          {/* Ống tay phải rộng 40cm, buông rủ dài */}
          <path
            d="M158 64 L206 104 L206 195 L168 195 L152 115 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Viền cửa tay chữ nhật thẳng */}
          <line
            x1="168"
            y1="195"
            x2="206"
            y2="195"
            style={{ stroke: 'var(--vp-accent)' }}
            strokeWidth="2.5"
          />

          <line
            x1="60"
            y1="215"
            x2="180"
            y2="215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * 3. Áo Giao Lĩnh (Tràng Vạt)
 * Nhận diện: Cổ áo khoét chéo hình chữ V trước ngực (vạt trái đè lên vạt phải),
 * không dùng cúc cài mà giữ phom bằng dây buộc và đai thắt lụa ngang eo.
 */
export const AoGiaoLinhIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_giao_linh"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Lớp thường (váy quây che thân dưới - GIỮ CỐ ĐỊNH) */}
          <path d="M78 185 L162 185 L174 255 L66 255 Z" fill="#E2EEE9" stroke="#9ABCB0" strokeWidth="1.5" />

          {/* Thân áo Giao lĩnh dáng dài rộng rãi */}
          <path
            d="M84 56 L156 56 L178 215 L62 215 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M84 56 L156 56 L178 215 L62 215 Z" fill={`url(#${patternId})`} />
          <path d="M84 56 L156 56 L178 215 L62 215 Z" fill={`url(#${shadeGradId})`} />

          {/* Vạt phải người mặc (bên trái hình) nằm bên trong / dưới (đường nét đứt nhẹ) */}
          <path
            d="M98 56 L136 108 L136 215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="3 2"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI: Cổ chéo chữ V - VẠT TRÁI NGƯỜI MẶC (bên phải hình) ĐÈ LÊN VẠT PHẢI (về phía bên trái hình) */}
          <path
            d="M142 56 L120 108 L80 152 L76 215"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
          {/* Nẹp viền cổ áo giao lĩnh chữ V */}
          <path
            d="M142 56 L120 106 L92 56"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M138 56 L120 102 L96 56" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Tay áo dài thẳng, phom ống rộng vừa phải buông rủ */}
          <path
            d="M84 56 L38 125 L56 160 L86 108 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M156 56 L202 125 L184 160 L154 108 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Đai thắt lụa ngang eo (không dùng khuy cúc) */}
          <rect
            x="74"
            y="142"
            width="92"
            height="12"
            rx="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.5"
          />
          {/* Hai dải lụa thùy rủ xuống */}
          <path
            d="M112 154 L108 205 L118 205 L120 154 Z"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <path
            d="M120 154 L122 198 L130 198 L126 154 Z"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            fillOpacity="0.85"
            strokeWidth="1"
          />

          <line
            x1="62"
            y1="215"
            x2="178"
            y2="215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * 4. Áo Tứ Thân
 * Nhận diện: Áo khoác ngoài 4 thân có đường sống lưng ở giữa, cổ rất thấp,
 * hai vạt trước buông thõng hoặc thắt nút ở bụng, lộ lớp áo Yếm đào lót trong, váy đụp đen xòe.
 */
export const AoTuThanIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_tu_than"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Váy đụp xòe đen truyền thống (GIỮ CỐ ĐỊNH) */}
          <path d="M76 150 L164 150 L184 255 L56 255 Z" fill="#252422" stroke="#161514" strokeWidth="1.8" />

          {/* Lớp áo Yếm đào lót trong (GIỮ CỐ ĐỊNH) */}
          <path d="M106 68 L134 68 L144 140 L96 140 Z" fill="#D9534F" stroke="#9C2A26" strokeWidth="1.4" />
          <path d="M112 68 Q120 74 128 68" stroke="#9C2A26" strokeWidth="1.2" />

          {/* Dải yếm thắt eo */}
          <rect
            x="94"
            y="136"
            width="52"
            height="8"
            rx="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI: Thân sau ghép từ 2 mảnh với ĐƯỜNG NỐI SỐNG LƯNG */}
          <path
            d="M88 64 L152 64 L164 215 L76 215 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M88 64 L152 64 L164 215 L76 215 Z" fill={`url(#${patternId})`} />
          <path d="M88 64 L152 64 L164 215 L76 215 Z" fill={`url(#${shadeGradId})`} />

          {/* Đường sống lưng rõ ràng giữa thân sau */}
          <line
            x1="120"
            y1="64"
            x2="120"
            y2="215"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />

          {/* Hai vạt trước mở dọc từ trên xuống và thắt nút ở bụng */}
          {/* Vạt trước trái */}
          <path
            d="M88 64 L80 148 L114 152 L98 72 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.6"
          />
          {/* Vạt trước phải */}
          <path
            d="M152 64 L160 148 L126 152 L142 72 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.6"
          />

          {/* Nút thắt hai vạt trước tại bụng */}
          <ellipse
            cx="120"
            cy="154"
            rx="8"
            ry="6"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.5"
          />
          {/* Hai dải vạt thắt rủ xuống tự nhiên */}
          <path
            d="M116 158 L108 215 L116 215 L120 160 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.4"
          />
          <path
            d="M124 158 L132 215 L124 215 L120 160 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.4"
          />

          {/* Tay áo chẽn */}
          <path
            d="M88 64 L52 130 L60 134 L96 90 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M152 64 L188 130 L180 134 L144 90 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * 5. Áo dài hiện đại
 * Nhận diện: Dáng áo ôm sát thon thả, cổ đứng cao kín đáo, đường ráp chéo tay Raglan,
 * hàng cúc bấm vai phải người mặc (bên trái hình), hai tà dài xẻ hai bên hông từ eo, quần dài trắng.
 */
export const AoDaiTanThoiIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_dai_tan_thoi"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Quần lụa dài trắng ống suông rộng (GIỮ CỐ ĐỊNH theo KB) */}
          <path d="M96 130 L84 255 L114 255 L118 130 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
          <path d="M122 130 L126 255 L156 255 L144 130 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

          {/* Dáng Áo Dài: ÔM EO, 2 TÀ DÀI CHẤM GÓT */}
          {/* Tà trước thon gọn xẻ hai bên eo */}
          <path
            d="M102 54 L138 54 Q146 100 144 128 L152 240 L88 240 L96 128 Q94 100 102 54 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M102 54 L138 54 Q146 100 144 128 L152 240 L88 240 L96 128 Q94 100 102 54 Z"
            fill={`url(#${patternId})`}
          />
          <path
            d="M102 54 L138 54 Q146 100 144 128 L152 240 L88 240 L96 128 Q94 100 102 54 Z"
            fill={`url(#${shadeGradId})`}
          />

          {/* Cổ áo đứng cao kín cổ (Áo Lê Phổ) */}
          <rect
            x="110"
            y="44"
            width="20"
            height="14"
            rx="2"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 1: Đường ráp chéo tay RAGLAN từ cổ xuống nách */}
          <line
            x1="110"
            y1="54"
            x2="88"
            y2="85"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.6"
            strokeDasharray="3 2"
          />
          <line
            x1="130"
            y1="54"
            x2="152"
            y2="85"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.6"
            strokeDasharray="3 2"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 2: Hàng cúc bấm kim loại chạy từ cổ sang vai phải người mặc (bên trái hình) và dọc bên sườn */}
          <circle
            cx="118"
            cy="51"
            r="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <circle
            cx="112"
            cy="62"
            r="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <circle
            cx="103"
            cy="74"
            r="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <circle
            cx="98"
            cy="92"
            r="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <circle
            cx="96"
            cy="112"
            r="2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />
          <circle
            cx="96"
            cy="128"
            r="2.2"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 3: Điểm xẻ tà cao ở hai bên hông từ eo xuống */}
          <path d="M96 128 L88 240" style={{ stroke: 'var(--vp-primary)' }} strokeWidth="1.8" />
          <path d="M144 128 L152 240" style={{ stroke: 'var(--vp-primary)' }} strokeWidth="1.8" />
          <circle cx="96" cy="128" r="2" style={{ fill: 'var(--vp-primary)' }} />
          <circle cx="144" cy="128" r="2" style={{ fill: 'var(--vp-primary)' }} />

          {/* Tay áo ôm dài thon thả */}
          <path
            d="M93 64 L56 142 L65 145 L94 92 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M147 64 L184 142 L175 145 L146 92 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * 6. Áo Bà Ba
 * Nhận diện: Áo ngang hông hoặc dài hơn, thân ôm nhẹ, cổ tròn hoặc cổ đứng thấp,
 * hàng cúc dọc cài chính giữa thân trước, xẻ tà ở hông, mặc cùng quần lụa đen rộng.
 */
export const AoBaBaIllustration: React.FC<SVGComponentProps> = ({
  className = '',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  return (
    <GarmentFrameShell
      outfitId="ao_ba_ba"
      className={className}
      colorSchemeId={colorSchemeId}
      selectedAccessoryIds={selectedAccessoryIds}
      remixLevel={remixLevel}
    >
      {({ patternId, shadeGradId }) => (
        <>
          {/* Quần lụa đen ống rộng Nam Bộ (GIỮ CỐ ĐỊNH theo KB) */}
          <path d="M88 152 L76 255 L114 255 L118 152 Z" fill="#1C1B19" stroke="#0D0C0A" strokeWidth="1.5" />
          <path d="M122 152 L126 255 L164 255 L152 152 Z" fill="#1C1B19" stroke="#0D0C0A" strokeWidth="1.5" />

          {/* Dáng Áo Bà Ba: Dài ngang hông, chít eo nhẹ */}
          <path
            d="M88 64 L152 64 Q158 110 162 165 L78 165 Q82 110 88 64 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M88 64 L152 64 Q158 110 162 165 L78 165 Q82 110 88 64 Z"
            fill={`url(#${patternId})`}
          />
          <path
            d="M88 64 L152 64 Q158 110 162 165 L78 165 Q82 110 88 64 Z"
            fill={`url(#${shadeGradId})`}
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 1: Cổ áo tròn nhẹ nhàng, thanh thoát */}
          <path
            d="M106 64 Q120 78 134 64"
            style={{ fill: 'var(--vp-bg)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 2: HÀNG CÚC DỌC CHÍNH GIỮA THÂN TRƯỚC */}
          <line
            x1="120"
            y1="74"
            x2="120"
            y2="165"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="1.5"
          />
          <circle
            cx="120"
            cy="85"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="120"
            cy="102"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="120"
            cy="119"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="120"
            cy="136"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <circle
            cx="120"
            cy="153"
            r="2.8"
            style={{ fill: 'var(--vp-accent)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* ĐẶC ĐIỂM CỐT LÕI 3: Xẻ tà ngắn ở hai bên hông */}
          <line
            x1="82"
            y1="148"
            x2="82"
            y2="165"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="2"
          />
          <line
            x1="158"
            y1="148"
            x2="158"
            y2="165"
            style={{ stroke: 'var(--vp-primary)' }}
            strokeWidth="2"
          />

          {/* Hai túi nhỏ tiện dụng phía trước (theo đặc trưng dân dã) */}
          <rect
            x="92"
            y="138"
            width="18"
            height="18"
            rx="2"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />
          <rect
            x="130"
            y="138"
            width="18"
            height="18"
            rx="2"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.2"
          />

          {/* Tay áo dài */}
          <path
            d="M88 64 L50 138 L60 142 L94 92 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M152 64 L190 138 L180 142 L146 92 Z"
            style={{ fill: 'var(--vp-secondary)', stroke: 'var(--vp-primary)' }}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Khăn rằn đã được tách khỏi lớp cố định, chỉ bật khi chọn pk-ao_ba_ba-1 hoặc gy-ao_ba_ba-1 */}
        </>
      )}
    </GarmentFrameShell>
  );
};

/**
 * Master Dispatcher Component
 */
export const OutfitVectorIllustration: React.FC<{
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  colorSchemeId?: string;
  selectedAccessoryIds?: string[];
  remixLevel?: 1 | 2 | 3;
}> = ({
  id,
  className = '',
  size = 'md',
  colorSchemeId,
  selectedAccessoryIds,
  remixLevel,
}) => {
  const sizeClasses = {
    sm: 'w-full h-36',
    md: 'w-full h-56',
    lg: 'w-full h-80',
  }[size];

  const sharedProps: SVGComponentProps = {
    className: `${sizeClasses} ${className}`,
    size,
    colorSchemeId,
    selectedAccessoryIds,
    remixLevel,
  };

  switch (id) {
    case 'ao_ngu_than_tay_chen':
      return <AoNguThanIllustration {...sharedProps} />;

    case 'ao_tac':
      return <AoTacIllustration {...sharedProps} />;

    case 'ao_giao_linh':
      return <AoGiaoLinhIllustration {...sharedProps} />;

    case 'ao_tu_than':
      return <AoTuThanIllustration {...sharedProps} />;

    case 'ao_dai_tan_thoi':
      return <AoDaiTanThoiIllustration {...sharedProps} />;

    case 'ao_ba_ba':
      return <AoBaBaIllustration {...sharedProps} />;

    default:
      return <AoNguThanIllustration {...sharedProps} />;
  }
};
