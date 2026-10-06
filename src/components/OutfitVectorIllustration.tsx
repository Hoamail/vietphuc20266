import React from 'react';

interface SVGComponentProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 1. Áo Ngũ Thân Tay Chẽn
 * Nhận diện: Cổ đứng vuông thấp (2-4cm), 5 cúc cài dọc chéo về bên phải,
 * ống tay chẽn thuôn nhỏ dần từ nách tới cổ tay, 5 thân vải.
 */
export const AoNguThanIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#F9F7F2] rounded-xl overflow-hidden p-2 border border-[#E8E2D8] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle decorative background circle */}
        <circle cx="120" cy="140" r="105" fill="#F4EFE6" stroke="#E5DEC9" strokeWidth="1" strokeDasharray="3 3" />

        {/* Lớp áo lót trong cổ trắng (áo đơn cốt) */}
        <path d="M112 56 L120 68 L128 56 Z" fill="#FFFFFF" stroke="#D5CBB9" strokeWidth="1.2" />

        {/* Cổ áo đứng vuông vức (khoảng 2-4cm) */}
        <rect x="106" y="50" width="28" height="15" rx="2" fill="#FAF7F2" stroke="#2C4052" strokeWidth="1.8" />
        <line x1="120" y1="50" x2="120" y2="65" stroke="#2C4052" strokeWidth="1.2" />

        {/* Quần lụa trắng ống rộng bên dưới */}
        <path d="M88 215 L80 255 L114 255 L116 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
        <path d="M124 215 L126 255 L160 255 L152 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

        {/* Thân áo chính (5 thân vải ghép dọc, dáng chữ V mềm mại) */}
        <path
          d="M84 65 L156 65 L174 215 L66 215 Z"
          fill="#EBF0F5"
          stroke="#1E3F5A"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Vạt cài chéo đè sang phía bên phải */}
        <path
          d="M120 65 Q136 88 142 118 L144 215"
          stroke="#1E3F5A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Nếp gấp thân con (thân thứ 5 nằm bên trong) */}
        <path d="M120 65 L144 95 L144 215" fill="#DCE7F0" fillOpacity="0.4" />

        {/* 5 Cúc cài kim loại mạ vàng hình chữ quảng bên phải */}
        {/* 1. Cúc cổ */}
        <circle cx="122" cy="58" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        {/* 2. Cúc dưới vai */}
        <circle cx="134" cy="78" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        {/* 3. Cúc nách */}
        <circle cx="141" cy="98" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        {/* 4. Cúc dưới eo 1 */}
        <circle cx="143" cy="120" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        {/* 5. Cúc dưới eo 2 */}
        <circle cx="143" cy="142" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />

        {/* Tay áo Chẽn: thu nhỏ dần từ nách tới cổ tay vừa khít */}
        {/* Tay trái */}
        <path
          d="M84 65 L48 138 L57 142 L95 95 Z"
          fill="#EBF0F5"
          stroke="#1E3F5A"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="48" y1="138" x2="57" y2="142" stroke="#1E3F5A" strokeWidth="1.8" />

        {/* Tay phải */}
        <path
          d="M156 65 L192 138 L183 142 L145 95 Z"
          fill="#EBF0F5"
          stroke="#1E3F5A"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="192" y1="138" x2="183" y2="142" stroke="#1E3F5A" strokeWidth="1.8" />

        {/* Gấu áo & đường viền chân tà */}
        <line x1="66" y1="215" x2="174" y2="215" stroke="#1E3F5A" strokeWidth="1.8" />

        {/* Nhãn chữ nét thanh lịch */}
        <rect x="52" y="260" width="136" height="15" rx="3" fill="#FFFFFF" stroke="#D5CBB9" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#1E3F5A" fontWeight="600" letterSpacing="0.4">
          CỔ ĐỨNG · 5 CÚC CÀI BÊN PHẢI · TAY CHẼN
        </text>
      </svg>
    </div>
  );
};

