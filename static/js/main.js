const cfg = {
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
    totalFrames: 200,
    cols: 80,
    rows: 27,
    profile: 'donut'
};

const profiles = {
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

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? 'Dark Theme' : 'Light Theme';
});

const bindInput = (id, key, isFloat = false) => {
    const el = document.getElementById(`inp-${id}`);
    const valEl = document.getElementById(`val-${id}`);
    el.addEventListener('input', (e) => {
        const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        cfg[key] = val;
        if (valEl) {
            valEl.textContent = val;
        }
        if (key === 'width' || key === 'height') {
            updateCanvasSize();
        }
        updateBadgeOutput();
    });
};

const bindTextInput = (id, key) => {
    const el = document.getElementById(`inp-${id}`);
    el.addEventListener('input', (e) => {
        cfg[key] = e.target.value || ' ';
        updateBadgeOutput();
    });
};

bindInput('width', 'width');
bindInput('height', 'height');
bindInput('r1', 'R1', true);
bindInput('r2', 'R2', true);
bindInput('scalex', 'scaleX');
bindInput('scaley', 'scaleY');
bindInput('speedx', 'speedX');
bindInput('speedy', 'speedY');
bindInput('animspeed', 'animationSpeed', true);
bindTextInput('label', 'label');
bindTextInput('chars', 'chars');

const profileSelect = document.getElementById('inp-profile');
profileSelect.addEventListener('change', (e) => {
    applyProfile(e.target.value);
});

let animationFrameId;
const canvasElement = document.getElementById('canvas');
let textNodes = [];
let frameFloat = 0;

const updateCanvasSize = () => {
    cfg.cols = Math.ceil(cfg.width / 7.5);
    cfg.rows = Math.ceil(cfg.height / 15);

    canvasElement.setAttribute('width', cfg.width);
    canvasElement.setAttribute('height', cfg.height);
    canvasElement.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);

    setupSVGTextNodes();
};

const setupSVGTextNodes = () => {
    canvasElement.innerHTML = '';
    textNodes = [];
    for (let i = 0; i < cfg.cols * cfg.rows; i++) {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', (i % cfg.cols) * 7.5 + 5);
        t.setAttribute('y', Math.floor(i / cfg.cols) * 15 + 15);
        t.setAttribute('fill', '#ccc');
        t.setAttribute('font-size', '12');
        t.setAttribute('font-family', 'monospace');
        t.textContent = ' ';
        canvasElement.appendChild(t);
        textNodes.push(t);
    }
};

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

let currentA = 0;
let currentB = 0;

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

const updateBadgeOutput = () => {
    const badgeLabel = encodeURIComponent(cfg.label.trim() || 'ASCII');
    const badgeProfile = encodeURIComponent(cfg.profile);
    const url = `https://img.shields.io/badge/${badgeLabel}-${badgeProfile}-3f88e6`;
    const markdown = `![${cfg.label.trim() || 'ASCII Badge'}](${url})`;
    document.getElementById('badge-output').value = markdown;
};

const applyProfile = (profileName) => {
    const profile = profiles[profileName];
    if (!profile) return;

    cfg.profile = profile.profile;
    cfg.R1 = profile.R1;
    cfg.R2 = profile.R2;
    cfg.K2 = profile.K2;
    cfg.scaleX = profile.scaleX;
    cfg.scaleY = profile.scaleY;

    document.getElementById('inp-r1').value = cfg.R1;
    document.getElementById('val-r1').textContent = cfg.R1;
    document.getElementById('inp-r2').value = cfg.R2;
    document.getElementById('val-r2').textContent = cfg.R2;
    document.getElementById('inp-scalex').value = cfg.scaleX;
    document.getElementById('val-scalex').textContent = cfg.scaleX;
    document.getElementById('inp-scaley').value = cfg.scaleY;
    document.getElementById('val-scaley').textContent = cfg.scaleY;

    updateBadgeOutput();
};

const copyBadgeButton = document.getElementById('copy-badge-btn');
copyBadgeButton.addEventListener('click', async () => {
    const originalText = copyBadgeButton.textContent;
    try {
        await navigator.clipboard.writeText(document.getElementById('badge-output').value);
        copyBadgeButton.textContent = 'Copied';
    } catch {
        copyBadgeButton.textContent = 'Copy failed';
    }
    setTimeout(() => {
        copyBadgeButton.textContent = originalText;
    }, 900);
});

