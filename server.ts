import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load single source of truth KB (src/data/kb-v3.json)
const kbPath = path.resolve(__dirname, 'src/data/kb-v3.json');
const kbRaw = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
const kbOutfitsMap = new Map<string, any>();
const kbAccessoriesMap = new Map<string, Map<string, string>>();

if (Array.isArray(kbRaw.trang_phuc)) {
  for (const item of kbRaw.trang_phuc) {
    if (item && typeof item.id === 'string') {
      kbOutfitsMap.set(item.id, item);

      const accMap = new Map<string, string>();
      if (Array.isArray(item.phu_kien)) {
        item.phu_kien.forEach((pk: unknown, idx: number) => {
          if (typeof pk === 'string' && pk.trim()) {
            accMap.set(`pk-${item.id}-${idx}`, pk.trim());
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
            accMap.set(`gy-${item.id}-${idx}`, `${gy.noi_dung.trim()} (Gợi ý của app, không phải sự thật lịch sử)`);
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

// Per-IP Rate Limiter (10 requests per minute)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_STRING_LENGTH = 300;
const MAX_ACCESSORY_COUNT = 10;
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
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

function isSameOriginRequest(req: express.Request): boolean {
  const secFetchSite = req.headers['sec-fetch-site'];
  if (typeof secFetchSite === 'string' && secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.origin;
  if (!origin) {
    // Non-CORS same-origin GET/POST without Origin header
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

  // Server-side Gemini client initialization
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  const ai = hasValidKey ? new GoogleGenAI({ apiKey }) : null;

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasServerKey: hasValidKey,
      model: resolveGeminiModel(),
    });
  });

  // Backend Gemini proxy for outfit styling & cultural advisory
  app.post('/api/gemini/suggest-style', async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const rateStatus = checkRateLimit(clientIp);
    if (!rateStatus.allowed) {
      res.setHeader('Retry-After', String(rateStatus.retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (vượt quá giới hạn 10 yêu cầu/phút, vui lòng thử lại sau).',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (dữ liệu đầu vào không hợp lệ).',
      });
    }

    // Validate all string fields length <= 300 chars
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof key !== 'string' || key.length > 64) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (trường dữ liệu không hợp lệ).',
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
      purpose,
      remixLevel,
      colorSchemeId,
      colors,
      selectedAccessoryIds,
      accessories,
      weather,
    } = req.body;

    // 1. Validate outfitId against KB-v3
    if (!isValidShortString(outfitId) || !kbOutfitsMap.has(outfitId)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (outfitId không tồn tại trong kho tri thức KB-v3).',
      });
    }
    const kbOutfit = kbOutfitsMap.get(outfitId);

    // 2. Validate purposeId against boi-canh.json
    const rawPurposeKey = purposeId !== undefined ? purposeId : purpose;
    const purposeKey = rawPurposeKey === undefined ? 'chup_ky_yeu' : rawPurposeKey;
    if (!isValidShortString(purposeKey) || !boiCanhMap.has(purposeKey)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mã bối cảnh sử dụng không tồn tại trong boi-canh.json).',
      });
    }
    const kbBoiCanh = boiCanhMap.get(purposeKey);
    const safePurposeLabel = `${kbBoiCanh.ten} (${kbBoiCanh.tinh_than})`;

    // 3. Validate remixLevel against allowlist (1, 2, 3)
    const parsedLevel =
      remixLevel === undefined
        ? 2
        : typeof remixLevel === 'number'
        ? remixLevel
        : typeof remixLevel === 'string' && /^[123]$/.test(remixLevel)
        ? Number(remixLevel)
        : NaN;
    if (!ALLOWED_REMIX_LEVELS.has(parsedLevel)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mức độ cách tân chỉ nhận giá trị 1, 2 hoặc 3).',
      });
    }
    const safeRemixLevelLabel = ALLOWED_REMIX_LEVELS.get(parsedLevel);

    // 4. Validate color scheme against allowlist
    const rawColorKey = colorSchemeId !== undefined ? colorSchemeId : colors;
    const colorKey = rawColorKey === undefined ? 'men-lam-chu-dau' : rawColorKey;
    if (!isValidShortString(colorKey) || !ALLOWED_COLOR_SCHEMES.has(colorKey)) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (mã bảng màu không nằm trong danh sách cho phép).',
      });
    }
    const safeColorLabel = ALLOWED_COLOR_SCHEMES.get(colorKey);

    // 5. Validate weather object ({ season, temperature, timeOfDay }) against allowlists
    const rawWeather =
      weather === undefined
        ? { season: 'thu', temperature: 'mat_me', timeOfDay: 'buoi_sang' }
        : weather;
    if (
      !rawWeather ||
      typeof rawWeather !== 'object' ||
      Array.isArray(rawWeather) ||
      !isValidShortString(rawWeather.season) ||
      !ALLOWED_SEASONS.has(rawWeather.season) ||
      !isValidShortString(rawWeather.temperature) ||
      !ALLOWED_TEMPERATURES.has(rawWeather.temperature) ||
      !isValidShortString(rawWeather.timeOfDay) ||
      !ALLOWED_TIMES_OF_DAY.has(rawWeather.timeOfDay)
    ) {
      return res.status(400).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (điều kiện thời tiết/thời điểm không nằm trong danh sách cho phép).',
      });
    }
    const safeWeatherLabel = `${ALLOWED_SEASONS.get(rawWeather.season)} · ${ALLOWED_TEMPERATURES.get(rawWeather.temperature)} · ${ALLOWED_TIMES_OF_DAY.get(rawWeather.timeOfDay)}`;

    // 6. Validate accessories strictly by allowed IDs for this outfit
    const rawAccessories = selectedAccessoryIds !== undefined ? selectedAccessoryIds : accessories;
    const outfitAccMap = kbAccessoriesMap.get(outfitId) || new Map();
    const safeAccessoryLabels = [];

    if (rawAccessories !== undefined) {
      if (!Array.isArray(rawAccessories) || rawAccessories.length > MAX_ACCESSORY_COUNT) {
        return res.status(400).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (danh sách mã phụ kiện không hợp lệ).',
        });
      }
      for (const accId of rawAccessories) {
        if (!isValidShortString(accId) || !outfitAccMap.has(accId)) {
          return res.status(400).json({
            success: false,
            error: 'chua_kiem_tra_duoc',
            message: 'Chưa kiểm tra được (mã phụ kiện không thuộc trang phục đã chọn trong KB-v3).',
          });
        }
        safeAccessoryLabels.push(outfitAccMap.get(accId));
      }
    }

    // Ensure API key is configured before attempting AI call
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (chưa cấu hình GEMINI_API_KEY trên máy chủ).',
      });
    }

    try {
      const kbWarnings = Array.isArray(kbOutfit.khong_nen_khi_remix)
        ? kbOutfit.khong_nen_khi_remix
            .map((w: any) => (typeof w === 'string' ? w : w?.noi_dung || ''))
            .filter(Boolean)
            .join('; ')
        : '';

      // Prompt built exclusively from validated KB-v3 data and static server allowlists
      const prompt = [
        'Bạn là trợ lý đối chiếu thông tin trang phục truyền thống Việt Nam dựa trên kho dữ liệu KB-v3.',
        'Nguyên tắc bắt buộc:',
        '1. Chỉ dựa trên thông tin trang phục trong KB-v3 được cung cấp bên dưới; không tự suy diễn sự thật lịch sử ngoài KB, nếu thông tin không có trong KB thì ghi "Chưa có nguồn".',
        '2. Không hiển thị số phần trăm về độ chắc chắn hay độ tin cậy.',
        '3. Mọi lời khuyên phối đồ hiện đại phải ghi rõ là "Gợi ý của app, không phải sự thật lịch sử" và không dùng các từ tuyệt đối ("tuyệt đối", "bắt buộc", "luôn").',
        '4. Không dùng thuật ngữ "hữu nhậm" hoặc "tả nhậm"; nếu mô tả chiều vạt áo thì diễn đạt bằng hình thức (ví dụ: vạt trái phủ ngoài vạt phải).',
        '',
        'Dữ liệu trang phục từ KB-v3:',
        `- Tên trang phục: ${kbOutfit.ten} (Mã: ${kbOutfit.id})`,
        `- Thời kỳ trong KB: ${kbOutfit.thoi_ky || 'Chưa có nguồn'}`,
        `- Mức chắc chắn tư liệu: ${kbOutfit.muc_chac_chan}`,
        `- Cấu tạo cổ áo: ${kbOutfit.bo_phan?.co || 'Chưa có nguồn'}`,
        `- Cấu tạo tay áo: ${kbOutfit.bo_phan?.tay || 'Chưa có nguồn'}`,
        `- Cấu tạo thân áo: ${kbOutfit.bo_phan?.than || 'Chưa có nguồn'}`,
        `- Lưu ý khi phối từ KB: ${kbWarnings || 'Chưa có nguồn'}`,
        '',
        'Cấu hình bản phối người dùng chọn (từ danh mục cho phép):',
        `- Mục đích sử dụng: ${safePurposeLabel}`,
        `- Mức độ cách tân: ${safeRemixLevelLabel}`,
        `- Bảng màu: ${safeColorLabel}`,
        `- Phụ kiện đã chọn: ${safeAccessoryLabels.length > 0 ? safeAccessoryLabels.join('; ') : 'Không chọn phụ kiện'}`,
        `- Thời tiết: ${safeWeatherLabel}`,
        '',
        'Hãy viết nhận xét ngắn gọn (3-4 câu) cho bản phối trên, tuân thủ nghiêm ngặt các nguyên tắc trên.',
      ].join('\n');

      const modelName = resolveGeminiModel();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const text = typeof response?.text === 'string' ? response.text.trim() : '';
      if (!text) {
        return res.status(503).json({
          success: false,
          error: 'chua_kiem_tra_duoc',
          message: 'Chưa kiểm tra được (dịch vụ AI không trả về kết quả).',
        });
      }

      return res.json({
        success: true,
        mode: 'live_gemini',
        model: modelName,
        text,
      });
    } catch {
      // Do not log API keys, request payloads, or user content
      console.warn('[Gemini Proxy] Upstream generation request failed.');
      return res.status(503).json({
        success: false,
        error: 'chua_kiem_tra_duoc',
        message: 'Chưa kiểm tra được (lỗi kết nối hoặc dịch vụ AI tạm thời gián đoạn).',
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
    console.log(
      `[Việt Phục Remix] Server listening on port ${PORT} (Gemini Proxy: ${hasValidKey ? 'Configured' : 'Unconfigured'}, Model: ${resolveGeminiModel()})`
    );
  });
}

startServer().catch(() => {
  console.error('Failed to start server.');
  process.exit(1);
});
