const DEFAULTS = {
  width: 600,
  height: 400,
  R1: 1,
  R2: 2,
  K2: 5,
  scaleX: 30,
  scaleY: 15,
  speedX: 2,
  speedY: 1,
  animationSpeed: 1,
  chars: '.,-~:;=!*#$@',
  label: ' OstinUA ',
  totalFrames: 48,
  cols: 80,
  rows: 27,
  profile: 'donut',
  theme: 'dark'
};

const PROFILES = {
  donut: {
    profile: 'donut',
    R1: 1,
    R2: 2,
    K2: 5,
    scaleX: 30,
    scaleY: 15
  },
  'cube-solid': {
    profile: 'cube-solid',
    R1: 1.3,
    R2: 2,
    K2: 6,
    scaleX: 45,
    scaleY: 24
  },
  'cube-hollow': {
    profile: 'cube-hollow',
    R1: 1.4,
    R2: 2,
    K2: 6,
    scaleX: 44,
    scaleY: 24
  },
  triangle: {
    profile: 'triangle',
    R1: 1.2,
    R2: 2,
    K2: 6,
    scaleX: 44,
    scaleY: 24
  }
};

const clampInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
};

const clampFloat = (value, fallback, min, max) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
};

const escapeXml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const createConfigFromQuery = (query = {}) => {
  const safeProfile = Object.prototype.hasOwnProperty.call(PROFILES, query.profile) ? query.profile : DEFAULTS.profile;
  const profile = PROFILES[safeProfile];

  const width = clampInt(query.width, DEFAULTS.width, 240, 1600);
  const height = clampInt(query.height, DEFAULTS.height, 140, 1000);
  const cols = Math.ceil(width / 7.5);
  const rows = Math.ceil(height / 15);

  return {
    ...DEFAULTS,
    ...profile,
    width,
    height,
    cols,
    rows,
    profile: safeProfile,
    label: (query.label || DEFAULTS.label).slice(0, 40),
    chars: (query.chars || DEFAULTS.chars).slice(0, 32) || DEFAULTS.chars,
    speedX: clampFloat(query.speedX, DEFAULTS.speedX, -8, 8),
    speedY: clampFloat(query.speedY, DEFAULTS.speedY, -8, 8),
    animationSpeed: clampFloat(query.animationSpeed, DEFAULTS.animationSpeed, 0.1, 4),
    totalFrames: clampInt(query.frames, DEFAULTS.totalFrames, 8, 120),
    theme: query.theme === 'light' ? 'light' : 'dark',
    R1: clampFloat(query.R1, profile.R1, 0.3, 4),
    R2: clampFloat(query.R2, profile.R2, 0.5, 6),
    K2: clampFloat(query.K2, profile.K2, 2, 16),
    scaleX: clampInt(query.scaleX, profile.scaleX, 8, 100),
    scaleY: clampInt(query.scaleY, profile.scaleY, 8, 70)
  };
};

