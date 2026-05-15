<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="rg-face" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#fdf6f0"/>
      <stop offset="100%" stop-color="#f5ede6"/>
    </radialGradient>
    <linearGradient id="rg-bezel" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#c8848e"/>
      <stop offset="40%" stop-color="#b76e79"/>
      <stop offset="100%" stop-color="#8e4a54"/>
    </linearGradient>
    <linearGradient id="hour-hand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c8848e"/>
      <stop offset="100%" stop-color="#b76e79"/>
    </linearGradient>
    <linearGradient id="minute-hand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4919b"/>
      <stop offset="100%" stop-color="#b76e79"/>
    </linearGradient>
    <filter id="rg-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#b76e79" flood-opacity="0.3"/>
    </filter>
    <filter id="subtle-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="face-clip-rg">
      <circle cx="200" cy="200" r="182"/>
    </clipPath>
  </defs>

  <!-- Outer bezel (rose gold) -->
  <circle cx="200" cy="200" r="196" fill="url(#rg-bezel)"/>
  <!-- Inner bezel ring detail -->
  <circle cx="200" cy="200" r="188" fill="none" stroke="#fdf6f0" stroke-opacity="0.2" stroke-width="1"/>
  <!-- Face background (cream white) -->
  <circle cx="200" cy="200" r="182" fill="url(#rg-face)"/>

  <!-- Thin rose gold accent ring inside face -->
  <circle cx="200" cy="200" r="178" fill="none" stroke="#b76e79" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="200" cy="200" r="174" fill="none" stroke="#b76e79" stroke-opacity="0.1" stroke-width="0.8"/>

  <!-- Hour markers (elegant, rose gold) -->
  <!-- 12 o'clock (top) -->
  <rect x="196" y="30" width="8" height="16" rx="2" fill="#b76e79" fill-opacity="0.7"/>
  <!-- 3 o'clock -->
  <rect x="355" y="196" width="16" height="8" rx="2" fill="#b76e79" fill-opacity="0.7"/>
  <!-- 6 o'clock -->
  <rect x="196" y="355" width="8" height="16" rx="2" fill="#b76e79" fill-opacity="0.7"/>
  <!-- 9 o'clock -->
  <rect x="30" y="196" width="16" height="8" rx="2" fill="#b76e79" fill-opacity="0.7"/>

  <!-- Minute markers (thin dots) -->
  <g fill="#b76e79" fill-opacity="0.35">
    <circle cx="200" cy="36" r="2" transform="rotate(30 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(60 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(120 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(150 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(210 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(240 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(300 200 200)"/>
    <circle cx="200" cy="36" r="2" transform="rotate(330 200 200)"/>
  </g>

  <!-- GARMIN label (subtle, rose gold) -->
  <text x="200" y="90" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="9" font-weight="300" letter-spacing="3"
    fill="#b76e79" fill-opacity="0.5">GARMIN</text>

  <!-- Date window (3 o'clock position) -->
  <rect x="298" y="188" width="36" height="24" rx="3" fill="#fdf6f0" stroke="#b76e79" stroke-opacity="0.3" stroke-width="1"/>
  <text x="316" y="204" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="12" font-weight="600"
    fill="#6b3744">08</text>

  <!-- Hour hand (pointing ~9:15 → hour at ~280°) -->
  <!-- 9:15 → hour hand at 9*30 + 15/2 = 277.5° from 12 -->
  <g transform="rotate(277.5 200 200)" filter="url(#rg-shadow)">
    <rect x="196" y="95" width="8" height="108" rx="4" fill="url(#hour-hand-grad)"/>
    <!-- Lume pip -->
    <rect x="197.5" y="97" width="5" height="12" rx="2" fill="#fdf6f0" fill-opacity="0.5"/>
  </g>

  <!-- Minute hand (pointing ~9:15 → minute at ~90°) -->
  <!-- 15 min → 90° from 12 -->
  <g transform="rotate(90 200 200)" filter="url(#rg-shadow)">
    <rect x="197.5" y="48" width="5" height="154" rx="2.5" fill="url(#minute-hand-grad)"/>
    <!-- Lume pip -->
    <rect x="198.5" y="50" width="3" height="14" rx="1.5" fill="#fdf6f0" fill-opacity="0.5"/>
  </g>

  <!-- Seconds hand (thin red-ish, pointing ~32 sec → ~192°) -->
  <g transform="rotate(192 200 200)">
    <line x1="200" y1="60" x2="200" y2="230" stroke="#dc8e97" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="200" y1="230" x2="200" y2="248" stroke="#dc8e97" stroke-width="1.5" stroke-opacity="0.4"/>
  </g>

  <!-- Center cap -->
  <circle cx="200" cy="200" r="6" fill="#b76e79"/>
  <circle cx="200" cy="200" r="3" fill="#fdf6f0" fill-opacity="0.8"/>

  <!-- Subdial (HR) at 6 o'clock area -->
  <circle cx="200" cy="308" r="28" fill="#f5ede6" stroke="#b76e79" stroke-opacity="0.25" stroke-width="1"/>
  <text x="200" y="302" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="7" font-weight="400" letter-spacing="1.5"
    fill="#b76e79" fill-opacity="0.65">HR</text>
  <text x="200" y="318" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="14" font-weight="600"
    fill="#6b3744">72</text>
  <text x="200" y="330" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="6" fill="#b76e79" fill-opacity="0.5">bpm</text>

  <!-- Day of week (top) -->
  <text x="200" y="134" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="11" font-weight="300" letter-spacing="4"
    fill="#b76e79" fill-opacity="0.65">THURSDAY</text>
</svg>