/**
 * 2. Áo Tấc (Áo Thụng)
 * Nhận diện: Ống tay hình chữ nhật dài rộng (30-50cm) buông thẳng, không bó nách,
 * cổ đứng vuông ôm khít (khoảng 4cm), 5 cúc kim loại/đá/gỗ xếp hình chữ quảng.
 */
export const AoTacIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#FAF6F2] rounded-xl overflow-hidden p-2 border border-[#E8DFD5] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="140" r="105" fill="#F5EFE8" stroke="#E6DACD" strokeWidth="1" strokeDasharray="3 3" />

        {/* Cổ đứng lập lĩnh cao khoảng 4cm */}
        <rect x="105" y="48" width="30" height="16" rx="2" fill="#F4E8E3" stroke="#8E2516" strokeWidth="1.8" />
        <line x1="120" y1="48" x2="120" y2="64" stroke="#8E2516" strokeWidth="1.2" />
        <circle cx="120" cy="56" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />

        {/* Quần thụng màu trắng rộng */}
        <path d="M88 215 L82 255 L114 255 L116 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
        <path d="M124 215 L126 255 L158 255 L152 215 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

        {/* Thân áo thụng dáng rộng dài đến gối */}
        <path
          d="M82 64 L158 64 L180 215 L60 215 Z"
          fill="#FDF1EC"
          stroke="#B93826"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Đường cài khuy chéo bên phải */}
        <path d="M120 64 Q138 88 144 116 L146 215" stroke="#B93826" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* 5 Cúc cúc kim loại/gỗ xếp hình chữ quảng */}
        <circle cx="128" cy="72" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        <circle cx="138" cy="90" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        <circle cx="144" cy="112" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        <circle cx="145" cy="134" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />
        <circle cx="145" cy="154" r="2.8" fill="#C88E1B" stroke="#684A10" strokeWidth="1.2" />

        {/* ĐẶC ĐIỂM CỐT LÕI: Tay áo THỤNG hình chữ nhật dài rộng buông thẳng không bó nách */}
        {/* Ống tay trái rộng 40cm, buông rủ dài */}
        <path
          d="M82 64 L34 104 L34 195 L72 195 L88 115 Z"
          fill="#F7E4DC"
          stroke="#B93826"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Viền cửa tay chữ nhật thẳng */}
        <line x1="34" y1="195" x2="72" y2="195" stroke="#8E2516" strokeWidth="2.5" />

        {/* Ống tay phải rộng 40cm, buông rủ dài */}
        <path
          d="M158 64 L206 104 L206 195 L168 195 L152 115 Z"
          fill="#F7E4DC"
          stroke="#B93826"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Viền cửa tay chữ nhật thẳng */}
        <line x1="168" y1="195" x2="206" y2="195" stroke="#8E2516" strokeWidth="2.5" />

        <line x1="60" y1="215" x2="180" y2="215" stroke="#B93826" strokeWidth="1.8" />

        {/* Nhãn nhận diện */}
        <rect x="48" y="260" width="144" height="15" rx="3" fill="#FFFFFF" stroke="#E6DACD" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#B93826" fontWeight="600" letterSpacing="0.4">
          TAY THỤNG CHỮ NHẬT RỘNG · CỔ ĐỨNG 4CM
        </text>
      </svg>
    </div>
  );
};

/**
 * 3. Áo Giao Lĩnh (Tràng Vạt)
 * Nhận diện: Cổ áo khoét chéo hình chữ V trước ngực (vạt trái đè lên vạt phải),
 * không dùng cúc cài mà giữ phom bằng dây buộc và đai thắt lụa ngang eo.
 */
