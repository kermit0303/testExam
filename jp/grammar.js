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
            const inner = v.map(val => `<div>${val}</div>`).join('');
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

    return text.replace(/\[\[([\w-]+)\|((?:[^\[\]]|\[[^\[\]]*\])*)\]\]/g, (_, cls, txt) => {
        if (cls.trim() === "notetop") {
            console.log('renderTagged text:', text);
            console.log('renderTagged txt:', txt);
            
            // 這裡改用從尾部找 [] 的 regex
            const match = txt.match(/^\[(\w+)\]$/);
            console.log('renderTagged match:', match);

            if (match) {
                const key = match[1];
                const value = item["note"][key];
                return renderTextWithNote(value ?? `[${key}]`);
            }

            return renderTextWithNote(txt);
        }

        return `<span class="${cls}">${txt}</span>`;
    });
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
                <line x1="15" y1="-60" x2="-20" y2="-30"
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

// ========= 左側與右側 DOM =========
const categoryList = document.getElementById('category-list');
const grammarContent = document.getElementById('grammar-content');

// ========= 渲染單一語法區塊 =========

// ========= 全局設定 =========
const maxBatch = 2;  // 假設最大有10批次，可依需求調整
let currentBatch = 1;

const loadedTitles = new Set();
const loadedContents = new Set();
const loadedContentsSet = new Set();


// ========= 載入標題，只載入左側清單 =========
function preloadTitles() {
    for (let i = 1; i <= maxBatch; i++) {
        loadDataFile(`data/grammar-data-${i}.js`, i, true);
    }
}

// ========= 主要載入批次內容 =========
async function loadBatch(batchIndex) {
    if (loadedContentsSet.has(batchIndex)) return;  // 避免重複載入

    await loadDataFile(`data/grammar-data-${batchIndex}.js`, batchIndex, false);
    loadedContentsSet.add(batchIndex);

    manageBatchDom(batchIndex);
}

// ========= 管理DOM，控制只保留當前及前後批次 =========
function manageBatchDom(current) {
    loadedContentsSet.forEach(batchIdx => {
        if (batchIdx < current - 1 || batchIdx > current + 1) {
            removeBatchContent(batchIdx);
            loadedContentsSet.delete(batchIdx);
        }
    });
}

// ========= 移除指定批次內容與左側連結 =========
function removeBatchContent(batchIndex) {
    const sections = document.querySelectorAll(`[data-batch='${batchIndex}']`);
    sections.forEach(sec => sec.remove());

    const links = document.querySelectorAll(`[data-batch-link='${batchIndex}']`);
    links.forEach(link => link.remove());
}

// ========= 延遲載入資料的函式 =========
function loadDataFile(filePath, batchIndex, titlesOnly = false) {
    return new Promise((resolve, reject) => {
        // 判斷是否已經載入過
        if (titlesOnly && loadedTitles.has(batchIndex)) {
            resolve();
            return;
        }
        if (!titlesOnly && loadedContents.has(batchIndex)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = filePath;
        script.onload = () => {
            const data = window[`grammarData${batchIndex}`];
            if (Array.isArray(data)) {
                data.forEach((item, idx) => {
                    if (titlesOnly) {
                        renderSidebarOnly(item, batchIndex, idx);
                    } else {
                        renderGrammarItem(item, batchIndex, idx);
                    }
                });
                if (titlesOnly) {
                    loadedTitles.add(batchIndex);
                } else {
                    loadedContents.add(batchIndex);
                }
            }
            resolve();
        };
        script.onerror = () => {
            console.error(`無法載入 ${filePath}`);
            reject();
        };
        document.body.appendChild(script);
    });
}

// ========= 渲染左側標題 =========
function renderSidebarOnly(item, batchIndex, idx) {
    const id = `section-${batchIndex}-${idx}`;
    if (!document.getElementById(`link-${id}`)) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.id = `link-${id}`;
        a.dataset.batchLink = batchIndex;

        if (item.tile) {
            if (Array.isArray(item.tile)) {
                a.innerHTML = renderTagged(renderFurigana(item.tile), item);
            } else {
                a.innerHTML = renderTagged(item.tile, item);
            }
        }
        li.appendChild(a);
        categoryList.appendChild(li);
    }
}