const createRenderer = (cfg) => {
  let currentA = 0;
  let currentB = 0;

  const plotPoint = (point, normal, b, z, charsCount) => {
    const [x0, y0, z0] = point;
    const [nx, ny, nz] = normal;

    const cosA = Math.cos(currentA);
    const sinA = Math.sin(currentA);
    const cosB = Math.cos(currentB);
    const sinB = Math.sin(currentB);

    const y1 = y0 * cosA - z0 * sinA;
    const z1 = y0 * sinA + z0 * cosA;
    const x2 = x0 * cosB - y1 * sinB;
    const y2 = x0 * sinB + y1 * cosB;
    const z2 = z1;

    const ny1 = ny * cosA - nz * sinA;
    const nz1 = ny * sinA + nz * cosA;
    const nx2 = nx * cosB - ny1 * sinB;
    const ny2 = nx * sinB + ny1 * cosB;
    const nz2 = nz1;

    const ooz = 1 / (z2 + cfg.K2);
    const centerX = Math.floor(cfg.cols / 2);
    const centerY = Math.floor(cfg.rows / 2);
    const xp = Math.floor(centerX + cfg.scaleX * ooz * x2);
    const yp = Math.floor(centerY + cfg.scaleY * ooz * y2);

    if (yp >= 0 && yp < cfg.rows && xp >= 0 && xp < cfg.cols) {
      const idx = xp + cfg.cols * yp;
      if (ooz > z[idx]) {
        z[idx] = ooz;
        const L = nx2 * -0.45 + ny2 * 0.75 - nz2 * 0.45;
        let N = Math.floor((L + 1) * 0.5 * (charsCount - 1));
        if (N < 0) N = 0;
        if (N >= charsCount) N = charsCount - 1;
        b[idx] = cfg.chars[N];
      }
    }
  };

  const drawCube = (b, z, hollow = false) => {
    const S = 1.8;
    const step = 0.08;
    const charsCount = cfg.chars.length;

    if (!hollow) {
      for (let x = -S; x <= S; x += step) {
        for (let y = -S; y <= S; y += step) {
          plotPoint([x, y, S], [0, 0, 1], b, z, charsCount);
          plotPoint([x, y, -S], [0, 0, -1], b, z, charsCount);
          plotPoint([x, S, y], [0, 1, 0], b, z, charsCount);
          plotPoint([x, -S, y], [0, -1, 0], b, z, charsCount);
          plotPoint([S, x, y], [1, 0, 0], b, z, charsCount);
          plotPoint([-S, x, y], [-1, 0, 0], b, z, charsCount);
        }
      }
      return;
    }

    const thick = 0.15;
    const tStep = 0.15;

    for (let dim = 0; dim < 3; dim++) {
      for (let a = -1; a <= 1; a += 2) {
        for (let cVal = -1; cVal <= 1; cVal += 2) {
          for (let t = -S; t <= S; t += step) {
            for (let w1 = -thick; w1 <= thick; w1 += tStep) {
              for (let w2 = -thick; w2 <= thick; w2 += tStep) {
                let x0;
                let y0;
                let z0;

                if (dim === 0) {
                  x0 = t;
                  y0 = a * S + w1;
                  z0 = cVal * S + w2;
                } else if (dim === 1) {
                  x0 = a * S + w1;
                  y0 = t;
                  z0 = cVal * S + w2;
                } else {
                  x0 = a * S + w1;
                  y0 = cVal * S + w2;
                  z0 = t;
                }

                plotPoint([x0, y0, z0], [x0 / S, y0 / S, z0 / S], b, z, charsCount);
              }
            }
          }
        }
      }
    }
  };

  const drawTriangle = (b, z) => {
    const charsCount = cfg.chars.length;
    const height = 2.2;
    const halfBase = 2.2;
    const thickness = 0.5;
    const step = 0.08;

    const v1 = [0, height, 0];
    const v2 = [-halfBase, -height, 0];
    const v3 = [halfBase, -height, 0];

    const edgePoints = (a, c) => {
      for (let t = 0; t <= 1; t += step) {
        const x = a[0] + (c[0] - a[0]) * t;
        const y = a[1] + (c[1] - a[1]) * t;
        for (let dz = -thickness; dz <= thickness; dz += 0.1) {
          plotPoint([x, y, dz], [x / halfBase, y / height, dz / thickness], b, z, charsCount);
        }
      }
    };

    edgePoints(v1, v2);
    edgePoints(v2, v3);
    edgePoints(v3, v1);
  };

  const getFrameData = (A, B) => {
    currentA = A;
    currentB = B;

    const b = Array(cfg.cols * cfg.rows).fill(' ');
    const z = Array(cfg.cols * cfg.rows).fill(0);

    if (cfg.profile === 'donut') {
      const centerX = Math.floor(cfg.cols / 2);
      const centerY = Math.floor(cfg.rows / 2);
      const numChars = cfg.chars.length;

      for (let j = 0; j < 6.28; j += 0.07) {
        for (let i = 0; i < 6.28; i += 0.02) {
          const c = Math.sin(i);
          const d = Math.cos(j);
          const e = Math.sin(A);
          const f = Math.sin(j);
          const g = Math.cos(A);
          const h = d * cfg.R1 + cfg.R2;
          const D = 1 / (c * h * e + f * g + cfg.K2);
          const l = Math.cos(i);
          const m = Math.cos(B);
          const n = Math.sin(B);
          const t = c * h * g - f * e;

          const x = Math.floor(centerX + cfg.scaleX * D * (l * h * m - t * n));
          const y = Math.floor(centerY + cfg.scaleY * D * (l * h * n + t * m));

          const o = x + cfg.cols * y;
          const N = Math.floor(8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n));

          if (y < cfg.rows && y >= 0 && x < cfg.cols && x >= 0 && D > z[o]) {
            z[o] = D;
            let charIndex = N > 0 ? Math.floor(N * (numChars / 12)) : 0;
            if (charIndex >= numChars) {
              charIndex = numChars - 1;
            }
            b[o] = cfg.chars[charIndex];
          }
        }
      }
    } else if (cfg.profile === 'cube-solid') {
      drawCube(b, z, false);
    } else if (cfg.profile === 'cube-hollow') {
      drawCube(b, z, true);
    } else if (cfg.profile === 'triangle') {
      drawTriangle(b, z);
    }

    const centerX = Math.floor(cfg.cols / 2);
    const centerY = Math.floor(cfg.rows / 2);
    const labelX = Math.floor(centerX - cfg.label.length / 2 + 3 * Math.cos(B));
    const labelY = Math.floor(centerY - 2 + Math.sin(A));
    for (let k = 0; k < cfg.label.length; k++) {
      const idx = labelX + k + cfg.cols * labelY;
      if (idx >= 0 && idx < b.length) {
        b[idx] = cfg.label[k];
      }
    }
    return b;
  };

  return { getFrameData };
};