export const AoGiaoLinhIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#F3F8F5] rounded-xl overflow-hidden p-2 border border-[#DFEAE4] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="140" r="105" fill="#EBF4F0" stroke="#D3E5DC" strokeWidth="1" strokeDasharray="3 3" />

        {/* Lớp thường (váy quây che thân dưới) */}
        <path d="M78 185 L162 185 L174 255 L66 255 Z" fill="#E2EEE9" stroke="#9ABCB0" strokeWidth="1.5" />

        {/* Thân áo Giao lĩnh dáng dài rộng rãi */}
        <path
          d="M84 56 L156 56 L178 215 L62 215 Z"
          fill="#E7F2ED"
          stroke="#2E6254"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Vạt phải nằm bên trong (đường nét đứt nhẹ) */}
        <path d="M142 56 L104 108 L104 215" stroke="#7BA89B" strokeWidth="1.4" strokeDasharray="3 2" />

        {/* ĐẶC ĐIỂM CỐT LÕI: Cổ chéo chữ V - VẠT TRÁI ĐÈ LÊN VẠT PHẢI */}
        <path
          d="M98 56 L120 108 L160 152 L164 215"
          fill="#D9EBE3"
          stroke="#2E6254"
          strokeWidth="1.8"
        />
        {/* Nẹp viền cổ áo giao lĩnh chữ V */}
        <path d="M98 56 L120 106 L148 56" stroke="#2E6254" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M102 56 L120 102 L144 56" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tay áo dài thẳng, phom ống rộng vừa phải buông rủ */}
        <path
          d="M84 56 L38 125 L56 160 L86 108 Z"
          fill="#E7F2ED"
          stroke="#2E6254"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M156 56 L202 125 L184 160 L154 108 Z"
          fill="#E7F2ED"
          stroke="#2E6254"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Đai thắt lụa ngang eo (không dùng khuy cúc) */}
        <rect x="74" y="142" width="92" height="12" rx="2" fill="#D4A017" stroke="#8E6A0E" strokeWidth="1.5" />
        {/* Hai dải lụa thùy rủ xuống */}
        <path d="M112 154 L108 205 L118 205 L120 154 Z" fill="#D4A017" stroke="#8E6A0E" strokeWidth="1" />
        <path d="M120 154 L122 198 L130 198 L126 154 Z" fill="#E5B14B" stroke="#8E6A0E" strokeWidth="1" />

        <line x1="62" y1="215" x2="178" y2="215" stroke="#2E6254" strokeWidth="1.8" />

        {/* Nhãn nhận diện */}
        <rect x="44" y="260" width="152" height="15" rx="3" fill="#FFFFFF" stroke="#D3E5DC" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#2E6254" fontWeight="600" letterSpacing="0.4">
          CỔ CHÉO CHỮ V · VẠT TRÁI ĐÈ PHẢI · ĐAI THẮT
        </text>
      </svg>
    </div>
  );
};

/**
 * 4. Áo Tứ Thân
 * Nhận diện: Áo khoác ngoài 4 thân có đường sống lưng ở giữa, cổ rất thấp,
 * hai vạt trước buông thõng hoặc thắt nút ở bụng, lộ lớp áo Yếm đào lót trong, váy đụp đen xòe.
 */
