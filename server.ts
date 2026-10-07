import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  GoogleGenAI,
  Type,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from '@google/genai';

dotenv.config();

// Last-resort safety net: never let a stray error take the server down.
// (Single-line logs only: no API key, prompt or user data.)
process.on('unhandledRejection', (reason: unknown) => {
  const msg = typeof (reason as any)?.message === 'string' ? (reason as any).message : String(reason ?? '');
  console.log(`[Process Diag] unhandledRejection: ${msg.replace(/[\r\n]+/g, ' ').slice(0, 200)}`);
});
process.on('uncaughtException', (err: unknown) => {
  const msg = typeof (err as any)?.message === 'string' ? (err as any).message : String(err ?? '');
  console.log(`[Process Diag] uncaughtException: ${msg.replace(/[\r\n]+/g, ' ').slice(0, 200)}`);
});

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
]);
const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

function resolveGeminiModel(): string {
  const envModel = (process.env.GEMINI_MODEL || '').trim();
  if (envModel && ALLOWED_GEMINI_MODELS.has(envModel)) {
    return envModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

// ===== Gemini auto-fallback (retry ONCE on 429 / 503 / 500) =====
// The fallback model is NOT a secret: it is hard-coded here (the app cannot edit AI Studio secrets at runtime).
// Optional override: add a secret GEMINI_FALLBACK_MODEL (must be in ALLOWED_GEMINI_MODELS).
// NOTE: 'gemini-1.5-flash' was shut down by Google (Sep 2025) and now returns 404, so it is NOT used.
const FALLBACK_GEMINI_CANDIDATES = ['gemini-3.1-flash-lite', 'gemini-2.5-flash'];
const RETRYABLE_GEMINI_STATUSES = new Set<number>([429, 500, 503]);

// First candidate that is allowed and different from the primary model.
function resolveFallbackModel(primaryModel: string): string | null {
  const envModel = (process.env.GEMINI_FALLBACK_MODEL || '').trim();
  for (const m of [envModel, ...FALLBACK_GEMINI_CANDIDATES]) {
    if (m && m !== primaryModel && ALLOWED_GEMINI_MODELS.has(m)) return m;
  }
  return null;
}

function getGeminiErrorStatus(err: unknown): number | undefined {
  const e = err as any;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.code === 'number') return e.code;
  if (typeof e?.error?.code === 'number') return e.error.code;
  return undefined;
}

function isRetryableGeminiError(err: unknown): boolean {
  const status = getGeminiErrorStatus(err);
  if (status !== undefined) return RETRYABLE_GEMINI_STATUSES.has(status);
  const msg = typeof (err as any)?.message === 'string' ? (err as any).message : String(err ?? '');
  return (
    /RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL|"code"\s*:\s*(429|500|503)/.test(msg) ||
    /high demand|overloaded|resource has been exhausted/i.test(msg)
  );
}

// Final error thrown by generateWithFallback; keeps status/message so the routes' catch blocks keep working.
class GeminiCallError extends Error {
  status?: number;
  modelTried: string;
  constructor(original: unknown, modelTried: string) {
    const o = original as any;
    super(typeof o?.message === 'string' ? o.message : String(original ?? ''));
    this.name = o?.name === 'AbortError' ? 'AbortError' : 'GeminiCallError';
    this.status = getGeminiErrorStatus(original);
    this.modelTried = modelTried;
  }
}

async function callGeminiWithTimeout(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  timeoutMs: number = GEMINI_TIMEOUT_MS
): Promise<GenerateContentResponse> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs);
  });
  try {
    return await Promise.race([ai.models.generateContent(params), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

// 1st call: primary model. If it fails with 429/503/500 -> ONE retry with the fallback model,
// same contents + config (systemInstruction, responseSchema, temperature, maxOutputTokens).
async function generateWithFallback(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'>,
  tag: string,
  timeoutMs: number = GEMINI_TIMEOUT_MS
): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const primaryModel = resolveGeminiModel();
  try {
    const response = await callGeminiWithTimeout(ai, { ...params, model: primaryModel }, timeoutMs);
    return { response, modelUsed: primaryModel };
  } catch (primaryErr: unknown) {
    const fallbackModel = resolveFallbackModel(primaryModel);
    if (!fallbackModel || !isRetryableGeminiError(primaryErr)) {
      throw new GeminiCallError(primaryErr, primaryModel);
    }
    console.log(
      `[${tag}] Primary model failed, retrying with fallback model... (primary=${primaryModel} status=${
        getGeminiErrorStatus(primaryErr) ?? 'none'
      } fallback=${fallbackModel})`
    );
    try {
      const response = await callGeminiWithTimeout(ai, { ...params, model: fallbackModel }, timeoutMs);
      return { response, modelUsed: fallbackModel };
    } catch (fallbackErr: unknown) {
      throw new GeminiCallError(fallbackErr, fallbackModel);
    }
  }
}

// Wraps an async Express handler so an unexpected throw can never crash the process
// or leave the request hanging: the front-end always gets the safe error shape.
function safeAsyncRoute(
  handler: (req: express.Request, res: express.Response) => Promise<unknown>
): express.RequestHandler {
  return (req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err: unknown) => {
        try {
          const msg = typeof (err as any)?.message === 'string' ? (err as any).message : String(err ?? '');
          console.log(`[Route Diag] unhandled error: ${msg.replace(/[\r\n]+/g, ' ').slice(0, 200)}`);
          if (!res.headersSent) {
            res.status(503).json({
              success: false,
              error: 'chua_kiem_tra_duoc',
              reason: 'service_error',
              message: 'Chưa kiểm tra được',
            });
          }
        } catch {
          /* swallow: nothing more we can do for this request */
        }
      });
  };
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
  ma_nguon: string[];
  goi_y_cua_app: string[];
}