const buildAnimatedSvgContent = (cfg) => {
  const renderer = createRenderer(cfg);
  const safeFrames = Math.max(1, cfg.totalFrames);
  const frameStepSeconds = 0.02 / cfg.animationSpeed;
  const duration = safeFrames * frameStepSeconds;
  const bg = cfg.theme === 'light' ? '#f6f8fa' : '#0d1117';
  const fg = cfg.theme === 'light' ? '#24292f' : '#ccc';

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">\n`;

  svgContent += `<style>
      svg { background: ${bg}; }
      text {
        font-family: monospace;
        font-size: 12px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8), 0px 0px 3px rgba(0,0,0,0.8);
      }
      .fr { opacity: 0; animation: play ${duration}s infinite; }
      @keyframes play {
        0%, 0.499% { opacity: 1; }
        0.5%, 100% { opacity: 0; }
      }
    </style>\n`;

  for (let f = 0; f < safeFrames; f++) {
    const A = (f * Math.PI * 2 * cfg.speedX) / safeFrames;
    const B = (f * Math.PI * 2 * cfg.speedY) / safeFrames;
    const b = renderer.getFrameData(A, B);

    let frameHTML = `<g class="fr" style="animation-delay: ${f * frameStepSeconds}s;">\n`;

    for (let y = 0; y < cfg.rows; y++) {
      const lineChars = [];
      for (let x = 0; x < cfg.cols; x++) {
        lineChars.push(b[x + y * cfg.cols]);
      }

      let rightIndex = cfg.cols - 1;
      while (rightIndex >= 0 && lineChars[rightIndex] === ' ') {
        rightIndex--;
      }

      if (rightIndex < 0) {
        continue;
      }

      let rowHTML = `<text x="5" y="${y * 15 + 15}" xml:space="preserve">`;
      let currentSpanColor = null;
      let currentSpanText = '';

      for (let x = 0; x <= rightIndex; x++) {
        const char = lineChars[x];
        const color = cfg.label.includes(char) && char !== ' ' ? '#3f88e6' : fg;
        const safeChar = escapeXml(char);

        if (color !== currentSpanColor) {
          if (currentSpanText !== '') {
            rowHTML += `<tspan fill="${currentSpanColor}">${currentSpanText}</tspan>`;
          }
          currentSpanColor = color;
          currentSpanText = safeChar;
        } else {
          currentSpanText += safeChar;
        }
      }

      if (currentSpanText !== '') {
        rowHTML += `<tspan fill="${currentSpanColor}">${currentSpanText}</tspan>`;
      }

      rowHTML += '</text>\n';
      frameHTML += rowHTML;
    }

    frameHTML += '</g>\n';
    svgContent += frameHTML;
  }

  svgContent += '</svg>';
  return svgContent;
};

module.exports = (req, res) => {
  const cfg = createConfigFromQuery(req.query || {});
  const svg = buildAnimatedSvgContent(cfg);

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(svg);
};