export const AoTuThanIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#FAF7F2] rounded-xl overflow-hidden p-2 border border-[#EAE2D5] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="140" r="105" fill="#F4EFE6" stroke="#E5DEC9" strokeWidth="1" strokeDasharray="3 3" />

        {/* Váy đụp xòe đen truyền thống */}
        <path d="M76 150 L164 150 L184 255 L56 255 Z" fill="#252422" stroke="#161514" strokeWidth="1.8" />

        {/* Lớp áo Yếm đào lót trong (cổ tròn viền dây đeo cổ) */}
        <path d="M106 68 L134 68 L144 140 L96 140 Z" fill="#D9534F" stroke="#9C2A26" strokeWidth="1.4" />
        <path d="M112 68 Q120 74 128 68" stroke="#9C2A26" strokeWidth="1.2" />

        {/* Dải yếm thắt eo (ruột nghé xanh/vàng) */}
        <rect x="94" y="136" width="52" height="8" rx="2" fill="#E5B14B" stroke="#8E6A0E" strokeWidth="1" />

        {/* ĐẶC ĐIỂM CỐT LÕI: Thân sau ghép từ 2 mảnh với ĐƯỜNG NỐI SỐNG LƯNG */}
        <path
          d="M88 64 L152 64 L164 215 L76 215 Z"
          fill="#F5EDE4"
          stroke="#7A4D2B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Đường sống lưng rõ ràng giữa thân sau */}
        <line x1="120" y1="64" x2="120" y2="215" stroke="#7A4D2B" strokeWidth="1.8" strokeDasharray="4 3" />

        {/* Hai vạt trước mở dọc từ trên xuống và thắt nút ở bụng */}
        {/* Vạt trước trái */}
        <path
          d="M88 64 L80 148 L114 152 L98 72 Z"
          fill="#EBDCCF"
          stroke="#7A4D2B"
          strokeWidth="1.6"
        />
        {/* Vạt trước phải */}
        <path
          d="M152 64 L160 148 L126 152 L142 72 Z"
          fill="#EBDCCF"
          stroke="#7A4D2B"
          strokeWidth="1.6"
        />

        {/* Nút thắt hai vạt trước tại bụng */}
        <ellipse cx="120" cy="154" rx="8" ry="6" fill="#C29B7F" stroke="#7A4D2B" strokeWidth="1.5" />
        {/* Hai dải vạt thắt rủ xuống tự nhiên */}
        <path d="M116 158 L108 215 L116 215 L120 160 Z" fill="#EBDCCF" stroke="#7A4D2B" strokeWidth="1.4" />
        <path d="M124 158 L132 215 L124 215 L120 160 Z" fill="#EBDCCF" stroke="#7A4D2B" strokeWidth="1.4" />

        {/* Tay áo chẽn */}
        <path
          d="M88 64 L52 130 L60 134 L96 90 Z"
          fill="#F5EDE4"
          stroke="#7A4D2B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M152 64 L188 130 L180 134 L144 90 Z"
          fill="#F5EDE4"
          stroke="#7A4D2B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Nhãn nhận diện */}
        <rect x="42" y="260" width="156" height="15" rx="3" fill="#FFFFFF" stroke="#E5DEC9" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#7A4D2B" fontWeight="600" letterSpacing="0.4">
          ĐƯỜNG SỐNG LƯNG · HAI VẠT THẮT NÚT · ÁO YẾM
        </text>
      </svg>
    </div>
  );
};

/**
 * 5. Áo Dài Hiện Đại (Lemur / Lê Phổ / Raglan)
 * Nhận diện: Dáng áo ôm sát thon thả, cổ đứng cao kín đáo, đường ráp chéo tay Raglan,
 * hàng cúc bấm vai phải, hai tà dài xẻ hai bên hông từ eo, quần dài trắng.
 */
