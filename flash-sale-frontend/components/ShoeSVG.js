export default function ShoeSVG({ width = 380, height = 270 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="200" cy="252" rx="170" ry="16" fill="#0a0a0a" />
      {/* Outsole */}
      <path d="M45 228 Q55 215 375 212 L388 232 Q365 248 35 244 Z" fill="#0e0e0e" stroke="#1a1a1a" strokeWidth="1"/>
      {/* Outsole tread lines */}
      <path d="M65 232 L340 228" stroke="#1a1a1a" strokeWidth="1.5" strokeDasharray="10,8"/>
      <path d="M65 237 L200 234" stroke="#151515" strokeWidth="1" strokeDasharray="6,5"/>
      {/* Midsole */}
      <path d="M48 212 Q58 195 375 192 L382 212 Z" fill="#141414" stroke="#1e1e1e" strokeWidth="0.5"/>
      {/* Main upper */}
      <path d="M55 208 Q62 148 125 122 L282 118 Q345 120 368 162 L382 208 Z" fill="#0c0c0c" stroke="#1e1e1e" strokeWidth="1"/>
      {/* Toe box */}
      <path d="M55 208 Q50 176 72 148 Q92 132 125 124 L125 202 Z" fill="#101010" stroke="#191919" strokeWidth="0.5"/>
      {/* Quarter panel */}
      <path d="M125 124 L282 118 L282 202 L125 202 Z" fill="#0a0a0a" stroke="#181818" strokeWidth="0.5"/>
      {/* Heel counter */}
      <path d="M282 118 Q342 120 368 164 L374 208 L282 202 Z" fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="0.5"/>
      {/* Ankle collar curve */}
      <path d="M282 118 Q310 110 342 118 Q360 126 370 148" stroke="#242424" strokeWidth="2" fill="none"/>
      {/* ACCENT STRIPE — main */}
      <path d="M105 172 L282 160 L288 174 L105 186 Z" fill="#d4ff1e" opacity="0.95"/>
      {/* ACCENT STRIPE — secondary */}
      <path d="M105 188 L238 180 L242 190 L105 196 Z" fill="#d4ff1e" opacity="0.35"/>
      {/* Lace area */}
      <path d="M142 128 L272 124 L278 146 L142 150 Z" fill="#121212" stroke="#1e1e1e" strokeWidth="0.5"/>
      {/* Lace eyelets */}
      {[158, 178, 198, 218, 238, 258].map((x, i) => (
        <circle key={i} cx={x} cy={139 - i * 0.3} r="2.5" fill="#080808" stroke="#252525" strokeWidth="0.8"/>
      ))}
      {/* Lace threads */}
      <path d="M158 138.5 Q168 134 178 138.2" stroke="#555" strokeWidth="1.2" fill="none"/>
      <path d="M178 138.2 Q188 142 198 138.2" stroke="#555" strokeWidth="1.2" fill="none"/>
      <path d="M198 138.2 Q208 134 218 138" stroke="#555" strokeWidth="1.2" fill="none"/>
      <path d="M218 138 Q228 142 238 138" stroke="#555" strokeWidth="1.2" fill="none"/>
      <path d="M238 138 Q248 134 258 138" stroke="#555" strokeWidth="1.2" fill="none"/>
      {/* Tongue */}
      <path d="M205 130 Q215 112 228 108 Q244 106 248 130 Z" fill="#0e0e0e" stroke="#1e1e1e" strokeWidth="0.5"/>
      <path d="M218 125 Q222 118 226 116" stroke="#252525" strokeWidth="0.8" fill="none"/>
      {/* AXIOM wordmark */}
      <text x="142" y="183" fontFamily="'Bebas Neue', cursive" fontSize="12" fill="#d4ff1e" opacity="0.55" letterSpacing="4">AXIOM</text>
      {/* Stitch detail on toe */}
      <path d="M72 165 Q68 155 74 145" stroke="#1e1e1e" strokeWidth="0.8" fill="none" strokeDasharray="3,3"/>
    </svg>
  )
}