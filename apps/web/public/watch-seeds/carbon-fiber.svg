<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <!-- Carbon fiber weave pattern -->
    <pattern id="carbon-weave" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect x="0" y="0" width="4" height="4" fill="#222222"/>
      <rect x="4" y="4" width="4" height="4" fill="#222222"/>
      <rect x="0" y="0" width="4" height="4" fill="#2a2a2a" fill-opacity="0.6"/>
      <rect x="4" y="0" width="4" height="4" fill="#1a1a1a"/>
      <rect x="0" y="4" width="4" height="4" fill="#1a1a1a"/>
      <rect x="4" y="4" width="4" height="4" fill="#252525" fill-opacity="0.7"/>
    </pattern>
    <!-- Highlight sheen -->
    <linearGradient id="carbon-sheen" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="red-arc" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#ff4444"/>
    </linearGradient>
    <filter id="red-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="silver-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="face-clip-cf">
      <circle cx="200" cy="200" r="182"/>
    </clipPath>
  </defs>

  <!-- Bezel (dark metal) -->
  <circle cx="200" cy="200" r="196" fill="#111111"/>
  <!-- Face with carbon fiber texture -->
  <circle cx="200" cy="200" r="182" fill="url(#carbon-weave)"/>
  <!-- Sheen overlay -->
  <circle cx="200" cy="200" r="182" fill="url(#carbon-sheen)"/>

  <!-- Outer silver accent ring -->
  <circle cx="200" cy="200" r="182" fill="none" stroke="#888888" stroke-width="2" stroke-opacity="0.6"/>
  <!-- Inner silver ring -->
  <circle cx="200" cy="200" r="175" fill="none" stroke="#555555" stroke-width="1" stroke-opacity="0.4"/>

  <!-- Red accent ring (motorsport) -->
  <circle cx="200" cy="200" r="178" fill="none" stroke="#dc2626" stroke-width="2" stroke-opacity="0.7"
    filter="url(#red-glow)"/>

  <!-- Tachometer arc at bottom (r=165, bottom half) -->
  <!-- Arc from ~120deg to ~420deg (300deg sweep) bottom -->
  <!-- Circumference at r=165: 1036.7; full circle offset -->
  <!-- Track ring -->
  <circle cx="200" cy="200" r="165"
    fill="none" stroke="#333333" stroke-width="8" stroke-opacity="0.8"
    stroke-dasharray="778 259"
    stroke-dashoffset="-130"
    transform="rotate(-90 200 200)"/>
  <!-- Tach fill (85% redline approach) -->
  <circle cx="200" cy="200" r="165"
    fill="none" stroke="#dc2626" stroke-width="8"
    stroke-linecap="round"
    stroke-dasharray="660 1036"
    stroke-dashoffset="-130"
    transform="rotate(-90 200 200)"
    filter="url(#red-glow)"/>
  <!-- Tach labels -->
  <text x="70" y="295" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" fill="#888888">0</text>
  <text x="200" y="382" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" fill="#888888">5</text>
  <text x="330" y="295" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" fill="#888888">10</text>
  <text x="200" y="372" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="7" letter-spacing="1" fill="#dc2626" fill-opacity="0.6">x1000 RPM</text>

  <!-- Tick marks (silver, precision) -->
  <g stroke="#888888" stroke-opacity="0.5" stroke-width="1.5">
    <line x1="200" y1="22" x2="200" y2="35" transform="rotate(0 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(30 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(60 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="35" transform="rotate(90 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(120 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(150 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="35" transform="rotate(180 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(210 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(240 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="35" transform="rotate(270 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(300 200 200)"/>
    <line x1="200" y1="22" x2="200" y2="30" transform="rotate(330 200 200)"/>
  </g>

  <!-- GARMIN label -->
  <text x="200" y="82" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="9" font-weight="600" letter-spacing="3"
    fill="#aaaaaa" fill-opacity="0.5">GARMIN</text>

  <!-- Main time (silver/white) -->
  <text x="200" y="198" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="72" font-weight="700" letter-spacing="-1"
    fill="#e8e8e8"
    filter="url(#silver-glow)">09:15</text>

  <!-- Date -->
  <text x="200" y="222" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="13" font-weight="400" letter-spacing="3"
    fill="#888888">THU 08</text>

  <!-- Thin red separator -->
  <line x1="155" y1="234" x2="245" y2="234" stroke="#dc2626" stroke-opacity="0.4" stroke-width="1"/>

  <!-- Lap time + HR (data fields) -->
  <text x="138" y="256" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" font-weight="600" letter-spacing="1.5"
    fill="#888888">LAP</text>
  <text x="138" y="278" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="20" font-weight="700"
    fill="#e8e8e8">1:42</text>
  <text x="138" y="292" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" fill="#dc2626" fill-opacity="0.7">LAP 3</text>

  <text x="262" y="256" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" font-weight="600" letter-spacing="1.5"
    fill="#888888">HR</text>
  <text x="262" y="278" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="20" font-weight="700"
    fill="#e8e8e8">168</text>
  <text x="262" y="292" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="8" fill="#dc2626" fill-opacity="0.7">bpm</text>

  <line x1="200" y1="245" x2="200" y2="298" stroke="#555555" stroke-opacity="0.4" stroke-width="1"/>
</svg>
