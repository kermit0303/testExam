document.getElementById("vid").textContent = "V1.0.33";

// ========= 核心渲染函式 =========
function renderFurigana(jpArr) {
    return jpArr.map(token => {
        if (token.f) {
            return `<ruby>${token.k}<rt>${token.f}</rt></ruby>`;
        } else {
            return token.k;
        }
    }).join('');
}

function renderTagged(text, item) {
    if (typeof text !== 'string') return text;

    let expanded = text.replace(/\[(\w+)\]/g, (_, key) => {
        if (!item || !(key in item)) return `[${key}]`;
        const v = item[key];

        if (Array.isArray(v)) {
            const inner = v.map(val => {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) {
                        // ✅ 呼叫你的函式
                        return renderFurigana(parsed);
                    }
                } catch (e) {
                    // parse 失敗就當字串
                    return `<div>${val}</div>`;
                }
                return `<div>${val}</div>`;
            }).join('');

            return `<span class="option-box">${inner}</span>`;
        }

        if (typeof v === 'string' || typeof v === 'number') {
            return String(v);
        }

        return `[${key}]`;
    });
    return renderTaggedText(expanded, item);
}
function renderTaggedText(text, item = {}) {
    if (typeof text !== 'string') return text;

    const tagRegex = /\[\[([\w-]+)\|/g;

    function parse(str) {
        let result = '';
        let i = 0;

        while (i < str.length) {
            tagRegex.lastIndex = i;
            const match = tagRegex.exec(str);
            if (!match) {
                result += str.slice(i);
                break;
            }

            const start = match.index;
            const cls = match[1];
            result += str.slice(i, start); // 加入前段純文字

            // 從 match 之後開始解析內部內容
            let depth = 1;
            let j = tagRegex.lastIndex;
            let content = '';

            while (j < str.length) {
                if (str.slice(j, j + 2) === '[[') {
                    depth++;
                    content += '[[';
                    j += 2;
                } else if (str.slice(j, j + 2) === ']]') {
                    depth--;
                    if (depth === 0) {
                        j += 2;
                        break;
                    } else {
                        content += ']]';
                        j += 2;
                    }
                } else {
                    content += str[j++];
                }
            }

            // 遞迴處理內層的內容
            const innerParsed = parse(content.trim());

            // 根據 tag 類型做渲染
            let replaced = '';

            if (cls === "notetop") {
                // innerParsed 是: [[note2]]
                // parse(innerParsed) ⇒ 應該解析成：<span class="note2"></span>
                const final = parse(innerParsed);

                // 嘗試從 innerParsed 解析出 key（例如：note2）
                const keyMatch = innerParsed.match(/^\[\[([\w-]+)\]\]$/);
                const key = keyMatch?.[1];
                const noteVal = key ? item.note?.[key] : null;
                replaced = renderTextWithNote(noteVal ?? final);
            } else if (cls === "pitch") {
                try {
                    const arr = JSON.parse(innerParsed);
                    replaced = renderTwoPitch(arr);
                } catch (e) {
                    replaced = `<span class="${cls}">解析錯誤</span>`;
                }
            } else if (cls.trim() === "furi") {
                try {
                    const fixed = `[${innerParsed}]`; // ✨ 自動補成合法 JSON 陣列
                    const data = JSON.parse(fixed); // [{kanji:..., kana:...}, {...}]
                    const svg = renderFuriganaSvg(data);
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("svg-container");
                    wrapper.appendChild(svg);
                    replaced = wrapper.outerHTML;
                } catch (e) {
                    console.error("Furigana JSON 解析錯誤", e);
                    replaced = `<span class="error">Furigana 錯誤</span>`;
                }
            } else if (cls === "icon") {
                replaced = `<span class="icon ${innerParsed}"></span>`;
            } else {
                replaced = `<span class="${cls}">${innerParsed}</span>`;
            }

            result += replaced;
            i = j;
        }

        return result;
    }

    return parse(text);
}
function renderTwoPitch(kanaArray) {
    if (!Array.isArray(kanaArray) || kanaArray.length !== 2) return '';

    const container = document.createElement('div');
    container.className = 'containerup';
    container.style.position = 'relative';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.fontSize = '4rem';
    container.style.gap = '50px';

    // 建立文字 span
    kanaArray.forEach(item => {
        const span = document.createElement('span');
        span.textContent = item.k;
        span.style.position = 'relative';
        span.style.zIndex = '2';
        container.appendChild(span);
    });

    // 建立 SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '200px';  // 固定寬度
    svg.style.height = '100px'; // 固定高度
    svg.style.overflow = 'visible';
    svg.style.zIndex = '1';

    const polyline = document.createElementNS(svgNS, 'polyline');

    // 前後字高低轉換，直接用固定座標
    let points;
    if (kanaArray[0].p === 'H' && kanaArray[1].p === 'L') {
        points = '25,20 95,20 95,95 165,95'; // 前高後低
    } else if (kanaArray[0].p === 'L' && kanaArray[1].p === 'H') {
        points = '25,90 95,90 95,20 165,20'; // 前低後高
    } else {
        points = '25,50 95,50 165,50'; // 同高或同低，畫中線
    }

    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', '#a12824ff');
    polyline.setAttribute('stroke-width', '5');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(polyline);
    container.appendChild(svg);

    return container.outerHTML;
}

function renderTextWithNote(noteText) {
    let content;

    if (Array.isArray(noteText)) {
        content = renderFurigana(noteText);  // 假名顯示
    } else {
        content = noteText;  // 純文字顯示
    }

    return `
        <span class="note-top">
            <div class="note-box-top">${content}</div>
            <svg class="note-arrow" xmlns="http://www.w3.org/2000/svg">
                <line x1="15" y1="-60" x2="-10" y2="-40"
                    stroke="#c8a98b"
                    stroke-width="2"
                    marker-end="url(#global-note-arrowhead)" />
            </svg>
        </span>
    `;
}

function insertGlobalNoteMarker() {
    if (document.getElementById('global-note-marker')) return; // 已經插入就跳過

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "height:0;width:0;position:absolute");
    svg.innerHTML = `
        <defs>
            <marker id="global-note-arrowhead" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#c8a98b" />
            </marker>
        </defs>
    `;
    svg.id = 'global-note-marker';
    document.body.appendChild(svg);
}

function generateVisual(name) {
    if (name === 'example-flow') {
        const container = document.createElement('div');
        container.className = 'container';
        container.style.cssText = `
            position: relative;
            width: 600px;
            height: 150px;
            margin-top: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.03);
            padding: 20px 0;
        `;

        const nodes = ['A', 'B', 'C'];
        nodes.forEach((text, i) => {
            const div = document.createElement('div');
            div.className = 'node';
            div.id = text;
            div.innerHTML = text;
            div.style.left = `${50 + i * 200}px`;
            div.style.position = 'absolute';
            div.style.top = '50px';
            div.style.padding = '10px 16px';
            div.style.background = '#f5f1e9';
            div.style.border = '1.5px solid #d8e2dc';
            div.style.borderRadius = '6px';
            div.style.fontWeight = 'bold';
            div.style.boxShadow = '1px 1px 5px rgba(0,0,0,0.05)';
            container.appendChild(div);
        });

        const label = document.createElement('div');
        label.className = 'label';
        label.innerHTML = '繞過 B 的情況';
        label.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
        `;
        container.appendChild(label);

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('xmlns', svgNS);
        svg.setAttribute('aria-hidden', 'true');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';

        const defs = document.createElementNS(svgNS, 'defs');
        const marker = document.createElementNS(svgNS, 'marker');
        marker.setAttribute('id', 'arrow');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS(svgNS, 'polygon');
        polygon.setAttribute('points', '0 0, 6 3, 0 6');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', 'M65 100 V130 H565 V100');
        path.setAttribute('stroke', '#3b6978');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrow)');
        svg.appendChild(path);

        container.appendChild(svg);
        return container;
    }
    return null;
}
function renderFuriganaSvg(data) {
    const svgNS = "http://www.w3.org/2000/svg";
    const kanaFontSize = 30;
    const kanjiFontSize = 40;
    const kanaCharWidth = kanaFontSize; // 每個假名寬度估算
    const spacingPadding = 3;
    const spacingPaddingKani = 15;
    const kanaYOffset = kanaFontSize - 10; // 讓 kana 不會超出上邊
    const kanjiYOffset = 65;

    // 計算總寬度
    let svgWidth = 20;
    data.forEach(item => {
        const kana = item.f || "";
        svgWidth += kana.length * kanaCharWidth + spacingPadding;
    });
    svgWidth += 20;

    // 建立 SVG 元素
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", 80);
    svg.style.verticalAlign = "top";

    const group = document.createElementNS(svgNS, "g");

    let kanaX = 10;
    let kanjiX = 10;

    // 拆解第一個 kana
    const first = data[0];
    const fKana = first.f || "";
    const fKanaArr = [...fKana];

    // 繪製假名與漢字
    data.forEach(item => {
        const kana = item.f || "";
        const kanji = item.k || "";
        const kanaWidth = kana.length * kanaCharWidth;

        if (kana) {
            const kanaText = document.createElementNS(svgNS, "text");
            kanaText.setAttribute("x", kanaX);
            kanaText.setAttribute("y", kanaYOffset);
            kanaText.setAttribute("class", "kana");
            kanaText.textContent = kana;
            group.appendChild(kanaText);
        }

        if (kanji) {
            const kanjiText = document.createElementNS(svgNS, "text");
            kanjiText.setAttribute("x", kanjiX);
            kanjiText.setAttribute("y", kanjiYOffset);
            kanjiText.setAttribute("class", "kanji");
            kanjiText.textContent = kanji;
            group.appendChild(kanjiText);
        }

        kanaX += kanaWidth + spacingPadding;
        kanjiX += kanaWidth + spacingPaddingKani;
    });

    // 框住第一個 kana 最後一個字 + 下一個元素（如「う」+「ん」）
    if (fKanaArr.length > 0 && data.length >= 2) {
        const lastKanaIndex = fKanaArr.length - 1;
        const boxStartX = 10 + lastKanaIndex * kanaCharWidth;
        const nextKana = data[1].f || "　";
        const nextKanaWidth = [...nextKana].length * kanaCharWidth + 10;
        const boxEndX = boxStartX + kanaCharWidth + nextKanaWidth;

        const path = document.createElementNS(svgNS, "path");
        const d = `
            M ${boxStartX} -10
            H ${boxEndX + spacingPaddingKani}
            V 70
            H ${boxStartX + kanaCharWidth + spacingPaddingKani}
            V ${kanaYOffset + 5}
            H ${boxStartX}
            Z
        `;
        path.setAttribute("d", d.trim());
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#b19f89");
        path.setAttribute("stroke-width", "2");
        group.appendChild(path);
    }

    svg.appendChild(group);
    return svg;
}
function renderTable(data) {
    const cls = data.class || "table-jp";
    const caption = data.caption ? `<caption>${data.caption}</caption>` : "";

    const header = data.header?.length
        ? `<thead><tr>${data.header.map(h => `<th>${renderCell(h)}</th>`).join("")}</tr></thead>`
        : "";

    const body = data.rows.map(row =>
        `<tr>${row.map(cell => `<td>${renderCell(cell)}</td>`).join("")}</tr>`
    ).join("");

    return `<table class="${cls}">${caption}${header}<tbody>${body}</tbody></table>`;
}

function renderCell(cell) {
    // 空值處理
    if (cell == null) return "";

    // 如果是字串，先嘗試判斷是否為 JSON
    if (typeof cell === "string") {
        const trimmed = cell.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                const parsed = JSON.parse(trimmed);
                return renderCell(parsed); // 再遞迴一次，交給物件/陣列處理
            } catch (e) {
                // 不是合法 JSON → 當成標記字串處理
                return renderTagged(cell);
            }
        }
        // 純文字或標記字串
        return renderTagged(cell);
    }

    // 如果是 {k,f} 的物件
    if (typeof cell === "object" && "k" in cell) {
        return renderFurigana([cell]);
    }

    // 如果是 [{k,f}, ...] 陣列
    if (Array.isArray(cell) && cell.length && typeof cell[0] === "object" && "k" in cell[0]) {
        return renderFurigana(cell);
    }

    // 其他 → 強制轉字串
    return String(cell);
}