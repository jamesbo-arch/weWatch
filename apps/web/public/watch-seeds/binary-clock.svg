<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="matrix-blur" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="0.8"/>
    </filter>
    <clipPath id="face-clip-bc">
      <circle cx="200" cy="200" r="182"/>
    </clipPath>
  </defs>

  <!-- Bezel -->
  <circle cx="200" cy="200" r="196" fill="#000000"/>
  <!-- Face background (pure black) -->
  <circle cx="200" cy="200" r="182" fill="#000000"/>

  <!-- Matrix-style falling characters (very low opacity background) -->
  <g clip-path="url(#face-clip-bc)" font-family="'Courier New', Courier, monospace" font-size="9"
     fill="#00ffff" fill-opacity="0.04" filter="url(#matrix-blur)">
    <text x="38" y="45">1</text><text x="38" y="58">0</text><text x="38" y="71">1</text>
    <text x="38" y="84">1</text><text x="38" y="97">0</text><text x="38" y="110">0</text>
    <text x="38" y="123">1</text><text x="38" y="136">1</text>
    <text x="56" y="55">0</text><text x="56" y="68">1</text><text x="56" y="81">0</text>
    <text x="56" y="94">1</text><text x="56" y="107">0</text><text x="56" y="120">1</text>
    <text x="56" y="133">0</text><text x="56" y="146">1</text>
    <text x="74" y="40">1</text><text x="74" y="53">1</text><text x="74" y="66">0</text>
    <text x="74" y="79">0</text><text x="74" y="92">1</text>
    <text x="330" y="50">0</text><text x="330" y="63">1</text><text x="330" y="76">1</text>
    <text x="330" y="89">0</text><text x="330" y="102">1</text><text x="330" y="115">0</text>
    <text x="348" y="44">1</text><text x="348" y="57">0</text><text x="348" y="70">0</text>
    <text x="348" y="83">1</text><text x="348" y="96">1</text><text x="348" y="109">0</text>
    <text x="362" y="52">0</text><text x="362" y="65">1</text><text x="362" y="78">1</text>
    <text x="362" y="91">0</text>
    <text x="38" y="290">1</text><text x="38" y="303">0</text><text x="38" y="316">1</text>
    <text x="38" y="329">0</text><text x="38" y="342">1</text>
    <text x="56" y="278">0</text><text x="56" y="291">1</text><text x="56" y="304">0</text>
    <text x="56" y="317">1</text><text x="56" y="330">0</text>
    <text x="330" y="295">1</text><text x="330" y="308">0</text><text x="330" y="321">1</text>
    <text x="330" y="334">1</text>
    <text x="348" y="285">0</text><text x="348" y="298">1</text><text x="348" y="311">0</text>
    <text x="348" y="324">0</text><text x="348" y="337">1</text>
    <text x="362" y="302">1</text><text x="362" y="315">1</text><text x="362" y="328">0</text>
  </g>

  <!-- Thin outer cyan ring -->
  <circle cx="200" cy="200" r="178" fill="none" stroke="#00ffff" stroke-opacity="0.12" stroke-width="1"/>

  <!-- BINARY CLOCK DISPLAY -->
  <!-- Time: 09:15:32 -->
  <!-- Hours 09 = 0b001001 (but we show columns for H tens, H units, M tens, M units, S tens, S units) -->
  <!-- Binary representation:
       H tens: 0 = 0 (1 bit shown: top only needed)
       H units: 9 = 1001
       M tens: 1 = 001
       M units: 5 = 0101
       S tens: 3 = 011
       S units: 2 = 010
       We'll show 4 rows (bit 8,4,2,1 from top) x 6 columns -->

  <!-- Column labels (top) -->
  <g font-family="system-ui, -apple-system, sans-serif" font-size="9" fill="#00ffff" fill-opacity="0.45" text-anchor="middle">
    <text x="88" y="105">H</text>
    <text x="118" y="105">H</text>
    <text x="148" y="105">M</text>
    <text x="178" y="105">M</text>
    <text x="208" y="105">S</text>
    <text x="238" y="105">S</text>
    <text x="80" y="116">tens</text>
    <text x="118" y="116">units</text>
    <text x="148" y="116">tens</text>
    <text x="178" y="116">units</text>
    <text x="208" y="116">tens</text>
    <text x="238" y="116">units</text>
  </g>

  <!-- Row labels (left) — bit values -->
  <g font-family="'Courier New', Courier, monospace" font-size="8" fill="#00ffff" fill-opacity="0.3" text-anchor="end">
    <text x="72" y="144">8</text>
    <text x="72" y="172">4</text>
    <text x="72" y="200">2</text>
    <text x="72" y="228">1</text>
  </g>

  <!-- Dot grid — OFF dots (dim) -->
  <!-- Col 1 (H tens = 0): 0,0,0,0 all off — wait, 0=0000 -->
  <g fill="#00ffff" fill-opacity="0.07">
    <!-- Col 1 (x=88): H tens = 0 → 0000 — all off -->
    <circle cx="88" cy="136" r="10"/>
    <circle cx="88" cy="164" r="10"/>
    <circle cx="88" cy="192" r="10"/>
    <circle cx="88" cy="220" r="10"/>
    <!-- Col 2 (x=118): H units = 9 → 1001 — on/off/off/on -->
    <circle cx="118" cy="164" r="10"/>
    <circle cx="118" cy="192" r="10"/>
    <!-- Col 3 (x=148): M tens = 1 → 0001 — off/off/off/on -->
    <circle cx="148" cy="136" r="10"/>
    <circle cx="148" cy="164" r="10"/>
    <circle cx="148" cy="192" r="10"/>
    <!-- Col 4 (x=178): M units = 5 → 0101 — off/on/off/on -->
    <circle cx="178" cy="136" r="10"/>
    <circle cx="178" cy="192" r="10"/>
    <!-- Col 5 (x=208): S tens = 3 → 011 (3 bits) — off/on/on -->
    <circle cx="208" cy="136" r="10"/>
    <!-- Col 6 (x=238): S units = 2 → 010 — off/on/off -->
    <circle cx="238" cy="136" r="10"/>
    <circle cx="238" cy="192" r="10"/>
    <circle cx="238" cy="220" r="10"/>
  </g>

  <!-- ON dots (lit — white with cyan glow) -->
  <!-- Col 1: all off (no lit dots) -->
  <!-- Col 2: H units = 9 → 1001 → rows 8 and 1 lit -->
  <circle cx="118" cy="136" r="10" fill="#ffffff" fill-opacity="0.95" filter="url(#dot-glow)"/>
  <circle cx="118" cy="220" r="10" fill="#00ffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <!-- Col 3: M tens = 1 → 0001 → row 1 lit -->
  <circle cx="148" cy="220" r="10" fill="#00ffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <!-- Col 4: M units = 5 → 0101 → rows 4 and 1 lit -->
  <circle cx="178" cy="164" r="10" fill="#ffffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <circle cx="178" cy="220" r="10" fill="#00ffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <!-- Col 5: S tens = 3 → 011 → rows 2 and 1 lit -->
  <circle cx="208" cy="164" r="10" fill="#00ffff" fill-opacity="0.85" filter="url(#dot-glow)"/>
  <circle cx="208" cy="192" r="10" fill="#ffffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <circle cx="208" cy="220" r="10" fill="#00ffff" fill-opacity="0.9" filter="url(#dot-glow)"/>
  <!-- Col 6: S units = 2 → 010 → row 2 lit -->
  <circle cx="238" cy="164" r="10" fill="#ffffff" fill-opacity="0.85" filter="url(#dot-glow)"/>

  <!-- Separator colon indicators -->
  <rect x="131" y="168" width="3" height="3" rx="1" fill="#00ffff" fill-opacity="0.5"/>
  <rect x="131" y="178" width="3" height="3" rx="1" fill="#00ffff" fill-opacity="0.5"/>
  <rect x="191" y="168" width="3" height="3" rx="1" fill="#00ffff" fill-opacity="0.5"/>
  <rect x="191" y="178" width="3" height="3" rx="1" fill="#00ffff" fill-opacity="0.5"/>

  <!-- Decoded time (plain readable below) -->
  <text x="200" y="266" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="28" font-weight="700" letter-spacing="4"
    fill="#00ffff"
    filter="url(#cyan-glow)">09:15:32</text>

  <!-- Label -->
  <text x="200" y="56" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="9" font-weight="600" letter-spacing="3"
    fill="#00ffff" fill-opacity="0.35">BINARY CLOCK</text>

  <!-- Data strip bottom -->
  <line x1="80" y1="284" x2="320" y2="284" stroke="#00ffff" stroke-opacity="0.12" stroke-width="1"/>

  <text x="132" y="304" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="8" fill="#00ffff" fill-opacity="0.4">STEPS</text>
  <text x="132" y="320" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="14" font-weight="700"
    fill="#00ffff" fill-opacity="0.75">11010</text>
  <text x="132" y="332" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="7" fill="#00ffff" fill-opacity="0.3">= 26d</text>

  <line x1="200" y1="288" x2="200" y2="338" stroke="#00ffff" stroke-opacity="0.1" stroke-width="1"/>

  <text x="268" y="304" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="8" fill="#00ffff" fill-opacity="0.4">BATTERY</text>
  <text x="268" y="320" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="14" font-weight="700"
    fill="#ffffff" fill-opacity="0.75">1000101</text>
  <text x="268" y="332" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="7" fill="#00ffff" fill-opacity="0.3">= 69%</text>

  <!-- Bottom date -->
  <text x="200" y="358" text-anchor="middle"
    font-family="'Courier New', Courier, monospace"
    font-size="9" fill="#00ffff" fill-opacity="0.25">0x07E2_05_08 THU</text>
</svg>