const renderLoop = () => {
    const frameIndex = frameFloat % cfg.totalFrames;
    const A = (frameIndex * Math.PI * 2 * cfg.speedX) / cfg.totalFrames;
    const B = (frameIndex * Math.PI * 2 * cfg.speedY) / cfg.totalFrames;

    const b = getFrameData(A, B);

    for (let i = 0; i < textNodes.length; i++) {
        if (textNodes[i].textContent !== b[i]) {
            textNodes[i].textContent = b[i];
            textNodes[i].setAttribute('fill', cfg.label.includes(b[i]) && b[i] !== ' ' ? 'var(--accent-color)' : '#ccc');
            textNodes[i].setAttribute('opacity', b[i] === ' ' ? '0' : '1');
        }
    }

    frameFloat = (frameFloat + cfg.animationSpeed) % cfg.totalFrames;
    animationFrameId = requestAnimationFrame(renderLoop);
};

updateCanvasSize();
applyProfile('donut');
updateBadgeOutput();
renderLoop();

document.getElementById('download-svg-btn').onclick = () => {
    const btn = document.getElementById('download-svg-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Rendering...';
    btn.disabled = true;

    setTimeout(() => {
        const frameStepSeconds = 0.02 / cfg.animationSpeed;
        const duration = cfg.totalFrames * frameStepSeconds;
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">\n`;

        svgContent += `<style>
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

        for (let f = 0; f < cfg.totalFrames; f++) {
            const A = (f * Math.PI * 2 * cfg.speedX) / cfg.totalFrames;
            const B = (f * Math.PI * 2 * cfg.speedY) / cfg.totalFrames;
            const b = getFrameData(A, B);

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
                    const color = cfg.label.includes(char) && char !== ' ' ? '#3f88e6' : '#ccc';

                    let safeChar = char;
                    if (char === '<') {
                        safeChar = '&lt;';
                    } else if (char === '>') {
                        safeChar = '&gt;';
                    } else if (char === '&') {
                        safeChar = '&amp;';
                    }

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
                rowHTML += `</text>\n`;
                frameHTML += rowHTML;
            }
            frameHTML += `</g>\n`;
            svgContent += frameHTML;
        }

        svgContent += `</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'Custom_Ascii_Animation.svg';
        link.click();
        URL.revokeObjectURL(url);

        btn.textContent = originalText;
        btn.disabled = false;
    }, 50);
};

document.getElementById('download-gif-btn').onclick = async () => {
    const btn = document.getElementById('download-gif-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Rendering...';
    btn.disabled = true;

    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const workerText = await response.text();
    const workerBlob = new Blob([workerText], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: cfg.width,
        height: cfg.height,
        workerScript: workerUrl
    });

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cfg.width;
    offCanvas.height = cfg.height;
    const ctx = offCanvas.getContext('2d');
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';

    const frameDelay = Math.max(5, Math.round(20 / cfg.animationSpeed));

    for (let f = 0; f < cfg.totalFrames; f++) {
        ctx.fillStyle = document.body.classList.contains('light-theme') ? '#f6f8fa' : '#0d1117';
        ctx.fillRect(0, 0, cfg.width, cfg.height);

        const A = (f * Math.PI * 2 * cfg.speedX) / cfg.totalFrames;
        const B = (f * Math.PI * 2 * cfg.speedY) / cfg.totalFrames;
        const b = getFrameData(A, B);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        for (let i = 0; i < cfg.cols * cfg.rows; i++) {
            if (b[i] !== ' ') {
                const x = (i % cfg.cols) * 7.5 + 5;
                const y = Math.floor(i / cfg.cols) * 15 + 15;
                ctx.fillStyle = cfg.label.includes(b[i]) ? '#3f88e6' : '#ccc';
                ctx.fillText(b[i], x, y);
            }
        }

        gif.addFrame(offCanvas, { copy: true, delay: frameDelay });
    }

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Custom_Ascii_Animation.gif';
        link.click();

        URL.revokeObjectURL(url);
        URL.revokeObjectURL(workerUrl);
        btn.textContent = originalText;
        btn.disabled = false;
    });

    gif.render();
};

window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
