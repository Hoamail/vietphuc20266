# Việt Phục Remix

Nền tảng khám phá và phối trang phục truyền thống Việt Nam dành cho học sinh, sinh viên Gen Z, đảm bảo tính chuẩn xác lịch sử và minh bạch nguồn gốc tư liệu (AI Arena Vietnam 2026).

## Tính năng chính

- **Kho tri thức cổ phục (KB-v3)**: Tra cứu 6 dạng thức trang phục (Áo Ngũ Thân Tay Chẽn, Áo Tấc, Áo Giao Lĩnh, Áo Tứ Thân, Áo Dài Hiện Đại, Áo Bà Ba) kèm dẫn chứng học thuật.
- **Minh họa Line-art SVG**: Hệ thống vector nội bộ mô tả chính xác đặc điểm cấu trúc (cổ đứng, tay chẽn, tay thụng, cổ vạt chéo, sống lưng, tà xẻ, hàng cúc) không sử dụng ảnh chụp hoặc ảnh AI bản quyền.
- **Tùy biến phong cách**: 3 cấp độ cách tân, bảng màu men gốm và lụa truyền thống Việt Nam, phụ kiện và điều kiện thực tế.
- **Bảo chứng văn hóa**: Phân loại mức chắc chắn (cao / trung_binh / thap), kèm lời khuyên trang phục và nhãn cảnh báo rõ ràng.
- **Lookbook & So sánh**: Lưu trữ bản phối cá nhân và đối chiếu đa chiều giữa các dạng thức trang phục.

## Hướng dẫn cài đặt và chạy ứng dụng

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env.local` hoặc `.env` tại thư mục gốc của dự án:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3000
```

### 3. Chạy ở chế độ phát triển (Development)

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 4. Build và chạy ở chế độ Production

```bash
# Build mã nguồn
npm run build

# Khởi chạy server production phục vụ thư mục dist
npm start
```

### 5. Kiểm tra chất lượng mã nguồn (Linting)

```bash
npm run lint
```