export const AoDaiTanThoiIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#FAF4F4] rounded-xl overflow-hidden p-2 border border-[#EBDCDC] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="140" r="105" fill="#F6ECEC" stroke="#E5D1D1" strokeWidth="1" strokeDasharray="3 3" />

        {/* Quần lụa dài trắng ống suông rộng */}
        <path d="M96 130 L84 255 L114 255 L118 130 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />
        <path d="M122 130 L126 255 L156 255 L144 130 Z" fill="#FFFFFF" stroke="#CFC6B6" strokeWidth="1.5" />

        {/* Dáng Áo Dài: ÔM EO, 2 TÀ DÀI CHẤM GÓT */}
        {/* Tà trước thon gọn xẻ hai bên eo */}
        <path
          d="M102 54 L138 54 Q146 100 144 128 L152 240 L88 240 L96 128 Q94 100 102 54 Z"
          fill="#FCECEF"
          stroke="#9C2A3B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Cổ áo đứng cao kín cổ (Áo Lê Phổ) */}
        <rect x="110" y="44" width="20" height="14" rx="2" fill="#F8DFE4" stroke="#9C2A3B" strokeWidth="1.8" />

        {/* ĐẶC ĐIỂM CỐT LÕI 1: Đường ráp chéo tay RAGLAN từ cổ xuống nách */}
        <line x1="110" y1="54" x2="88" y2="85" stroke="#9C2A3B" strokeWidth="1.6" strokeDasharray="3 2" />
        <line x1="130" y1="54" x2="152" y2="85" stroke="#9C2A3B" strokeWidth="1.6" strokeDasharray="3 2" />

        {/* ĐẶC ĐIỂM CỐT LÕI 2: Hàng cúc bấm kim loại chạy từ cổ sang vai phải và dọc bên sườn */}
        <circle cx="122" cy="51" r="2" fill="#FFFFFF" stroke="#9C2A3B" strokeWidth="1" />
        <circle cx="128" cy="62" r="2" fill="#FFFFFF" stroke="#9C2A3B" strokeWidth="1" />
        <circle cx="137" cy="74" r="2" fill="#FFFFFF" stroke="#9C2A3B" strokeWidth="1" />
        <circle cx="142" cy="92" r="2" fill="#FFFFFF" stroke="#9C2A3B" strokeWidth="1" />
        <circle cx="144" cy="112" r="2" fill="#FFFFFF" stroke="#9C2A3B" strokeWidth="1" />
        <circle cx="144" cy="128" r="2.2" fill="#C88E1B" stroke="#684A10" strokeWidth="1" />

        {/* ĐẶC ĐIỂM CỐT LÕI 3: Điểm xẻ tà cao ở hai bên hông từ eo xuống */}
        <path d="M96 128 L88 240" stroke="#9C2A3B" strokeWidth="1.8" />
        <path d="M144 128 L152 240" stroke="#9C2A3B" strokeWidth="1.8" />
        <circle cx="96" cy="128" r="2" fill="#9C2A3B" />
        <circle cx="144" cy="128" r="2" fill="#9C2A3B" />

        {/* Tay áo ôm dài thon thả */}
        <path
          d="M93 64 L56 142 L65 145 L94 92 Z"
          fill="#FCECEF"
          stroke="#9C2A3B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M147 64 L184 142 L175 145 L146 92 Z"
          fill="#FCECEF"
          stroke="#9C2A3B"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Nhãn nhận diện */}
        <rect x="42" y="260" width="156" height="15" rx="3" fill="#FFFFFF" stroke="#E5D1D1" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#9C2A3B" fontWeight="600" letterSpacing="0.4">
          TAY RAGLAN · CÚC BẤM SƯỜN · 2 TÀ XẺ EO
        </text>
      </svg>
    </div>
  );
};

/**
 * 6. Áo Bà Ba
 * Nhận diện: Áo ngang hông hoặc dài hơn, thân ôm nhẹ, cổ tròn hoặc cổ đứng thấp,
 * hàng cúc dọc cài chính giữa thân trước, xẻ tà ở hông, mặc cùng quần lụa đen rộng.
 */
