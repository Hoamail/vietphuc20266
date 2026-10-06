import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load single source of truth KB (src/data/kb-v3.json)
const kbPath = path.resolve(__dirname, 'src/data/kb-v3.json');
const kbRaw = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
const kbOutfitsMap = new Map<string, any>();
const kbSourcesMap = new Map<string, { ten: string; url: string; loai: string }>();
const kbAccessoriesMap = new Map<string, Map<string, { name: string; isAppSuggestion: boolean }>>();

if (kbRaw && typeof kbRaw.nguon === 'object' && kbRaw.nguon !== null) {
  for (const [code, src] of Object.entries(kbRaw.nguon)) {
    if (src && typeof src === 'object') {
      const s = src as any;
      kbSourcesMap.set(code, {
        ten: typeof s.ten === 'string' ? s.ten : code,
        url: typeof s.url === 'string' ? s.url : '',
        loai: typeof s.loai === 'string' ? s.loai : 'chua_xac_dinh',
      });
    }
  }
}

if (Array.isArray(kbRaw.trang_phuc)) {
  for (const item of kbRaw.trang_phuc) {
    if (item && typeof item.id === 'string') {
      kbOutfitsMap.set(item.id, item);

      const accMap = new Map<string, { name: string; isAppSuggestion: boolean }>();
      if (Array.isArray(item.phu_kien)) {
        item.phu_kien.forEach((pk: unknown, idx: number) => {
          if (typeof pk === 'string' && pk.trim()) {
            accMap.set(`pk-${item.id}-${idx}`, {
              name: pk.trim(),
              isAppSuggestion: false,
            });
          }
        });
      }
      if (Array.isArray(item.goi_y_phoi_do)) {
        item.goi_y_phoi_do.forEach((gy: any, idx: number) => {
          if (
            gy &&
            (gy.loai === 'phu_kien' || gy.loai === 'phoi_hien_dai') &&
            typeof gy.noi_dung === 'string'
          ) {
            accMap.set(`gy-${item.id}-${idx}`, {
              name: gy.noi_dung.trim(),
              isAppSuggestion: true,
            });
          }
        });
      }
      kbAccessoriesMap.set(item.id, accMap);
    }
  }
}

// Load single source of truth for contexts (src/data/boi-canh.json)
const boiCanhPath = path.resolve(__dirname, 'src/data/boi-canh.json');
const boiCanhRaw = JSON.parse(fs.readFileSync(boiCanhPath, 'utf-8'));
const boiCanhMap = new Map<string, any>();

if (Array.isArray(boiCanhRaw)) {
  for (const bc of boiCanhRaw) {
    if (bc && typeof bc.id === 'string') {
      boiCanhMap.set(bc.id, bc);
    }
  }
}

const ALLOWED_REMIX_LEVELS = new Map<number, string>([
  [1, 'Cấp độ 1 - Truyền thống (bảo tồn phom dáng, cấu trúc cổ áo, hàng cúc và nẹp thân theo tư liệu)'],
  [2, 'Cấp độ 2 - Cách tân nhẹ (giữ phom dáng cơ bản, tinh giản nhẹ cho nhu cầu di chuyển)'],
  [3, 'Cấp độ 3 - Remix streetwear (ứng dụng phong cách đương đại linh hoạt, tôn trọng kết cấu nhận diện)'],
]);

const ALLOWED_COLOR_SCHEMES = new Map<string, string>([
  ['men-lam-chu-dau', 'Men Lam & Trắng Gốm (Gợi ý của app, không phải sự thật lịch sử)'],
  ['men-ngoc-celadon', 'Men Ngọc Celadon (Gợi ý của app, không phải sự thật lịch sử)'],
  ['dat-nung-chu-sa', 'Chu Sa & Đất Nung (Gợi ý của app, không phải sự thật lịch sử)'],
  ['men-ran-sa-thach', 'Men Rạn Sa Thạch (Gợi ý của app, không phải sự thật lịch sử)'],
  ['to-tam-hoang-yen', 'Tơ Tằm Hoàng Yến (Gợi ý của app, không phải sự thật lịch sử)'],
  ['lanh-my-a-black', 'Lãnh Mỹ A Đen Tuyển (Gợi ý của app, không phải sự thật lịch sử)'],
]);

const ALLOWED_SEASONS = new Map<string, string>([
  ['xuan', 'Mùa Xuân'],
  ['ha', 'Mùa Hạ'],
  ['thu', 'Mùa Thu'],
  ['dong', 'Mùa Đông'],
]);

const ALLOWED_TEMPERATURES = new Map<string, string>([
  ['mat_me', 'Mát mẻ dễ chịu'],
  ['nong_am', 'Nắng ấm / Nóng'],
  ['se_lanh', 'Se lạnh / Lạnh'],
]);

const ALLOWED_TIMES_OF_DAY = new Map<string, string>([
  ['buoi_sang', 'Buổi sáng'],
  ['buoi_chieu', 'Buổi chiều'],
  ['buoi_toi', 'Buổi tối'],
]);

const ALLOWED_GEMINI_MODELS = new Set<string>([
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
]);
const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

function resolveGeminiModel(): string {
  const envModel = (process.env.GEMINI_MODEL || '').trim();
  if (envModel && ALLOWED_GEMINI_MODELS.has(envModel)) {
    return envModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

// Per-IP Rate Limiter (20 requests per minute) & Daily Cap (default 400)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const DAILY_CAP = (() => {
  const parsed = parseInt(process.env.DAILY_CAP || '400', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 400;
})();
const MAX_STRING_LENGTH = 300;
const MAX_ACCESSORY_COUNT = 10;
const STYLE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in-process cache
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes expiration for token
const GEMINI_TIMEOUT_MS = 30 * 1000; // 30 seconds timeout

const ipRateLimits = new Map<string, { count: number; resetAt: number }>();
let dailyUsage = {
  dateKey: new Date().toISOString().slice(0, 10),
  count: 0,
};

interface PhuongAnCore {
  ten: string;
  mo_ta: string;
  thanh_phan: string[];
  ly_do_van_hoa: string;
  ma_nguon: string | null;
  goi_y_cua_app: string[];
}

interface GuardianCoreResult {
  danh_gia: 'hai_hoa' | 'can_luu_y' | 'de_sai_lech';
  muc_chac_chan: 'cao' | 'trung_binh' | 'thap';
  diem_hai_hoa_mau: number | null;
  ly_do: string;
  loai_ly_do: 'lich_su' | 'thong_le' | 'tham_my' | 'chua_du_can_cu' | 'nguyen_tac_app';
  ma_nguon: string | null;
  goi_y_sua: string | null;
}

const styleCache = new Map<string, { phuongAn: PhuongAnCore[]; expiresAt: number }>();
const guardianCache = new Map<string, { result: GuardianCoreResult; expiresAt: number }>();

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (ipRateLimits.size > 2000) {
    for (const [key, entry] of ipRateLimits.entries()) {
      if (now >= entry.resetAt) {
        ipRateLimits.delete(key);
      }
    }
  }

  const current = ipRateLimits.get(ip);
  if (!current || now >= current.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function checkDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsage.dateKey !== today) {
    dailyUsage = { dateKey: today, count: 0 };
  }
  return dailyUsage.count < DAILY_CAP;
}

