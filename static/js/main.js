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
    chars: '.,-~:;=!*#$@',
    label: ' OstinUA ',
    totalFrames: 200,
    cols: 80,
    rows: 27
};

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? 'Темная тема' : 'Светлая тема';
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
    });
};

const bindTextInput = (id, key) => {
    const el = document.getElementById(`inp-${id}`);
    el.addEventListener('input', (e) => {
        cfg[key] = e.target.value || ' ';
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
bindTextInput('label', 'label');
bindTextInput('chars', 'chars');

let animationFrameId;
const canvasElement = document.getElementById('canvas');
let textNodes = [];

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

const getFrameData = (A, B) => {
    const b = Array(cfg.cols * cfg.rows).fill(' ');
    const z = Array(cfg.cols * cfg.rows).fill(0);

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

let currentFrame = 0;
const renderLoop = () => {
    const A = (currentFrame * Math.PI * 2 * cfg.speedX) / cfg.totalFrames;
    const B = (currentFrame * Math.PI * 2 * cfg.speedY) / cfg.totalFrames;

    const b = getFrameData(A, B);

    for (let i = 0; i < textNodes.length; i++) {
        if (textNodes[i].textContent !== b[i]) {
            textNodes[i].textContent = b[i];
            textNodes[i].setAttribute('fill', cfg.label.includes(b[i]) && b[i] !== ' ' ? 'var(--accent-color)' : '#ccc');
            textNodes[i].setAttribute('opacity', b[i] === ' ' ? '0' : '1');
        }
    }

    currentFrame = (currentFrame + 1) % cfg.totalFrames;
    animationFrameId = requestAnimationFrame(renderLoop);
};

updateCanvasSize();
renderLoop();

document.getElementById('download-svg-btn').onclick = () => {
    const btn = document.getElementById('download-svg-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Создаем...';
    btn.disabled = true;

    setTimeout(() => {
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">\n`;

        svgContent += `<style>
            text {
                font-family: monospace;
                font-size: 12px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8), 0px 0px 3px rgba(0,0,0,0.8);
            }
            .fr { opacity: 0; animation: play 4s infinite; }
            @keyframes play {
                0%, 0.499% { opacity: 1; }
                0.5%, 100% { opacity: 0; }
            }
        </style>\n`;

        for (let f = 0; f < cfg.totalFrames; f++) {
            const A = (f * Math.PI * 2 * cfg.speedX) / cfg.totalFrames;
            const B = (f * Math.PI * 2 * cfg.speedY) / cfg.totalFrames;
            const b = getFrameData(A, B);

            let frameHTML = `<g class="fr" style="animation-delay: ${f * 0.02}s;">\n`;

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
        link.download = 'Custom_Donut.svg';
        link.click();
        URL.revokeObjectURL(url);

        btn.textContent = originalText;
        btn.disabled = false;
    }, 50);
};

document.getElementById('download-gif-btn').onclick = async () => {
    const btn = document.getElementById('download-gif-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Создаем...';
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

        gif.addFrame(offCanvas, { copy: true, delay: 20 });
    }

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Custom_Donut.gif';
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
