let currentPage = 1;
let isLoading = false;
let maxpage = 1;
const container = document.getElementById('word-list');

// 先建立一張大表
const table = document.createElement("table");
table.className = "table-jp";
const tbody = document.createElement("tbody");
table.appendChild(tbody);
container.appendChild(table);

// 標記轉換（支援 [[small|...]]、[[blue|...]]）
function renderTagged(str) {
  return str.replace(/\[\[([a-z]+)\|(.+?)\]\]/g, (match, cls, content) => {
    return `<span class="${cls}">${content}</span>`;
  });
}

// 單字轉成 HTML
function renderVocabItemAsHTML(item) {
  const rubyHTML = item.jp.map(char => {
    const k = renderTagged(char.k);
    if (char.f) {
      return `<ruby>${k}<rt>${char.f}</rt></ruby>`;
    } else {
      return `<ruby>${k}</ruby>`;
    }
  }).join('');

  return `${rubyHTML}<span class="chinese"> — ${item.zh || ''}</span>`;
}
// 單字轉成 HTML → 根據是否有 colspan 產生 cell
function renderVocabItemAsCells(item) {
  // 有 colspan → 直接合併成一大格
  if (item.colspan) {
    const rubyHTML = item.jp.map(char => {
      const k = renderTagged(char.k);
      if (char.f) {
        return `<ruby>${k}<rt>${char.f}</rt></ruby>`;
      } else {
        return `<ruby>${k}</ruby>`;
      }
    }).join('');

    const content = `
      <div class="cell-wrap">
        <div class="jp">${rubyHTML}</div>
        <div class="zh">${item.zh || ''}</div>
      </div>`;
    return [
      `<td class="merged" colspan="${item.colspan}">${content}</td>`
    ];
  }

  // 預設：一格內上下排 jp/zh
  const rubyHTML = item.jp.map(char => {
    const k = renderTagged(char.k);
    if (char.f) {
      return `<ruby>${k}<rt>${char.f}</rt></ruby>`;
    } else {
      return `<ruby>${k}</ruby>`;
    }
  }).join('');

  const content = `
    <div class="cell-wrap">
      <div class="jp">${rubyHTML}</div>
      <div class="zh">${item.zh || ''}</div>
    </div>`;
  return [`<td>${content}</td>`];
}
function appendVocabRows(data, columns = 3, caption = "") {
  const container = document.getElementById("word-list");

  const table = document.createElement("table");
  table.className = "table-jp";
  if (caption) {
    const cap = document.createElement("caption");
    cap.innerHTML = renderMaybeFurigana(caption);

    table.appendChild(cap);
  }
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  let row = [];
  let unitCount = 0;

  data.forEach(item => {
    const spanUnits = item.colspan || 1;

    // 🟡 如果放不下，先收行
    if (unitCount + spanUnits > columns) {
      if (row.length > 0) {
        tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
      }
      row = [];
      unitCount = 0;
    }

    // 加入這個 item
    const cells = renderVocabItemAsCells(item);
    row.push(...cells);
    unitCount += spanUnits;

    // 剛好滿了，收行
    if (unitCount === columns) {
      tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
      row = [];
      unitCount = 0;
    }
  });

  // 🟡 剩下的補上去
  if (row.length > 0) {
    tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
  }

  container.appendChild(table);
}

function renderMaybeFurigana(textOrJson) {
  try {
    const arr = JSON.parse(textOrJson);
    if (Array.isArray(arr)) {
      return renderFurigana(arr);
    }
  } catch (e) {
    // 不是 JSON 就跳過
  }
  return textOrJson;
}


// 第一次自動載入
loadNextVocabPage();

// Infinite scroll
window.addEventListener('scroll', () => {
  const bottomReached = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
  if (bottomReached) {
    loadNextVocabPage();
  }
});
function loadNextVocabPage() {
  if (isLoading) return;
  isLoading = true;
 if (currentPage > maxpage) {
    return;
  }
  const script = document.createElement('script');
  script.src = `vocabData/vocab-data-${currentPage}.js`;

  script.onload = () => {
    const pageData = window[`vocabData${currentPage}`];
    if (pageData) {
      if (pageData.tables) {
        pageData.tables.forEach(table => {
          const rows = table.rows || [];
          const columns = table.columns || 3;
          appendVocabRows(rows, columns, table.caption);  // 可以順便傳 caption
        });
      } else if (Array.isArray(pageData)) {
        // 舊版資料支援
        appendVocabRows(pageData, 3);
      }
      currentPage++;
      isLoading = false;
    } else {
      console.warn('No more data');
      isLoading = false;
    }
  };

  script.onerror = () => {
    console.error('Failed to load vocab page');
    isLoading = false;
  };

  document.body.appendChild(script);
}