function incrementDailyCap(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsage.dateKey !== today) {
    dailyUsage = { dateKey: today, count: 1 };
  } else {
    dailyUsage.count += 1;
  }
}

// Deterministic JSON canonicalization with sorted keys
function canonicalizeJson(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(value).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    const val = value[key];
    if (val !== undefined) {
      parts.push(`${JSON.stringify(key)}:${canonicalizeJson(val)}`);
    }
  }
  return '{' + parts.join(',') + '}';
}

function signPhuongAnToken(
  apiKey: string,
  validatedInput: Record<string, any>,
  phuongAn: PhuongAnCore,
  exp: number
): string {
  const hmacKey = crypto.createHash('sha256').update('vpr:' + apiKey).digest();
  const payload = canonicalizeJson({
    input: validatedInput,
    phuong_an: phuongAn,
    exp,
  });
  return crypto.createHmac('sha256', hmacKey).update(payload).digest('hex');
}

function isSameOriginRequest(req: express.Request): boolean {
  const secFetchSite = req.headers['sec-fetch-site'];
  if (typeof secFetchSite === 'string' && secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>();
  const host = req.headers.host;
  if (typeof host === 'string' && host.length > 0 && host.length <= MAX_STRING_LENGTH) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }

  if (process.env.APP_URL) {
    try {
      allowedOrigins.add(new URL(process.env.APP_URL).origin);
    } catch {
      // Ignore invalid APP_URL format
    }
  }

  return allowedOrigins.has(origin);
}

function isValidShortString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0 && val.length <= MAX_STRING_LENGTH;
}

const STYLIST_SYSTEM_INSTRUCTION = [
  'Bạn là Stylist tư vấn phối trang phục truyền thống Việt Nam của ứng dụng Việt Phục Remix.',
  'RÀNG BUỘC BẤT BIẾN (BẮT BUỘC TUÂN THỦ):',
  '1. Nguồn sự thật duy nhất là phần DỮ LIỆU được cung cấp trong prompt (từ kb-v3.json và boi-canh.json). Không tự thêm, đổi hay suy diễn thông tin lịch sử, văn hoá hay quy tắc ứng xử ngoài DỮ LIỆU; nếu thông tin không có trong DỮ LIỆU thì ghi rõ "Chưa có nguồn".',
  '2. Mức chắc chắn chỉ có 3 giá trị: cao / trung_binh / thap. KHÔNG hiển thị số phần trăm (%) về độ chắc chắn hay độ tin cậy ở bất kỳ đâu.',
  '3. Mọi lời khuyên phối đồ ứng dụng hoặc thông lệ ứng xử không dùng các từ tuyệt đối ("tuyệt đối", "bắt buộc", "luôn"). Mỗi dòng trong mảng goi_y_cua_app phải bắt đầu bằng "Gợi ý của app:".',
  '4. Không dùng thuật ngữ "hữu nhậm" hoặc "tả nhậm"; nếu mô tả chiều vạt áo thì diễn đạt bằng hình thức (ví dụ: vạt trái phủ ngoài vạt phải).',
  '5. Tạo từ 2 đến 3 phương án phối đồ (phuong_an) phù hợp với trang phục, bối cảnh, mức độ cách tân, bảng màu, phụ kiện và điều kiện thời tiết đã chọn.',
  '6. Trường ma_nguon của mỗi phương án CHỈ được nhận đúng 1 mã nguồn có trong DỮ LIỆU (ví dụ mã nguồn KB như "S01" hoặc mã nguồn bối cảnh như "BC-di_chua_noi_ton_nghiem-1"), hoặc null nếu không có nguồn trực tiếp.',
].join('\n');

const STYLIST_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    phuong_an: {
      type: Type.ARRAY,
      description: 'Danh sách từ 2 đến 3 phương án phối đồ.',
      items: {
        type: Type.OBJECT,
        properties: {
          ten: {
            type: Type.STRING,
            description: 'Tên phương án phối đồ ngắn gọn, rõ ràng.',
          },
          mo_ta: {
            type: Type.STRING,
            description: 'Mô tả tổng thể cách phối theo bối cảnh, mức cách tân và điều kiện thời tiết.',
          },
          thanh_phan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các thành phần cụ thể của phương án (trang phục chính, màu sắc, phụ kiện đi kèm).',
          },
          ly_do_van_hoa: {
            type: Type.STRING,
            description: 'Lý giải sự phù hợp dựa trên dữ liệu KB và lưu ý bối cảnh; không tự suy diễn ngoài dữ liệu, nếu không có nguồn thì ghi "Chưa có nguồn".',
          },
          ma_nguon: {
            type: Type.STRING,
            nullable: true,
            description: 'Một mã nguồn hợp lệ có trong DỮ LIỆU (mã KB như S01 hoặc mã bối cảnh BC-...) hoặc null.',
          },
          goi_y_cua_app: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Các gợi ý phối đồ thực tế của ứng dụng, mỗi dòng bắt đầu bằng "Gợi ý của app:".',
          },
        },
        required: ['ten', 'mo_ta', 'thanh_phan', 'ly_do_van_hoa', 'ma_nguon', 'goi_y_cua_app'],
      },
    },
  },
  required: ['phuong_an'],
};