export const AoBaBaIllustration: React.FC<SVGComponentProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`relative flex items-center justify-center bg-[#F6F4F1] rounded-xl overflow-hidden p-2 border border-[#E3DED8] ${className}`}>
      <svg
        viewBox="0 0 240 280"
        className="w-full h-full max-h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="120" cy="140" r="105" fill="#EFECE6" stroke="#DCD5CC" strokeWidth="1" strokeDasharray="3 3" />

        {/* Quần lụa đen ống rộng Nam Bộ */}
        <path d="M88 152 L76 255 L114 255 L118 152 Z" fill="#1C1B19" stroke="#0D0C0A" strokeWidth="1.5" />
        <path d="M122 152 L126 255 L164 255 L152 152 Z" fill="#1C1B19" stroke="#0D0C0A" strokeWidth="1.5" />

        {/* Dáng Áo Bà Ba: Dài ngang hông, chít eo nhẹ */}
        <path
          d="M88 64 L152 64 Q158 110 162 165 L78 165 Q82 110 88 64 Z"
          fill="#EDE7DD"
          stroke="#4A3B32"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* ĐẶC ĐIỂM CỐT LÕI 1: Cổ áo tròn nhẹ nhàng, thanh thoát */}
        <path d="M106 64 Q120 78 134 64" fill="#F6F4F1" stroke="#4A3B32" strokeWidth="1.8" />

        {/* ĐẶC ĐIỂM CỐT LÕI 2: HÀNG CÚC DỌC CHÍNH GIỮA THÂN TRƯỚC */}
        <line x1="120" y1="74" x2="120" y2="165" stroke="#4A3B32" strokeWidth="1.5" />
        <circle cx="120" cy="85" r="2.8" fill="#FDFBF7" stroke="#4A3B32" strokeWidth="1.2" />
        <circle cx="120" cy="102" r="2.8" fill="#FDFBF7" stroke="#4A3B32" strokeWidth="1.2" />
        <circle cx="120" cy="119" r="2.8" fill="#FDFBF7" stroke="#4A3B32" strokeWidth="1.2" />
        <circle cx="120" cy="136" r="2.8" fill="#FDFBF7" stroke="#4A3B32" strokeWidth="1.2" />
        <circle cx="120" cy="153" r="2.8" fill="#FDFBF7" stroke="#4A3B32" strokeWidth="1.2" />

        {/* ĐẶC ĐIỂM CỐT LÕI 3: Xẻ tà ngắn ở hai bên hông */}
        <line x1="82" y1="148" x2="82" y2="165" stroke="#4A3B32" strokeWidth="2" />
        <line x1="158" y1="148" x2="158" y2="165" stroke="#4A3B32" strokeWidth="2" />

        {/* Hai túi nhỏ tiện dụng phía trước (theo đặc trưng dân dã) */}
        <rect x="92" y="138" width="18" height="18" rx="2" fill="#E3DDD1" stroke="#4A3B32" strokeWidth="1.2" />
        <rect x="130" y="138" width="18" height="18" rx="2" fill="#E3DDD1" stroke="#4A3B32" strokeWidth="1.2" />

        {/* Tay áo dài */}
        <path
          d="M88 64 L50 138 L60 142 L94 92 Z"
          fill="#EDE7DD"
          stroke="#4A3B32"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M152 64 L190 138 L180 142 L146 92 Z"
          fill="#EDE7DD"
          stroke="#4A3B32"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Khăn rằn vắt chéo cổ mộc mạc Nam Bộ */}
        <path d="M102 72 Q120 86 138 72 L142 80 Q120 94 98 80 Z" fill="#FFFFFF" stroke="#161A1D" strokeWidth="1" strokeDasharray="3 1.5" />

        {/* Nhãn nhận diện */}
        <rect x="42" y="260" width="156" height="15" rx="3" fill="#FFFFFF" stroke="#DCD5CC" strokeWidth="1" />
        <text x="120" y="271" textAnchor="middle" fontSize="8" fill="#4A3B32" fontWeight="600" letterSpacing="0.4">
          CỔ TRÒN · HÀNG CÚC DỌC GIỮA · DÀI NGANG HÔNG
        </text>
      </svg>
    </div>
  );
};

/**
 * Master Dispatcher Component
 */
export const OutfitVectorIllustration: React.FC<{
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ id, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-full h-36',
    md: 'w-full h-52',
    lg: 'w-full h-80',
  }[size];

  switch (id) {
    case 'ao_ngu_than_tay_chen':
      return <AoNguThanIllustration className={`${sizeClasses} ${className}`} size={size} />;

    case 'ao_tac':
      return <AoTacIllustration className={`${sizeClasses} ${className}`} size={size} />;

    case 'ao_giao_linh':
      return <AoGiaoLinhIllustration className={`${sizeClasses} ${className}`} size={size} />;

    case 'ao_tu_than':
      return <AoTuThanIllustration className={`${sizeClasses} ${className}`} size={size} />;

    case 'ao_dai_tan_thoi':
      return <AoDaiTanThoiIllustration className={`${sizeClasses} ${className}`} size={size} />;

    case 'ao_ba_ba':
      return <AoBaBaIllustration className={`${sizeClasses} ${className}`} size={size} />;

    default:
      return <AoNguThanIllustration className={`${sizeClasses} ${className}`} size={size} />;
  }
};