// ========= 渲染右側內容 =========
function renderGrammarItem(item, batchIndex, idx) {
    const id = `section-${batchIndex}-${idx}`;

    if (document.getElementById(id)) {
        return; // 如果已經渲染過，避免重複
    }

    const section = document.createElement('section');
    section.id = id;
    section.dataset.batch = batchIndex;

    if (item.tile) {
        const h2 = document.createElement('h2');
        if (Array.isArray(item.tile)) {
            h2.innerHTML = renderTagged(renderFurigana(item.tile), item);
        } else {
            h2.innerHTML = renderTagged(item.tile, item);
        }
        section.appendChild(h2);
    }

    // 處理說明段落（desp）
    if (item.desp) {
        const desc = document.createElement('p');
        if (Array.isArray(item.desp)) {
            desc.innerHTML = renderTagged(renderFurigana(item.desp), item);
        } else {
            desc.innerHTML = renderTagged(item.desp, item);
        }
        section.appendChild(desc);
    }

    // 處理翻譯（trans）
    if (item.trans) {
        const zh = document.createElement('div');
        zh.className = 'line-zh';
        if (Array.isArray(item.trans)) {
            zh.innerHTML = renderTagged(renderFurigana(item.trans), item);
        } else {
            zh.innerHTML = renderTagged(item.trans, item);
        }
        section.appendChild(zh);
    }


    if (Array.isArray(item.exam)) {
        const exContainer = document.createElement('div');
        exContainer.className = 'examples';

        item.exam.forEach(ex => {
            const exampleBlock = document.createElement('div');
            exampleBlock.className = 'example-block';

            const title = document.createElement('div');
            title.className = 'example-title';
            title.textContent = `範例 ${ex.id}`;
            exampleBlock.appendChild(title);

            ex.dia.forEach(d => {
                const jp = document.createElement('p');
                jp.className = 'exam-jp';
                jp.innerHTML = renderTagged(renderFurigana(d.jp), item);
                exampleBlock.appendChild(jp);

                const zh = document.createElement('p');
                zh.className = 'exam-zh';
                zh.innerHTML = renderTagged(d.zh, item);
                exampleBlock.appendChild(zh);
            });

            exContainer.appendChild(exampleBlock);
        });

        section.appendChild(exContainer);
    }

    if (item.visl) {
        const container = document.createElement('div');
        container.className = 'svg-container';
        const visual = generateVisual(item.visl);
        if (visual) container.appendChild(visual);
        section.appendChild(container);
    }

    grammarContent.appendChild(section);

}

// ========= 滾動監聽，滾動到底部時載入下一批 =========
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        if (currentBatch >= maxBatch) return;
        currentBatch++;
        loadBatch(currentBatch);
    }
});

// ========= 頁面初始化 =========
insertGlobalNoteMarker();  
preloadTitles();
loadBatch(currentBatch);


// ========= 搜尋功能 =========
function search(keyword) {
    keyword = keyword.toLowerCase();
    const sections = document.querySelectorAll('.main section');
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(h => { h.outerHTML = h.innerHTML; });
    if (!keyword) return;
    for (const section of sections) {
        const text = section.innerHTML.toLowerCase();
        if (text.includes(keyword)) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const regex = new RegExp(`(${keyword})`, 'ig');
            section.innerHTML = section.innerHTML.replace(regex, '<span class="highlight">$1</span>');
            break;
        }
    }
}

// ========= 側邊欄開關 =========
const toggleBtn = document.getElementById('toggle-sidebar');
const sidebar = document.querySelector('.sidebar');
sidebar.classList.remove('show');
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('show');
});