function sanitizeTextConstraints(text: string): string {
  return text
    .replace(/hữu nhậm/gi, 'vạt trái phủ ngoài vạt phải')
    .replace(/tả nhậm/gi, 'vạt phải phủ ngoài vạt trái')
    .replace(/\b\d+(?:[.,]\d+)?\s*%/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeSuggestionLine(line: string): string {
  let cleaned = sanitizeTextConstraints(line)
    .replace(/\btuyệt đối\b/gi, 'nên')
    .replace(/\bbắt buộc\b/gi, 'khuyến khích')
    .replace(/\bluôn luôn\b/gi, 'thường')
    .replace(/\bluôn\b/gi, 'thường')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned.startsWith('Gợi ý của app:')) {
    cleaned = cleaned.replace(/^Gợi ý của app\s*[-–—:]?\s*/i, '');
    cleaned = `Gợi ý của app: ${cleaned}`;
  }
  return cleaned;
}

const GUARDIAN_SYSTEM_INSTRUCTION = [
  'Bạn là Cultural Guardian (Bảo Chứng Văn Hoá) của ứng dụng Việt Phục Remix, chịu trách nhiệm thẩm định tính hài hoà, chuẩn mực và bảo chứng văn hoá của từng phương án phối đồ truyền thống Việt Nam.',
  'RÀNG BUỘC BẤT BIẾN (BẮT BUỘC TUÂN THỦ):',
  '1. Nguồn sự thật duy nhất là phần DỮ LIỆU được cung cấp trong prompt (từ kb-v3.json và boi-canh.json). Không tự thêm, đổi hay suy diễn thông tin lịch sử, văn hoá hay quy tắc ứng xử ngoài DỮ LIỆU; nếu thông tin không có trong DỮ LIỆU thì ghi rõ "Chưa có nguồn".',
  '2. Mức chắc chắn chỉ có 3 giá trị: cao / trung_binh / thap. KHÔNG hiển thị số phần trăm (%) về độ chắc chắn hay độ tin cậy ở bất kỳ đâu.',
  '3. Mọi lời khuyên phối đồ ứng dụng hoặc thông lệ ứng xử không dùng các từ tuyệt đối ("tuyệt đối", "bắt buộc", "luôn").',
  '4. Không dùng thuật ngữ "hữu nhậm" hoặc "tả nhậm"; nếu mô tả chiều vạt áo thì diễn đạt bằng hình thức (ví dụ: vạt trái phủ ngoài vạt phải).',
  '5. Phân loại đánh giá (danh_gia):',
  '   - hai_hoa: Bản phối tôn trọng cấu trúc cốt lõi của trang phục, màu sắc và phụ kiện phù hợp tinh thần bối cảnh.',
  '   - can_luu_y: Bản phối có điểm cần lưu ý về bối cảnh (như nơi tôn nghiêm), điều kiện thời tiết hoặc thông lệ ứng xử, nhưng chưa làm sai lệch cấu trúc cổ áo hay vạt áo.',
  '   - de_sai_lech: Bản phối vi phạm điều không nên khi remix từ KB (như thay đổi kết cấu nhận diện cốt lõi) hoặc vi phạm nghiêm trọng tính tôn nghiêm của bối cảnh.',
  '6. Trường ma_nguon CHỈ được nhận đúng 1 mã nguồn có trong DỮ LIỆU (ví dụ mã KB như S01 hoặc mã bối cảnh như BC-di_chua_noi_ton_nghiem-1), hoặc null nếu không có nguồn trực tiếp.',
  '7. diem_hai_hoa_mau: điểm hài hoà màu sắc từ 1 đến 10 (số nguyên), hoặc null nếu không đánh giá được.',
  '8. loai_ly_do: chọn đúng 1 trong 5 loại: lich_su, thong_le, tham_my, chua_du_can_cu, nguyen_tac_app.',
].join('\n');

const GUARDIAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    danh_gia: {
      type: Type.STRING,
      enum: ['hai_hoa', 'can_luu_y', 'de_sai_lech'],
      description: 'Đánh giá bảo chứng văn hoá: hai_hoa (Hài hoà), can_luu_y (Cần lưu ý), de_sai_lech (Dễ sai lệch văn hoá).',
    },
    muc_chac_chan: {
      type: Type.STRING,
      enum: ['cao', 'trung_binh', 'thap'],
      description: 'Mức chắc chắn của đánh giá: cao, trung_binh, hoặc thap. Tuyệt đối không dùng số phần trăm.',
    },
    diem_hai_hoa_mau: {
      type: Type.INTEGER,
      nullable: true,
      description: 'Điểm hài hoà màu sắc từ 1 đến 10 dựa trên bối cảnh và chất liệu, hoặc null nếu không đủ căn cứ.',
    },
    ly_do: {
      type: Type.STRING,
      description: 'Lý do đánh giá cụ thể dựa trên DỮ LIỆU. Không tự suy diễn; không có trong dữ liệu ghi "Chưa có nguồn".',
    },
    loai_ly_do: {
      type: Type.STRING,
      enum: ['lich_su', 'thong_le', 'tham_my', 'chua_du_can_cu', 'nguyen_tac_app'],
      description: 'Phân loại loại lý do: lich_su (Lịch sử), thong_le (Thông lệ, không phải quy định), tham_my (Gợi ý thẩm mỹ), chua_du_can_cu (Chưa đủ căn cứ), nguyen_tac_app (Nguyên tắc của app).',
    },
    ma_nguon: {
      type: Type.STRING,
      nullable: true,
      description: 'Một mã nguồn duy nhất hợp lệ có trong DỮ LIỆU (mã KB như S01 hoặc mã bối cảnh như BC-...) hoặc null.',
    },
    goi_y_sua: {
      type: Type.STRING,
      nullable: true,
      description: 'Gợi ý điều chỉnh nếu cần để phương án chuẩn mực hoặc đẹp hơn, không dùng từ tuyệt đối.',
    },
  },
  required: ['danh_gia', 'muc_chac_chan', 'ly_do', 'loai_ly_do', 'ma_nguon'],
};