interface GuardianLyDoItemCore {
  noi_dung: string;
  loai: 'lich_su' | 'thong_le_ung_xu' | 'tham_my' | 'thieu_can_cu' | 'nguyen_tac_app';
  ma_nguon: string | null;
}

interface GuardianCoreResult {
  nhan: 'hai_hoa' | 'can_luu_y' | 'de_sai_lech';
  diem_hai_hoa_mau: number | null;
  ly_do: GuardianLyDoItemCore[];
  goi_y_sua: string[];
  do_chac_chan: 'cao' | 'trung_binh' | 'thap';
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

// B7: Image Guardian Rate Limiter (3 requests per minute per IP) & Daily Cap (default 100)
const RATE_LIMIT_IMAGE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_IMAGE_MAX_REQUESTS = 3;
const DAILY_CAP_IMAGE = (() => {
  const parsed = parseInt(process.env.DAILY_CAP_IMAGE || '100', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 100;
})();
const GEMINI_IMAGE_TIMEOUT_MS = 45 * 1000; // 45 seconds timeout for multimodal image check

const ipRateLimitsImage = new Map<string, { count: number; resetAt: number }>();
let dailyImageUsage = {
  dateKey: new Date().toISOString().slice(0, 10),
  count: 0,
};

function checkIpRateLimitImage(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (ipRateLimitsImage.size > 2000) {
    for (const [key, entry] of ipRateLimitsImage.entries()) {
      if (now >= entry.resetAt) {
        ipRateLimitsImage.delete(key);
      }
    }
  }

  const current = ipRateLimitsImage.get(ip);
  if (!current || now >= current.resetAt) {
    ipRateLimitsImage.set(ip, { count: 1, resetAt: now + RATE_LIMIT_IMAGE_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= RATE_LIMIT_IMAGE_MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function checkDailyCapImage(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyImageUsage.dateKey !== today) {
    dailyImageUsage = { dateKey: today, count: 0 };
  }
  return dailyImageUsage.count < DAILY_CAP_IMAGE;
}

function incrementDailyCapImage(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyImageUsage.dateKey !== today) {
    dailyImageUsage = { dateKey: today, count: 1 };
  } else {
    dailyImageUsage.count += 1;
  }
}

const ALLOWED_IMAGE_GUARDIAN_MIMES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

function normalizeGuardianMimeType(mime: unknown): string {
  if (typeof mime !== 'string') return '';
  const lower = mime.trim().toLowerCase();
  if (lower === 'image/jpg' || lower === 'image/pjpeg') return 'image/jpeg';
  if (lower === 'image/x-ms-bmp' || lower === 'image/x-bmp') return 'image/bmp';
  return lower;
}

function checkImageMagicBytes(buffer: Buffer, mime: string): boolean {
  if (!buffer || buffer.length < 4) return false;
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (mime === 'image/gif') {
    if (buffer.length < 6) return false;
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (mime === 'image/bmp') {
    return buffer[0] === 0x42 && buffer[1] === 0x4d;
  }
  if (mime === 'image/heic' || mime === 'image/heif') {
    return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  }
  if (mime === 'application/pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
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
  'Bạn là Stylist của app "Việt phục Remix". Chỉ dùng dữ kiện trong phần DỮ LIỆU (mục trang phục và mục bối cảnh) được cung cấp.',
  '- Đề xuất 2–3 phương án phối khác nhau rõ rệt, hợp với bối cảnh, mức cách tân, màu và điều kiện người dùng đã chọn.',
  '- Cấu tạo, thời kỳ, đặc điểm nhận diện: chỉ lấy từ DỮ LIỆU, kèm mã nguồn trong ma_nguon.',
  '- Phụ kiện và cách phối lấy từ goi_y_phoi_do hoặc lựa chọn của người dùng: ghi trong goi_y_cua_app, mỗi dòng bắt đầu bằng "Gợi ý của app:". Đây là gợi ý phong cách, không phải sự thật lịch sử.',
  '- Quy tắc theo bối cảnh là thông lệ, hãy nói rõ "thông lệ, không phải quy định".',
  '- Không bịa. Thiếu dữ liệu thì nói "chưa có nguồn". Không dùng từ tuyệt đối, không nêu số phần trăm, không phán xét người dùng, không nhắc trang phục nước khác.',
  '- Giọng thân thiện, ngắn gọn, tiếng Việt.',
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
          ten: { type: Type.STRING },
          mo_ta: { type: Type.STRING },
          thanh_phan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          ly_do_van_hoa: { type: Type.STRING },
          ma_nguon: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          goi_y_cua_app: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
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
  'Bạn là Cultural Guardian. Chấm MỘT phương án phối, chỉ dựa trên DỮ LIỆU được cung cấp.',
  '- nhan = de_sai_lech CHỈ khi phương án vi phạm một quy tắc có loai_quy_tac = "lich_su" kèm mã nguồn trong DỮ LIỆU.',
  '- nhan = can_luu_y khi: có thông lệ theo bối cảnh liên quan đến phương án (loai thong_le_ung_xu); hoặc phụ kiện hay cách phối không có trong dữ liệu.',
  '- Mức chắc chắn của dữ liệu thể hiện qua do_chac_chan, không tự động hạ nhãn.',
  '- nhan = hai_hoa khi không có điểm nào cần lưu ý trong dữ liệu.',
  '- Quy tắc tham_my chỉ là nhận xét nhẹ, ghi rõ "gợi ý thẩm mỹ", không dùng để kết luận sai lệch văn hoá.',
  '- Mỗi lý do ghi loai và ma_nguon (mã trong DỮ LIỆU hoặc null). Quy tắc của app (ví dụ yếm chỉ là lớp trong) ghi loai = nguyen_tac_app.',
  '- Nếu dữ liệu không đủ: thêm một lý do loai = thieu_can_cu với nội dung "chưa đủ căn cứ trong dữ liệu hiện có", diem_hai_hoa_mau = null, do_chac_chan = thap.',
  '- Không bịa quy tắc, quy định hay độ tuổi không có trong dữ liệu.',
].join('\n');

const GUARDIAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nhan: {
      type: Type.STRING,
      enum: ['hai_hoa', 'can_luu_y', 'de_sai_lech'],
    },
    diem_hai_hoa_mau: {
      type: Type.NUMBER,
      nullable: true,
    },
    ly_do: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          noi_dung: { type: Type.STRING },
          loai: {
            type: Type.STRING,
            enum: ['lich_su', 'thong_le_ung_xu', 'tham_my', 'thieu_can_cu', 'nguyen_tac_app'],
          },
          ma_nguon: { type: Type.STRING, nullable: true },
        },
        required: ['noi_dung', 'loai', 'ma_nguon'],
      },
    },
    goi_y_sua: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    do_chac_chan: {
      type: Type.STRING,
      enum: ['cao', 'trung_binh', 'thap'],
    },
  },
  required: ['nhan', 'diem_hai_hoa_mau', 'ly_do', 'goi_y_sua', 'do_chac_chan'],
};

function sanitizeGuardianResult(
  raw: any,
  allowedSourceCodes: Set<string>
): GuardianCoreResult {
  let nhan: 'hai_hoa' | 'can_luu_y' | 'de_sai_lech' = 'can_luu_y';
  if (raw?.nhan === 'hai_hoa' || raw?.nhan === 'de_sai_lech') {
    nhan = raw.nhan;
  }

  let doChacChan: 'cao' | 'trung_binh' | 'thap' = 'trung_binh';
  if (raw?.do_chac_chan === 'cao' || raw?.do_chac_chan === 'thap') {
    doChacChan = raw.do_chac_chan;
  }

  const validLoai = new Set(['lich_su', 'thong_le_ung_xu', 'tham_my', 'thieu_can_cu', 'nguyen_tac_app']);
  const sanitizedLyDo: GuardianLyDoItemCore[] = [];

  if (Array.isArray(raw?.ly_do)) {
    for (const item of raw.ly_do) {
      if (!item || typeof item !== 'object') continue;
      let noiDung = typeof item.noi_dung === 'string' ? item.noi_dung : '';
      noiDung = sanitizeTextConstraints(
        noiDung
          .replace(/\btuyệt đối\b/gi, 'nên')
          .replace(/\bbắt buộc\b/gi, 'khuyến khích')
          .replace(/\bluôn luôn\b/gi, 'thường')
          .replace(/\bluôn\b/gi, 'thường')
      );
      if (!noiDung.trim()) continue;

      const loai: 'lich_su' | 'thong_le_ung_xu' | 'tham_my' | 'thieu_can_cu' | 'nguyen_tac_app' =
        validLoai.has(item.loai) ? item.loai : 'thong_le_ung_xu';

      let maNguon: string | null = null;
      if (typeof item.ma_nguon === 'string' && item.ma_nguon.trim()) {
        const candidate = item.ma_nguon.trim().replace(/^\[|\]$/g, '');
        if (allowedSourceCodes.has(candidate)) {
          maNguon = candidate;
        }
      }

      sanitizedLyDo.push({
        noi_dung: noiDung,
        loai,
        ma_nguon: maNguon,
      });
    }
  }

  if (sanitizedLyDo.length === 0) {
    sanitizedLyDo.push({
      noi_dung: 'chưa đủ căn cứ trong dữ liệu hiện có',
      loai: 'thieu_can_cu',
      ma_nguon: null,
    });
  }

  let diemHaiHoaMau: number | null = null;
  if (
    typeof raw?.diem_hai_hoa_mau === 'number' &&
    Number.isFinite(raw.diem_hai_hoa_mau) &&
    raw.diem_hai_hoa_mau >= 0 &&
    raw.diem_hai_hoa_mau <= 10
  ) {
    diemHaiHoaMau = Math.round(raw.diem_hai_hoa_mau);
  }

  const sanitizedGoiYSua: string[] = [];
  if (Array.isArray(raw?.goi_y_sua)) {
    for (const s of raw.goi_y_sua) {
      if (typeof s === 'string' && s.trim()) {
        const cleaned = sanitizeTextConstraints(
          s
            .replace(/\btuyệt đối\b/gi, 'nên')
            .replace(/\bbắt buộc\b/gi, 'khuyến khích')
            .replace(/\bluôn luôn\b/gi, 'thường')
            .replace(/\bluôn\b/gi, 'thường')
        );
        if (cleaned) sanitizedGoiYSua.push(cleaned);
      }
    }
  }

  return {
    nhan,
    diem_hai_hoa_mau: diemHaiHoaMau,
    ly_do: sanitizedLyDo,
    goi_y_sua: sanitizedGoiYSua,
    do_chac_chan: doChacChan,
  };
}

// B7: Cultural Guardian system instruction & schema for image analysis
const IMAGE_GUARDIAN_SYSTEM_INSTRUCTION = [
  'Bạn là Cultural Guardian đọc ảnh. So sánh ẢNH với các đặc điểm trong DỮ LIỆU (dac_diem_nhan_dien_hinh_anh, mo_ta_prompt_anh_en) của đúng trang phục được chỉ định.',
  '- Đối chiếu từng đặc điểm. Đặc điểm nhìn thấy và khớp → diem_khop. Nhìn thấy và mâu thuẫn rõ → diem_khong_khop. Bị che hoặc không rõ do góc chụp → diem_khong_xac_dinh (không coi là sai).',
  '- khop = true chỉ khi diem_khong_khop rỗng.',
  '- nhan: de_sai_lech nếu có điểm mâu thuẫn rõ hoặc trang phục trông như một loại trang phục khác; can_luu_y nếu không có mâu thuẫn nhưng còn điểm không xác định được; hai_hoa nếu mọi đặc điểm đều khớp.',
  '- Chỉ nói về trang phục. Không nhận diện danh tính, không nhận xét ngoại hình hay cơ thể người trong ảnh.',
  '- Không suy diễn ngoài dữ liệu.',
].join('\n');

const IMAGE_GUARDIAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    khop: { type: Type.BOOLEAN },
    diem_khop: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    diem_khong_khop: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    diem_khong_xac_dinh: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    nhan: {
      type: Type.STRING,
      enum: ['hai_hoa', 'can_luu_y', 'de_sai_lech'],
    },
    do_chac_chan: {
      type: Type.STRING,
      enum: ['cao', 'trung_binh', 'thap'],
    },
  },
  required: ['khop', 'diem_khop', 'diem_khong_khop', 'diem_khong_xac_dinh', 'nhan', 'do_chac_chan'],
};

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

  // B7: Body limit riêng cho /api/guard-image (khoảng 6MB), các route khác giữ 100KB
  const jsonParserSmall = express.json({ limit: '100kb', strict: true });
  const jsonParserLarge = express.json({ limit: '6mb', strict: true });

  app.use((req, res, next) => {
    if (req.path === '/api/guard-image') {
      return jsonParserLarge(req, res, next);
    }
    return jsonParserSmall(req, res, next);
  });

  // Handle body parser errors (413 Payload Too Large / 400 Invalid JSON)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      const status = err.type === 'entity.too.large' ? 413 : 400;
      const limitText = req.path === '/api/guard-image' ? '6MB' : '100KB';
      return res.status(status).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message:
          status === 413
            ? `Chưa kiểm tra được (kích thước dữ liệu vượt quá giới hạn ${limitText}).`
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
  app.post('/api/style', safeAsyncRoute(async (req, res) => {
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

    // 1. Validate outfitId
    if (!isValidShortString(outfitId) || !kbOutfitsMap.has(outfitId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mã trang phục không tồn tại trong danh mục).',
      });
    }
    const kbOutfit = kbOutfitsMap.get(outfitId);

    // 2. Validate purposeId
    if (!isValidShortString(purposeId) || !boiCanhMap.has(purposeId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mã bối cảnh không tồn tại trong danh mục).',
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

    let modelName = resolveGeminiModel();

    try {
      const { response, modelUsed } = await generateWithFallback(
        ai,
        {
          contents: dataPrompt,
          config: {
            systemInstruction: STYLIST_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: STYLIST_RESPONSE_SCHEMA,
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
        },
        'Stylist'
      );
      modelName = modelUsed;

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

        // ma_nguon in Stylist schema is array of string
        let validMaNguonList: string[] = [];
        if (Array.isArray(item.ma_nguon)) {
          for (const m of item.ma_nguon) {
            if (typeof m === 'string' && m.trim()) {
              const candidate = m.trim().replace(/^\[|\]$/g, '');
              if (allowedSourceCodes.has(candidate) && !validMaNguonList.includes(candidate)) {
                validMaNguonList.push(candidate);
              }
            }
          }
        } else if (typeof item.ma_nguon === 'string' && item.ma_nguon.trim()) {
          const candidate = item.ma_nguon.trim().replace(/^\[|\]$/g, '');
          if (allowedSourceCodes.has(candidate)) {
            validMaNguonList.push(candidate);
          }
        }

        sanitizedList.push({
          ten: sanitizeTextConstraints(item.ten),
          mo_ta: sanitizeTextConstraints(item.mo_ta),
          thanh_phan: thanhPhan,
          ly_do_van_hoa: sanitizeTextConstraints(item.ly_do_van_hoa),
          ma_nguon: validMaNguonList,
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
      if (err instanceof GeminiCallError) modelName = err.modelTried;
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
      const isQuotaExhausted =
        statusNum === 429 ||
        errMsgRaw.includes('429') ||
        errMsgRaw.includes('Resource has been exhausted') ||
        errMsgRaw.includes('quota') ||
        err?.error?.code === 429;

      if (errMsgRaw === 'GEMINI_TIMEOUT' || err?.name === 'AbortError') {
        reason = 'timeout';
      } else if (statusNum === 404) {
        reason = 'model_not_found';
      } else if (statusNum === 401 || statusNum === 403) {
        reason = 'permission';
      } else if (isQuotaExhausted) {
        reason = 'quota';
      } else if (typeof statusNum === 'number') {
        reason = `http_${statusNum}`;
      }

      return res.status(isQuotaExhausted ? 429 : 503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason,
        message: 'Chưa kiểm tra được',
      });
    }
  }));

  // B7: Image Cultural Guardian endpoint
  app.post('/api/guard-image', safeAsyncRoute(async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const rateStatus = checkIpRateLimitImage(clientIp);
    if (!rateStatus.allowed) {
      res.setHeader('Retry-After', String(rateStatus.retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (vượt quá giới hạn 3 yêu cầu/phút cho kiểm tra ảnh, vui lòng thử lại sau).',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (dữ liệu đầu vào không hợp lệ).',
      });
    }

    const { outfitId, imageBase64, mimeType } = req.body;

    if (!isValidShortString(outfitId) || !kbOutfitsMap.has(outfitId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mã trang phục không hợp lệ hoặc không có trong danh mục).',
      });
    }

    const normalizedMime = normalizeGuardianMimeType(mimeType);

    if (!ALLOWED_IMAGE_GUARDIAN_MIMES.has(normalizedMime)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message:
          'Chưa kiểm tra được (chỉ chấp nhận tệp định dạng JPG, JPEG, PNG, WEBP, GIF, BMP, HEIC/HEIF hoặc PDF).',
      });
    }

    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (thiếu dữ liệu tệp).',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+.-]+;base64,/, '').trim();
    let imgBuffer: Buffer;
    try {
      imgBuffer = Buffer.from(cleanBase64, 'base64');
    } catch {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (dữ liệu base64 không hợp lệ).',
      });
    }

    if (imgBuffer.length === 0 || imgBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (kích thước tệp tối đa 4MB).',
      });
    }

    if (!checkImageMagicBytes(imgBuffer, normalizedMime)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message:
          'Chưa kiểm tra được (dấu hiệu tệp không khớp với định dạng JPG, JPEG, PNG, WEBP, GIF, BMP, HEIC/HEIF hoặc PDF).',
      });
    }

    if (!checkDailyCapImage()) {
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Hệ thống đã đạt giới hạn kiểm tra ảnh hôm nay',
      });
    }

    const { hasValidKey, ai } = getGeminiContext();
    if (!hasValidKey || !ai) {
      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason: 'no_key',
        message: 'Chưa kiểm tra được (hệ thống chưa cấu hình API key).',
      });
    }

    const kbOutfit = kbOutfitsMap.get(outfitId)!;

    const imagePromptText = [
      '=== DỮ LIỆU TRANG PHỤC CẦN ĐỐI CHIẾU TỪ KB-v3 ===',
      `- Mã trang phục: ${kbOutfit.id}`,
      `- Tên trang phục: ${kbOutfit.ten}`,
      `- Thời kỳ: ${kbOutfit.thoi_ky || 'Chưa có nguồn'}`,
      `- Mức chắc chắn tư liệu KB: ${kbOutfit.muc_chac_chan}`,
      '- Đặc điểm nhận diện hình ảnh từ tư liệu:',
      ...(Array.isArray(kbOutfit.dac_diem_nhan_dien_hinh_anh) && kbOutfit.dac_diem_nhan_dien_hinh_anh.length > 0
        ? kbOutfit.dac_diem_nhan_dien_hinh_anh.map((d: string) => `  + ${d}`)
        : ['  + Chưa có nguồn']),
      `- Mô tả hình ảnh chuẩn (English Reference): ${kbOutfit.mo_ta_prompt_anh_en || 'Chưa có nguồn'}`,
      ...(Array.isArray(kbOutfit.tranh_nham_voi) && kbOutfit.tranh_nham_voi.length > 0
        ? [
            '- Các dạng trang phục dễ nhầm lẫn cần lưu ý tránh:',
            ...kbOutfit.tranh_nham_voi.map((t: any) => `  + Dễ nhầm với ${t.ten}: ${t.diem_khac_biet || ''}`),
          ]
        : []),
      '',
      'Hãy đối chiếu kỹ từng đặc điểm trang phục trong ảnh với dữ liệu trên và trả về kết quả JSON theo đúng schema.',
    ].join('\n');

    incrementDailyCapImage();

    let modelName = resolveGeminiModel();

    try {
      const { response, modelUsed } = await generateWithFallback(
        ai,
        {
          contents: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: cleanBase64,
              },
            },
            imagePromptText,
          ],
          config: {
            systemInstruction: IMAGE_GUARDIAN_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: IMAGE_GUARDIAN_RESPONSE_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        },
        'ImageGuardian',
        GEMINI_IMAGE_TIMEOUT_MS
      );
      modelName = modelUsed;

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

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          reason: 'bad_json_format',
          message: 'Chưa kiểm tra được',
        });
      }

      const cleanList = (arr: any): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
          .map((x) => sanitizeTextConstraints(x));
      };

      const diemKhop = cleanList(parsed.diem_khop);
      const diemKhongKhop = cleanList(parsed.diem_khong_khop);
      const diemKhongXacDinh = cleanList(parsed.diem_khong_xac_dinh);

      // khop = true chỉ khi diem_khong_khop rỗng
      const khop = Boolean(parsed.khop) && diemKhongKhop.length === 0;

      // nhan: de_sai_lech nếu có mâu thuẫn rõ; can_luu_y nếu còn điểm không xác định; hai_hoa nếu mọi đặc điểm đều khớp
      let nhan: 'hai_hoa' | 'can_luu_y' | 'de_sai_lech' = 'can_luu_y';
      if (diemKhongKhop.length > 0) {
        nhan = 'de_sai_lech';
      } else if (diemKhongXacDinh.length > 0) {
        nhan = 'can_luu_y';
      } else if (diemKhop.length > 0) {
        nhan = 'hai_hoa';
      }

      // Luật 3: Trần mức chắc chắn theo KB
      const CERTAINTY_LEVELS: Record<string, number> = { thap: 1, trung_binh: 2, cao: 3 };
      let doChacChan: 'cao' | 'trung_binh' | 'thap' =
        parsed.do_chac_chan === 'cao' || parsed.do_chac_chan === 'thap'
          ? parsed.do_chac_chan
          : 'trung_binh';

      const kbLevel = CERTAINTY_LEVELS[kbOutfit.muc_chac_chan] || 2;
      const aiLevel = CERTAINTY_LEVELS[doChacChan] || 2;
      if (aiLevel > kbLevel) {
        doChacChan = kbOutfit.muc_chac_chan as 'cao' | 'trung_binh' | 'thap';
      }

      // Luật 4: Áo giao lĩnh luôn kèm cảnh báo cố định
      let canhBaoCoDinh: string | null = null;
      if (kbOutfit.id === 'ao_giao_linh') {
        canhBaoCoDinh =
          'Lưu ý: Áo giao lĩnh có phom dáng cổ chéo, buộc dây tương đồng với một số trang phục cổ Đông Á khác. Chú ý vạt áo trái phải đè lên ngoài vạt phải (không mặc ngược vạt).';
      }

      return res.json({
        success: true,
        result: {
          khop,
          diem_khop: diemKhop,
          diem_khong_khop: diemKhongKhop,
          diem_khong_xac_dinh: diemKhongXacDinh,
          nhan,
          do_chac_chan: doChacChan,
          canh_bao_co_dinh: canhBaoCoDinh,
        },
      });
    } catch (err: any) {
      if (err instanceof GeminiCallError) modelName = err.modelTried;
      const statusNum =
        typeof err?.status === 'number'
          ? err.status
          : typeof err?.code === 'number'
          ? err.code
          : undefined;
      const errMsgRaw = typeof err?.message === 'string' ? err.message : String(err ?? '');
      const safeMsg = errMsgRaw.replace(/[\r\n]+/g, ' ').slice(0, 200);

      // Single-line console.log (NO image, NO base64, NO prompt, NO user data)
      console.log(`[ImageGuardian Diag] model=${modelName} status=${statusNum ?? 'none'} message=${safeMsg}`);

      const isQuotaExhausted =
        statusNum === 429 ||
        errMsgRaw.includes('429') ||
        errMsgRaw.includes('Resource has been exhausted') ||
        errMsgRaw.includes('quota') ||
        err?.error?.code === 429;

      return res.status(isQuotaExhausted ? 429 : 503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        reason: isQuotaExhausted ? 'quota' : 'service_error',
        message: isQuotaExhausted
          ? 'Chưa kiểm tra được (Hệ thống AI đang quá tải / đạt hạn mức, vui lòng thử lại sau)'
          : 'Chưa kiểm tra được',
      });
    }
  }));

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