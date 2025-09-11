let currentPage = 1;
let isLoading = false;
let maxpage = 1;
const container = document.getElementById('word-list');

// 左側
const categoryList = document.getElementById('category-list');
// 先建立一張大表
const table = document.createElement("table");
table.className = "table-jp";
const tbody = document.createElement("tbody");
table.appendChild(tbody);
container.appendChild(table);

// 單字轉成 HTML → 根據是否有 colspan 產生 cell
function renderVocabItemAsCells(item) {
  // 有 colspan → 直接合併成一大格
  if (item.colspan) {
    const rubyHTML = item.jp.map(char => {
      const k = renderTagged(char.k, item);
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
    const k = renderTagged(char.k, item);
    if (char.f) {
      return `<ruby>${k}<rt>${renderTagged(char.f, item)}</rt></ruby>`;
    } else {
      return `<ruby>${k}</ruby>`;
    }
  }).join('');

  const content = `
    <div class="cell-wrap">
      <div class="jp">${rubyHTML}</div>
      <div class="zh">${renderTagged(item.zh, item) || ''}</div>
    </div>`;
  return [`<td>${content}</td>`];
}
let batchCounter = 0;


function appendVocabRows(data, columns = 3, caption = "") {
  const batchIndex = batchCounter++;

  const container = document.getElementById("word-list");

  // 🔹 新增 section 包裹 table
  const section = document.createElement('section');
  section.id = `section-${batchIndex}`;
  section.dataset.batch = batchIndex;

  const table = document.createElement("table");
  table.className = "table-jp";

  if (caption) {
    const cap = document.createElement("caption");
    cap.innerHTML = renderMaybeFurigana(caption);
    table.appendChild(cap);

    // 側邊欄
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#section-${batchIndex}`; // 🔹 直接用 section id
    a.dataset.batchLink = batchIndex;
    a.innerHTML = caption;
    li.appendChild(a);
    categoryList.appendChild(li);
  }

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  let row = [];
  let unitCount = 0;

  data.forEach(item => {
    const spanUnits = item.colspan || 1;

    if (unitCount + spanUnits > columns) {
      if (row.length > 0) {
        tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
      }
      row = [];
      unitCount = 0;
    }

    const cells = renderVocabItemAsCells(item);
    row.push(...cells);
    unitCount += spanUnits;

    if (unitCount === columns) {
      tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
      row = [];
      unitCount = 0;
    }
  });

  if (row.length > 0) {
    tbody.insertAdjacentHTML("beforeend", `<tr>${row.join("")}</tr>`);
  }

  // 🔹 把 table 放進 section，再放到 container
  section.appendChild(table);
  container.appendChild(section);
}

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
function scrollToBatch(batchIndex) {
  const table = document.querySelector(`[data-batch='${batchIndex}']`);
  if (!table) return;

  // 取得 toolbar 高度
  const toolbarHeight = document.querySelector('.toolbar')?.offsetHeight || 0;

  // 計算 table 在頁面上的位置
  const top = table.getBoundingClientRect().top + window.scrollY - toolbarHeight - 10; // 🔹再加一點 margin

  window.scrollTo({
    top: top,
    behavior: 'smooth'
  });
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


// ========= 側邊欄開關 =========
const toggleBtn = document.getElementById('toggle-sidebar');
const sidebar = document.querySelector('.sidebar');
sidebar.classList.remove('show');
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});


// ========= 滾動監聽，滾動到底部時載入下一批 =========
container.addEventListener('scroll', () => {
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200) {
    loadNextVocabPage();
  }
});