function sanitizeGuardianResult(
  raw: any,
  allowedSourceCodes: Set<string>
): GuardianCoreResult {
  let danhGia: 'hai_hoa' | 'can_luu_y' | 'de_sai_lech' = 'can_luu_y';
  if (raw?.danh_gia === 'hai_hoa' || raw?.danh_gia === 'de_sai_lech') {
    danhGia = raw.danh_gia;
  }

  let mucChacChan: 'cao' | 'trung_binh' | 'thap' = 'trung_binh';
  if (raw?.muc_chac_chan === 'cao' || raw?.muc_chac_chan === 'thap') {
    mucChacChan = raw.muc_chac_chan;
  }

  const validLoai = new Set(['lich_su', 'thong_le', 'tham_my', 'chua_du_can_cu', 'nguyen_tac_app']);
  const loaiLyDo: 'lich_su' | 'thong_le' | 'tham_my' | 'chua_du_can_cu' | 'nguyen_tac_app' =
    validLoai.has(raw?.loai_ly_do) ? raw.loai_ly_do : 'thong_le';

  let rawLyDo = typeof raw?.ly_do === 'string' && raw.ly_do.trim() ? raw.ly_do : 'Chưa có nguồn';
  let lyDo = sanitizeTextConstraints(
    rawLyDo
      .replace(/\btuyệt đối\b/gi, 'nên')
      .replace(/\bbắt buộc\b/gi, 'khuyến khích')
      .replace(/\bluôn luôn\b/gi, 'thường')
      .replace(/\bluôn\b/gi, 'thường')
  );

  let maNguon: string | null = null;
  if (typeof raw?.ma_nguon === 'string' && raw.ma_nguon.trim()) {
    const candidate = raw.ma_nguon.trim().replace(/^\[|\]$/g, '');
    if (allowedSourceCodes.has(candidate)) {
      maNguon = candidate;
    }
  }

  let diemHaiHoaMau: number | null = null;
  if (
    typeof raw?.diem_hai_hoa_mau === 'number' &&
    Number.isInteger(raw.diem_hai_hoa_mau) &&
    raw.diem_hai_hoa_mau >= 1 &&
    raw.diem_hai_hoa_mau <= 10
  ) {
    diemHaiHoaMau = raw.diem_hai_hoa_mau;
  }

  let goiYSua: string | null = null;
  if (typeof raw?.goi_y_sua === 'string' && raw.goi_y_sua.trim()) {
    goiYSua = sanitizeTextConstraints(
      raw.goi_y_sua
        .replace(/\btuyệt đối\b/gi, 'nên')
        .replace(/\bbắt buộc\b/gi, 'khuyến khích')
        .replace(/\bluôn luôn\b/gi, 'thường')
        .replace(/\bluôn\b/gi, 'thường')
    );
  }

  return {
    danh_gia: danhGia,
    muc_chac_chan: mucChacChan,
    diem_hai_hoa_mau: diemHaiHoaMau,
    ly_do: lyDo,
    loai_ly_do: loaiLyDo,
    ma_nguon: maNguon,
    goi_y_sua: goiYSua,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.set('trust proxy', 1);

  // Same-origin enforcement for API routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Vary', 'Origin');

    if (!isSameOriginRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (yêu cầu khác nguồn bị từ chối).',
      });
    }

    const origin = req.headers.origin;
    if (typeof origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // Strict 100kb JSON body limit
  app.use(express.json({ limit: '100kb', strict: true }));

  // Handle body parser errors (413 Payload Too Large / 400 Invalid JSON)
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      const status = err.type === 'entity.too.large' ? 413 : 400;
      return res.status(status).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message:
          status === 413
            ? 'Chưa kiểm tra được (kích thước dữ liệu vượt quá giới hạn 100KB).'
            : 'Chưa kiểm tra được (định dạng JSON không hợp lệ).',
      });
    }
    next();
  });

  // Helper to resolve current API key and Gemini client dynamically
  function getGeminiContext(): { apiKey: string; hasValidKey: boolean; ai: GoogleGenAI | null } {
    const currentKey = (process.env.GEMINI_API_KEY || '').trim();
    const valid = Boolean(currentKey && currentKey !== 'MY_GEMINI_API_KEY');
    const client = valid
      ? new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        })
      : null;
    return { apiKey: currentKey, hasValidKey: valid, ai: client };
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    const { hasValidKey } = getGeminiContext();
    res.json({
      status: 'ok',
      hasServerKey: hasValidKey,
      model: resolveGeminiModel(),
    });
  });

  // B4: Stylist structured output endpoint
  app.post('/api/style', async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const rateStatus = checkIpRateLimit(clientIp);
    if (!rateStatus.allowed) {
      res.setHeader('Retry-After', String(rateStatus.retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (vượt quá giới hạn 20 yêu cầu/phút, vui lòng thử lại sau).',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (dữ liệu đầu vào không hợp lệ).',
      });
    }

    // Validate top-level keys and string lengths
    const allowedTopKeys = new Set([
      'outfitId',
      'purposeId',
      'remixLevel',
      'colorSchemeId',
      'selectedAccessoryIds',
      'weather',
    ]);
    for (const [key, value] of Object.entries(req.body)) {
      if (!allowedTopKeys.has(key)) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (trường dữ liệu không nằm trong danh mục cho phép).',
        });
      }
      if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (độ dài chuỗi vượt quá 300 ký tự).',
        });
      }
    }

    const {
      outfitId,
      purposeId,
      remixLevel,
      colorSchemeId,
      selectedAccessoryIds,
      weather,
    } = req.body;

    // 1. Validate outfitId against KB-v3
    if (!isValidShortString(outfitId) || !kbOutfitsMap.has(outfitId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (outfitId không tồn tại trong KB-v3).',
      });
    }
    const kbOutfit = kbOutfitsMap.get(outfitId);

    // 2. Validate purposeId against boi-canh.json
    if (!isValidShortString(purposeId) || !boiCanhMap.has(purposeId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (purposeId không tồn tại trong boi-canh.json).',
      });
    }
    const kbBoiCanh = boiCanhMap.get(purposeId);

    // 3. Validate remixLevel (1 | 2 | 3)
    if (
      typeof remixLevel !== 'number' ||
      !Number.isInteger(remixLevel) ||
      !ALLOWED_REMIX_LEVELS.has(remixLevel)
    ) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (remixLevel chỉ nhận số nguyên 1, 2 hoặc 3).',
      });
    }

    // 4. Validate colorSchemeId
    if (!isValidShortString(colorSchemeId) || !ALLOWED_COLOR_SCHEMES.has(colorSchemeId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (colorSchemeId không nằm trong danh mục cho phép).',
      });
    }

    // 5. Validate selectedAccessoryIds against the selected outfit in KB-v3
    if (!Array.isArray(selectedAccessoryIds) || selectedAccessoryIds.length > MAX_ACCESSORY_COUNT) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (selectedAccessoryIds phải là mảng hợp lệ).',
      });
    }
    const outfitAccMap = kbAccessoriesMap.get(outfitId) || new Map();
    const validatedAccessoryIds: string[] = [];
    const selectedAccessoryDescriptions: string[] = [];

    for (const accId of selectedAccessoryIds) {
      if (!isValidShortString(accId) || !outfitAccMap.has(accId)) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (mã phụ kiện không thuộc trang phục đã chọn).',
        });
      }
      if (!validatedAccessoryIds.includes(accId)) {
        validatedAccessoryIds.push(accId);
        const accInfo = outfitAccMap.get(accId)!;
        selectedAccessoryDescriptions.push(
          accInfo.isAppSuggestion
            ? `${accInfo.name} [Gợi ý của app, không phải sự thật lịch sử]`
            : `${accInfo.name} [Tư liệu KB-v3]`
        );
      }
    }

    // 6. Validate weather object { season, temperature, timeOfDay }
    if (
      !weather ||
      typeof weather !== 'object' ||
      Array.isArray(weather) ||
      !isValidShortString(weather.season) ||
      !ALLOWED_SEASONS.has(weather.season) ||
      !isValidShortString(weather.temperature) ||
      !ALLOWED_TEMPERATURES.has(weather.temperature) ||
      !isValidShortString(weather.timeOfDay) ||
      !ALLOWED_TIMES_OF_DAY.has(weather.timeOfDay)
    ) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (weather không đúng cấu trúc hoặc giá trị cho phép).',
      });
    }

    const validatedInput = {
      outfitId,
      purposeId,
      remixLevel,
      colorSchemeId,
      selectedAccessoryIds: [...validatedAccessoryIds].sort(),
      weather: {
        season: weather.season,
        temperature: weather.temperature,
        timeOfDay: weather.timeOfDay,
      },
    };

    const { apiKey, hasValidKey, ai } = getGeminiContext();

    // Ensure API key is configured
    if (!hasValidKey || !ai) {
      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason: 'missing_key',
        message: 'Chưa kiểm tra được',
      });
    }

    // Check 10-minute in-process cache by validated ID combination
    const cacheKey = canonicalizeJson(validatedInput);
    const now = Date.now();
    const cachedEntry = styleCache.get(cacheKey);
    if (cachedEntry && now < cachedEntry.expiresAt) {
      const exp = now + TOKEN_TTL_MS;
      const signedPhuongAn = cachedEntry.phuongAn.map((pa) => ({
        ...pa,
        exp,
        token: signPhuongAnToken(apiKey, validatedInput, pa, exp),
      }));
      return res.json({
        success: true,
        phuong_an: signedPhuongAn,
      });
    }

    // Check Daily Cap before invoking Gemini API
    if (!checkDailyCap()) {
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Hệ thống đã đạt giới hạn hôm nay',
      });
    }

    // Build allowed source codes set (KB sources + BC-<id_boi_canh>-<n> sources)
    const allowedSourceCodes = new Set<string>();
    const kbSourceLines: string[] = [];
    if (Array.isArray(kbOutfit.nguon)) {
      for (const code of kbOutfit.nguon) {
        if (typeof code === 'string' && code.trim()) {
          const cleanCode = code.trim();
          allowedSourceCodes.add(cleanCode);
          const srcInfo = kbSourcesMap.get(cleanCode);
          kbSourceLines.push(
            srcInfo
              ? `- Mã [${cleanCode}]: ${srcInfo.ten} (Loại: ${srcInfo.loai})`
              : `- Mã [${cleanCode}]: Chưa có nguồn`
          );
        }
      }
    }
    for (const code of kbSourcesMap.keys()) {
      allowedSourceCodes.add(code);
    }

    const bcSourceLines: string[] = [];
    const bcNguonArray: string[] = Array.isArray(kbBoiCanh.nguon) ? kbBoiCanh.nguon : [];
    bcNguonArray.forEach((url: string, idx: number) => {
      const bcCode = `BC-${kbBoiCanh.id}-${idx + 1}`;
      allowedSourceCodes.add(bcCode);
      bcSourceLines.push(`- Mã [${bcCode}]: ${url}`);
    });

    // Format KB goi_y_phoi_do (marked as app suggestion)
    const kbGoiYLines = Array.isArray(kbOutfit.goi_y_phoi_do)
      ? kbOutfit.goi_y_phoi_do.map(
          (gy: any) =>
            `- [Gợi ý của app, không phải sự thật lịch sử] (${gy.loai || 'goi_y'}): ${gy.noi_dung}${
              gy.ghi_chu ? ` — Ghi chú: ${gy.ghi_chu}` : ''
            }`
        )
      : [];

    // Format KB khong_nen_khi_remix
    const kbKhongNenLines = Array.isArray(kbOutfit.khong_nen_khi_remix)
      ? kbOutfit.khong_nen_khi_remix.map((w: any) =>
          typeof w === 'string' ? `- ${w}` : `- ${w?.noi_dung || ''} (Căn cứ: ${w?.can_cu || 'Chưa có nguồn'})`
        )
      : [];

    // Format Context nen_uu_tien (marked as app suggestion without source)
    const bcNenUuTienLines = Array.isArray(kbBoiCanh.nen_uu_tien)
      ? kbBoiCanh.nen_uu_tien.map(
          (item: any) =>
            `- Trang phục ${item.trang_phuc_id}: ${item.ly_do} [Gợi ý của app, chưa có nguồn]`
        )
      : [];

    // Format Context luu_y with mapped BC-<id>-<n> codes from nguon_chi_so
    const bcLuuYLines = Array.isArray(kbBoiCanh.luu_y)
      ? kbBoiCanh.luu_y.map((ly: any) => {
          const loaiText =
            ly.loai === 'thong_le_ung_xu' ? 'Thông lệ ứng xử (không phải quy định)' : 'Gợi ý thẩm mỹ';
          const mappedCodes = Array.isArray(ly.nguon_chi_so)
            ? ly.nguon_chi_so
                .filter((i: unknown) => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < bcNguonArray.length)
                .map((i: number) => `BC-${kbBoiCanh.id}-${i + 1}`)
            : [];
          const codeLabel = mappedCodes.length > 0 ? mappedCodes.join(', ') : 'Chưa có nguồn';
          return `- [${loaiText}] ${ly.noi_dung} (Mã nguồn bối cảnh: ${codeLabel})`;
        })
      : [];

    const dataPrompt = [
      '=== DỮ LIỆU TRANG PHỤC TỪ KB-v3 ===',
      `- Mã trang phục: ${kbOutfit.id}`,
      `- Tên trang phục: ${kbOutfit.ten}`,
      `- Thời kỳ: ${kbOutfit.thoi_ky || 'Chưa có nguồn'}`,
      `- Mức chắc chắn tư liệu: ${kbOutfit.muc_chac_chan}`,
      '- Bộ phận cấu tạo:',
      `  + Cổ áo: ${kbOutfit.bo_phan?.co || 'Chưa có nguồn'}`,
      `  + Tay áo: ${kbOutfit.bo_phan?.tay || 'Chưa có nguồn'}`,
      `  + Thân áo: ${kbOutfit.bo_phan?.than || 'Chưa có nguồn'}`,
      `  + Vật liệu: ${kbOutfit.bo_phan?.vat_lieu || 'Chưa có nguồn'}`,
      '- Đặc điểm nhận diện hình ảnh:',
      ...(Array.isArray(kbOutfit.dac_diem_nhan_dien_hinh_anh) && kbOutfit.dac_diem_nhan_dien_hinh_anh.length > 0
        ? kbOutfit.dac_diem_nhan_dien_hinh_anh.map((d: string) => `  + ${d}`)
        : ['  + Chưa có nguồn']),
      '- Phụ kiện trong tư liệu KB:',
      ...(Array.isArray(kbOutfit.phu_kien) && kbOutfit.phu_kien.length > 0
        ? kbOutfit.phu_kien.map((p: string) => `  + ${p}`)
        : ['  + Chưa có nguồn']),
      '- Lưu ý không nên khi remix từ KB:',
      ...(kbKhongNenLines.length > 0 ? kbKhongNenLines : ['- Chưa có nguồn']),
      '- Gợi ý phối đồ từ KB (Gợi ý của app, không phải sự thật lịch sử):',
      ...(kbGoiYLines.length > 0 ? kbGoiYLines : ['- Chưa có nguồn']),
      '- Nguồn tư liệu trang phục từ KB:',
      ...(kbSourceLines.length > 0 ? kbSourceLines : ['- Chưa có nguồn']),
      '',
      '=== DỮ LIỆU BỐI CẢNH TỪ boi-canh.json ===',
      `- Mã bối cảnh: ${kbBoiCanh.id}`,
      `- Tên bối cảnh: ${kbBoiCanh.ten}`,
      `- Tinh thần: ${kbBoiCanh.tinh_than}`,
      `- Mức cách tân gợi ý của bối cảnh: ${kbBoiCanh.muc_remix} (${kbBoiCanh.muc_remix_ghi_chu || 'Chưa có nguồn'})`,
      '- Khuyến nghị trang phục ưu tiên (Gợi ý của app, chưa có nguồn):',
      ...(bcNenUuTienLines.length > 0 ? bcNenUuTienLines : ['- Chưa có nguồn']),
      '- Lưu ý của bối cảnh:',
      ...(bcLuuYLines.length > 0 ? bcLuuYLines : ['- Chưa có nguồn']),
      '- Nguồn tham khảo của bối cảnh:',
      ...(bcSourceLines.length > 0 ? bcSourceLines : ['- Chưa có nguồn']),
      '',
      '=== LỰA CHỌN ĐẦU VÀO ĐÃ KIỂM TRA ===',
      `- Trang phục: ${kbOutfit.ten} (${kbOutfit.id})`,
      `- Bối cảnh: ${kbBoiCanh.ten} (${kbBoiCanh.id})`,
      `- Mức độ cách tân người dùng chọn: ${ALLOWED_REMIX_LEVELS.get(remixLevel)}`,
      `- Bảng màu người dùng chọn: ${ALLOWED_COLOR_SCHEMES.get(colorSchemeId)}`,
      `- Phụ kiện người dùng chọn: ${
        selectedAccessoryDescriptions.length > 0
          ? selectedAccessoryDescriptions.join('; ')
          : 'Không chọn phụ kiện'
      }`,
      `- Điều kiện thời tiết & thời điểm: ${ALLOWED_SEASONS.get(weather.season)} · ${ALLOWED_TEMPERATURES.get(
        weather.temperature
      )} · ${ALLOWED_TIMES_OF_DAY.get(weather.timeOfDay)}`,
      '',
      'Hãy trả về JSON đúng theo schema gồm 2 đến 3 phương án phối đồ (phuong_an).',
    ].join('\n');

    incrementDailyCap();

    const modelName = resolveGeminiModel();

    try {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('GEMINI_TIMEOUT'));
        }, GEMINI_TIMEOUT_MS);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: dataPrompt,
          config: {
            systemInstruction: STYLIST_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: STYLIST_RESPONSE_SCHEMA,
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
        }),
        timeoutPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      const rawText = typeof response?.text === 'string' ? response.text.trim() : '';
      if (!rawText) {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: 'empty_response',
          message: 'Chưa kiểm tra được',
        });
      }

      const finishReason = String(response?.candidates?.[0]?.finishReason ?? '');

      // Bỏ hàng rào markdown và chỉ lấy đoạn từ "{" đầu đến "}" cuối
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.slice(startIdx, endIdx + 1);
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch {
        console.log(
          `[Stylist] parse fail model=${modelName} finish=${finishReason} len=${rawText.length} head=${JSON.stringify(
            rawText.slice(0, 150)
          )} tail=${JSON.stringify(rawText.slice(-150))}`
        );
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: finishReason === 'MAX_TOKENS' ? 'bad_json_truncated' : 'bad_json_format',
          message: 'Chưa kiểm tra được',
        });
      }

      if (!parsedJson || !Array.isArray(parsedJson.phuong_an) || parsedJson.phuong_an.length < 2) {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: 'bad_schema',
          message: 'Chưa kiểm tra được',
        });
      }

      const rawList = parsedJson.phuong_an.slice(0, 3);
      const sanitizedList: PhuongAnCore[] = [];

      for (const item of rawList) {
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.ten !== 'string' ||
          !item.ten.trim() ||
          typeof item.mo_ta !== 'string' ||
          !item.mo_ta.trim() ||
          !Array.isArray(item.thanh_phan) ||
          typeof item.ly_do_van_hoa !== 'string' ||
          !item.ly_do_van_hoa.trim() ||
          !Array.isArray(item.goi_y_cua_app)
        ) {
          return res.status(503).json({
            success: false,
            error: 'chua_kiem_tra_duoc',
            reason: 'bad_item',
            message: 'Chưa kiểm tra được',
          });
        }

        const thanhPhan = item.thanh_phan
          .filter((tp: unknown) => typeof tp === 'string' && tp.trim().length > 0)
          .map((tp: string) => sanitizeTextConstraints(tp));

        const goiYCuaApp = item.goi_y_cua_app
          .filter((gy: unknown) => typeof gy === 'string' && gy.trim().length > 0)
          .map((gy: string) => sanitizeSuggestionLine(gy));

        if (thanhPhan.length === 0 || goiYCuaApp.length === 0) {
          return res.status(503).json({
            success: false,
            error: 'chua_kiem_tra_duoc',
            reason: 'bad_item',
            message: 'Chưa kiểm tra được',
          });
        }

        // Rule 1 & 6: ma_nguon must be a valid KB code or BC-<id>-<n> code, otherwise null
        let validMaNguon: string | null = null;
        if (typeof item.ma_nguon === 'string' && item.ma_nguon.trim()) {
          const candidate = item.ma_nguon.trim().replace(/^\[|\]$/g, '');
          if (allowedSourceCodes.has(candidate)) {
            validMaNguon = candidate;
          }
        }

        sanitizedList.push({
          ten: sanitizeTextConstraints(item.ten),
          mo_ta: sanitizeTextConstraints(item.mo_ta),
          thanh_phan: thanhPhan,
          ly_do_van_hoa: sanitizeTextConstraints(item.ly_do_van_hoa),
          ma_nguon: validMaNguon,
          goi_y_cua_app: goiYCuaApp,
        });
      }

      // Store in 10-minute in-process cache (evict expired if map grows)
      if (styleCache.size > 200) {
        const currentTs = Date.now();
        for (const [k, v] of styleCache.entries()) {
          if (currentTs >= v.expiresAt) styleCache.delete(k);
        }
      }
      styleCache.set(cacheKey, {
        phuongAn: sanitizedList,
        expiresAt: Date.now() + STYLE_CACHE_TTL_MS,
      });

      const exp = Date.now() + TOKEN_TTL_MS;
      const signedPhuongAn = sanitizedList.map((pa) => ({
        ...pa,
        exp,
        token: signPhuongAnToken(apiKey, validatedInput, pa, exp),
      }));

      return res.json({
        success: true,
        phuong_an: signedPhuongAn,
      });
    } catch (err: any) {
      const statusNum =
        typeof err?.status === 'number'
          ? err.status
          : typeof err?.code === 'number'
          ? err.code
          : undefined;
      const errMsgRaw = typeof err?.message === 'string' ? err.message : String(err ?? '');
      const safeMsg = errMsgRaw.replace(/[\r\n]+/g, ' ').slice(0, 200);

      // Single-line console.log (no console.warn/console.error, no API key/prompt/user data)
      console.log(`[Stylist Diag] model=${modelName} status=${statusNum ?? 'none'} message=${safeMsg}`);

      let reason = 'unknown';
      if (errMsgRaw === 'GEMINI_TIMEOUT' || err?.name === 'AbortError') {
        reason = 'timeout';
      } else if (statusNum === 404) {
        reason = 'model_not_found';
      } else if (statusNum === 401 || statusNum === 403) {
        reason = 'permission';
      } else if (statusNum === 429) {
        reason = 'quota';
      } else if (typeof statusNum === 'number') {
        reason = `http_${statusNum}`;
      }

      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason,
        message: 'Chưa kiểm tra được',
      });
    }
  });

  // B6: Cultural Guardian endpoint for evaluating each styling option
  app.post('/api/guard', async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const rateStatus = checkIpRateLimit(clientIp);
    if (!rateStatus.allowed) {
      res.setHeader('Retry-After', String(rateStatus.retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (vượt quá giới hạn 20 yêu cầu/phút, vui lòng thử lại sau).',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (dữ liệu đầu vào không hợp lệ).',
      });
    }

    const {
      outfitId,
      purposeId,
      remixLevel,
      colorSchemeId,
      selectedAccessoryIds,
      weather,
      phuong_an: rawPhuongAn,
      phuongAn: altPhuongAn,
      exp,
      token,
    } = req.body;

    const targetPhuongAn = rawPhuongAn || altPhuongAn;

    // Validate exp
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (thiếu hoặc sai định dạng exp).',
      });
    }

    if (Date.now() > exp) {
      return res.status(410).json({
        success: false,
        error: 'phien_da_het',
        message: 'Phiên đã hết, hãy tạo lại gợi ý',
      });
    }

    if (!isValidShortString(token)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (thiếu chữ ký token).',
      });
    }

    // 1. Validate outfitId against KB-v3
    if (!isValidShortString(outfitId) || !kbOutfitsMap.has(outfitId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (outfitId không tồn tại trong KB-v3).',
      });
    }
    const kbOutfit = kbOutfitsMap.get(outfitId);

    // 2. Validate purposeId against boi-canh.json
    if (!isValidShortString(purposeId) || !boiCanhMap.has(purposeId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (purposeId không tồn tại trong boi-canh.json).',
      });
    }
    const kbBoiCanh = boiCanhMap.get(purposeId);

    // 3. Validate remixLevel (1 | 2 | 3)
    if (
      typeof remixLevel !== 'number' ||
      !Number.isInteger(remixLevel) ||
      !ALLOWED_REMIX_LEVELS.has(remixLevel)
    ) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (remixLevel chỉ nhận số nguyên 1, 2 hoặc 3).',
      });
    }

    // 4. Validate colorSchemeId
    if (!isValidShortString(colorSchemeId) || !ALLOWED_COLOR_SCHEMES.has(colorSchemeId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (colorSchemeId không nằm trong danh mục cho phép).',
      });
    }

    // 5. Validate selectedAccessoryIds
    if (!Array.isArray(selectedAccessoryIds) || selectedAccessoryIds.length > MAX_ACCESSORY_COUNT) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (selectedAccessoryIds phải là mảng hợp lệ).',
      });
    }
    const outfitAccMap = kbAccessoriesMap.get(outfitId) || new Map();
    const validatedAccessoryIds: string[] = [];
    const selectedAccessoryDescriptions: string[] = [];

    for (const accId of selectedAccessoryIds) {
      if (!isValidShortString(accId) || !outfitAccMap.has(accId)) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (mã phụ kiện không thuộc trang phục đã chọn).',
        });
      }
      if (!validatedAccessoryIds.includes(accId)) {
        validatedAccessoryIds.push(accId);
        const accInfo = outfitAccMap.get(accId)!;
        selectedAccessoryDescriptions.push(
          accInfo.isAppSuggestion
            ? `${accInfo.name} [Gợi ý của app, không phải sự thật lịch sử]`
            : `${accInfo.name} [Tư liệu KB-v3]`
        );
      }
    }

    // 6. Validate weather
    if (
      !weather ||
      typeof weather !== 'object' ||
      Array.isArray(weather) ||
      !isValidShortString(weather.season) ||
      !ALLOWED_SEASONS.has(weather.season) ||
      !isValidShortString(weather.temperature) ||
      !ALLOWED_TEMPERATURES.has(weather.temperature) ||
      !isValidShortString(weather.timeOfDay) ||
      !ALLOWED_TIMES_OF_DAY.has(weather.timeOfDay)
    ) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (weather không đúng cấu trúc hoặc giá trị cho phép).',
      });
    }

    // 7. Validate targetPhuongAn
    if (!targetPhuongAn || typeof targetPhuongAn !== 'object' || Array.isArray(targetPhuongAn)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (phương án không hợp lệ).',
      });
    }

    const paCore: PhuongAnCore = {
      ten: typeof targetPhuongAn.ten === 'string' ? targetPhuongAn.ten : '',
      mo_ta: typeof targetPhuongAn.mo_ta === 'string' ? targetPhuongAn.mo_ta : '',
      thanh_phan: Array.isArray(targetPhuongAn.thanh_phan)
        ? targetPhuongAn.thanh_phan.filter((x: unknown) => typeof x === 'string')
        : [],
      ly_do_van_hoa: typeof targetPhuongAn.ly_do_van_hoa === 'string' ? targetPhuongAn.ly_do_van_hoa : '',
      ma_nguon: typeof targetPhuongAn.ma_nguon === 'string' ? targetPhuongAn.ma_nguon : null,
      goi_y_cua_app: Array.isArray(targetPhuongAn.goi_y_cua_app)
        ? targetPhuongAn.goi_y_cua_app.filter((x: unknown) => typeof x === 'string')
        : [],
    };

    const validatedInput = {
      outfitId,
      purposeId,
      remixLevel,
      colorSchemeId,
      selectedAccessoryIds: [...validatedAccessoryIds].sort(),
      weather: {
        season: weather.season,
        temperature: weather.temperature,
        timeOfDay: weather.timeOfDay,
      },
    };

    const { apiKey, hasValidKey, ai } = getGeminiContext();

    if (!hasValidKey || !ai) {
      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason: 'missing_key',
        message: 'Chưa kiểm tra được',
      });
    }

    // Verify HMAC Token
    const expectedToken = signPhuongAnToken(apiKey, validatedInput, paCore, exp);
    if (token !== expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'token_khong_hop_le',
        message: 'Chưa kiểm tra được (chữ ký phương án không hợp lệ).',
      });
    }

    // Check in-process cache by token
    const now = Date.now();
    const cachedEntry = guardianCache.get(token);
    if (cachedEntry && now < cachedEntry.expiresAt) {
      return res.json({
        success: true,
        guardian: cachedEntry.result,
      });
    }

    // Check Daily Cap
    if (!checkDailyCap()) {
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Hệ thống đã đạt giới hạn hôm nay',
      });
    }

    // Build allowed source codes
    const allowedSourceCodes = new Set<string>();
    const kbSourceLines: string[] = [];
    if (Array.isArray(kbOutfit.nguon)) {
      for (const code of kbOutfit.nguon) {
        if (typeof code === 'string' && code.trim()) {
          const cleanCode = code.trim();
          allowedSourceCodes.add(cleanCode);
          const srcInfo = kbSourcesMap.get(cleanCode);
          kbSourceLines.push(
            srcInfo
              ? `- Mã [${cleanCode}]: ${srcInfo.ten} (Loại: ${srcInfo.loai})`
              : `- Mã [${cleanCode}]: Chưa có nguồn`
          );
        }
      }
    }
    for (const code of kbSourcesMap.keys()) {
      allowedSourceCodes.add(code);
    }

    const bcSourceLines: string[] = [];
    const bcNguonArray: string[] = Array.isArray(kbBoiCanh.nguon) ? kbBoiCanh.nguon : [];
    bcNguonArray.forEach((url: string, idx: number) => {
      const bcCode = `BC-${kbBoiCanh.id}-${idx + 1}`;
      allowedSourceCodes.add(bcCode);
      bcSourceLines.push(`- Mã [${bcCode}]: ${url}`);
    });

    const kbGoiYLines = Array.isArray(kbOutfit.goi_y_phoi_do)
      ? kbOutfit.goi_y_phoi_do.map(
          (gy: any) =>
            `- [Gợi ý của app, không phải sự thật lịch sử] (${gy.loai || 'goi_y'}): ${gy.noi_dung}${
              gy.ghi_chu ? ` — Ghi chú: ${gy.ghi_chu}` : ''
            }`
        )
      : [];

    const kbKhongNenLines = Array.isArray(kbOutfit.khong_nen_khi_remix)
      ? kbOutfit.khong_nen_khi_remix.map((w: any) =>
          typeof w === 'string' ? `- ${w}` : `- ${w?.noi_dung || ''} (Căn cứ: ${w?.can_cu || 'Chưa có nguồn'})`
        )
      : [];

    const bcNenUuTienLines = Array.isArray(kbBoiCanh.nen_uu_tien)
      ? kbBoiCanh.nen_uu_tien.map(
          (item: any) =>
            `- Trang phục ${item.trang_phuc_id}: ${item.ly_do} [Gợi ý của app, chưa có nguồn]`
        )
      : [];

    const bcLuuYLines = Array.isArray(kbBoiCanh.luu_y)
      ? kbBoiCanh.luu_y.map((ly: any) => {
          const loaiText =
            ly.loai === 'thong_le_ung_xu' ? 'Thông lệ ứng xử (không phải quy định)' : 'Gợi ý thẩm mỹ';
          const mappedCodes = Array.isArray(ly.nguon_chi_so)
            ? ly.nguon_chi_so
                .filter((i: unknown) => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < bcNguonArray.length)
                .map((i: number) => `BC-${kbBoiCanh.id}-${i + 1}`)
            : [];
          const codeLabel = mappedCodes.length > 0 ? mappedCodes.join(', ') : 'Chưa có nguồn';
          return `- [${loaiText}] ${ly.noi_dung} (Mã nguồn bối cảnh: ${codeLabel})`;
        })
      : [];

    const guardianPrompt = [
      '=== DỮ LIỆU TRANG PHỤC TỪ KB-v3 ===',
      `- Mã trang phục: ${kbOutfit.id}`,
      `- Tên trang phục: ${kbOutfit.ten}`,
      `- Thời kỳ: ${kbOutfit.thoi_ky || 'Chưa có nguồn'}`,
      `- Mức chắc chắn tư liệu: ${kbOutfit.muc_chac_chan}`,
      '- Bộ phận cấu tạo:',
      `  + Cổ áo: ${kbOutfit.bo_phan?.co || 'Chưa có nguồn'}`,
      `  + Tay áo: ${kbOutfit.bo_phan?.tay || 'Chưa có nguồn'}`,
      `  + Thân áo: ${kbOutfit.bo_phan?.than || 'Chưa có nguồn'}`,
      `  + Vật liệu: ${kbOutfit.bo_phan?.vat_lieu || 'Chưa có nguồn'}`,
      '- Đặc điểm nhận diện hình ảnh:',
      ...(Array.isArray(kbOutfit.dac_diem_nhan_dien_hinh_anh) && kbOutfit.dac_diem_nhan_dien_hinh_anh.length > 0
        ? kbOutfit.dac_diem_nhan_dien_hinh_anh.map((d: string) => `  + ${d}`)
        : ['  + Chưa có nguồn']),
      '- Phụ kiện trong tư liệu KB:',
      ...(Array.isArray(kbOutfit.phu_kien) && kbOutfit.phu_kien.length > 0
        ? kbOutfit.phu_kien.map((p: string) => `  + ${p}`)
        : ['  + Chưa có nguồn']),
      '- Lưu ý không nên khi remix từ KB:',
      ...(kbKhongNenLines.length > 0 ? kbKhongNenLines : ['- Chưa có nguồn']),
      '- Gợi ý phối đồ từ KB (Gợi ý của app, không phải sự thật lịch sử):',
      ...(kbGoiYLines.length > 0 ? kbGoiYLines : ['- Chưa có nguồn']),
      '- Nguồn tư liệu trang phục từ KB:',
      ...(kbSourceLines.length > 0 ? kbSourceLines : ['- Chưa có nguồn']),
      '',
      '=== DỮ LIỆU BỐI CẢNH TỪ boi-canh.json ===',
      `- Mã bối cảnh: ${kbBoiCanh.id}`,
      `- Tên bối cảnh: ${kbBoiCanh.ten}`,
      `- Tinh thần: ${kbBoiCanh.tinh_than}`,
      `- Mức cách tân gợi ý của bối cảnh: ${kbBoiCanh.muc_remix} (${kbBoiCanh.muc_remix_ghi_chu || 'Chưa có nguồn'})`,
      '- Khuyến nghị trang phục ưu tiên (Gợi ý của app, chưa có nguồn):',
      ...(bcNenUuTienLines.length > 0 ? bcNenUuTienLines : ['- Chưa có nguồn']),
      '- Lưu ý của bối cảnh:',
      ...(bcLuuYLines.length > 0 ? bcLuuYLines : ['- Chưa có nguồn']),
      '- Nguồn tham khảo của bối cảnh:',
      ...(bcSourceLines.length > 0 ? bcSourceLines : ['- Chưa có nguồn']),
      '',
      '=== LỰA CHỌN ĐẦU VÀO ĐÃ KIỂM TRA CỦA NGƯỜI DÙNG ===',
      `- Trang phục: ${kbOutfit.ten} (${kbOutfit.id})`,
      `- Bối cảnh: ${kbBoiCanh.ten} (${kbBoiCanh.id})`,
      `- Mức độ cách tân: ${ALLOWED_REMIX_LEVELS.get(remixLevel)}`,
      `- Bảng màu: ${ALLOWED_COLOR_SCHEMES.get(colorSchemeId)}`,
      `- Phụ kiện: ${
        selectedAccessoryDescriptions.length > 0
          ? selectedAccessoryDescriptions.join('; ')
          : 'Không chọn phụ kiện'
      }`,
      `- Điều kiện thời tiết & thời điểm: ${ALLOWED_SEASONS.get(weather.season)} · ${ALLOWED_TEMPERATURES.get(
        weather.temperature
      )} · ${ALLOWED_TIMES_OF_DAY.get(weather.timeOfDay)}`,
      '',
      '=== PHƯƠNG ÁN PHỐI ĐỒ CẦN BẢO CHỨNG VĂN HOÁ ===',
      `- Tên phương án: ${paCore.ten}`,
      `- Thành phần bản phối: ${paCore.thanh_phan.join(', ')}`,
      `- Gợi ý của app đi kèm: ${paCore.goi_y_cua_app.join('; ')}`,
      `- Mô tả tổng thể: ${paCore.mo_ta}`,
      `- Căn cứ văn hoá ban đầu: ${paCore.ly_do_van_hoa}`,
      `- Mã nguồn ban đầu: ${paCore.ma_nguon || 'Chưa có nguồn'}`,
      '',
      'Hãy đối chiếu phương án phối đồ trên với toàn bộ DỮ LIỆU và đưa ra đánh giá bảo chứng văn hoá (Cultural Guardian) đúng theo schema JSON.',
    ].join('\n');

    incrementDailyCap();

    const modelName = resolveGeminiModel();

    try {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('GEMINI_TIMEOUT'));
        }, GEMINI_TIMEOUT_MS);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: guardianPrompt,
          config: {
            systemInstruction: GUARDIAN_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: GUARDIAN_RESPONSE_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
        timeoutPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      const rawText = typeof response?.text === 'string' ? response.text.trim() : '';
      if (!rawText) {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: 'empty_response',
          message: 'Chưa kiểm tra được',
        });
      }

      let cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.slice(startIdx, endIdx + 1);
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: 'bad_json_format',
          message: 'Chưa kiểm tra được',
        });
      }

      const sanitized = sanitizeGuardianResult(parsedJson, allowedSourceCodes);

      if (guardianCache.size > 300) {
        const curTs = Date.now();
        for (const [k, v] of guardianCache.entries()) {
          if (curTs >= v.expiresAt) guardianCache.delete(k);
        }
      }
      guardianCache.set(token, {
        result: sanitized,
        expiresAt: Date.now() + STYLE_CACHE_TTL_MS,
      });

      return res.json({
        success: true,
        guardian: sanitized,
      });
    } catch (err: any) {
      const statusNum =
        typeof err?.status === 'number'
          ? err.status
          : typeof err?.code === 'number'
          ? err.code
          : undefined;
      const errMsgRaw = typeof err?.message === 'string' ? err.message : String(err ?? '');
      const safeMsg = errMsgRaw.replace(/[\r\n]+/g, ' ').slice(0, 200);

      console.log(`[Guardian Diag] model=${modelName} status=${statusNum ?? 'none'} message=${safeMsg}`);

      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được',
      });
    }
  });

  // In production with built dist, serve static assets
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development or fallback: hook Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { clientPort: 443 },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const { hasValidKey } = getGeminiContext();
    console.log(
      `[Việt Phục Remix] Server listening on port ${PORT} (Gemini Proxy: ${hasValidKey ? 'Configured' : 'Unconfigured'}, Model: ${resolveGeminiModel()})`
    );
  });
}

startServer().catch(() => {
  console.error('Failed to start server.');
  process.exit(1);
});
