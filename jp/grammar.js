

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
    loadDataFile(`grammardata/grammar-data-${i}.js`, i, true);
  }
}

// ========= 主要載入批次內容 =========
async function loadBatch(batchIndex) {
  if (loadedContentsSet.has(batchIndex)) return;  // 避免重複載入

  await loadDataFile(`grammardata/grammar-data-${batchIndex}.js`, batchIndex, false);
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

  if (item.tables && Array.isArray(item.tables)) {
    item.tables.forEach(table => {
      const tableHTML = renderTagged(renderTable(table), item); // 傳入單一表格
      const wrapper = document.createElement('div');
      wrapper.innerHTML = tableHTML;
      section.appendChild(wrapper);
    });
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
