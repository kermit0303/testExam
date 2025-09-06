let currentPage = 1;
let isLoading = false;

const container = document.getElementById('word-list');

function renderTagged(str) {
  // 支援 [[small|...]]、[[blue|...]] 等標記轉換為 span
  return str.replace(/\[\[([a-z]+)\|(.+?)\]\]/g, (match, cls, content) => {
    return `<span class="${cls}">${content}</span>`;
  });
}

function renderVocabItem(item) {
  const rubyHTML = item.jp.map(char => {
    const k = renderTagged(char.k); // 支援 [[small|x]]
    if (char.f) {
      return `<ruby>${k}<rt>${char.f}</rt></ruby>`;
    } else {
      return `<ruby>${k}</ruby>`;
    }
  }).join('');

  const div = document.createElement('div');
  div.className = 'word';
  div.innerHTML = `${rubyHTML}<span class="chinese"> — ${item.zh || ''}</span>`;
  container.appendChild(div);
}

function loadNextVocabPage() {
  if (isLoading) return;
  isLoading = true;

  const script = document.createElement('script');
  script.src = `vocabData/vocab-data-${currentPage}.js`;

  script.onload = () => {
    const data = window[`vocabData${currentPage}`];
    if (Array.isArray(data)) {
      data.forEach(renderVocabItem);
      currentPage++;
      isLoading = false;
    } else {
      console.warn('No more data');
    }
  };

  script.onerror = () => {
    console.error('Failed to load vocab page');
    isLoading = false;
  };

  document.body.appendChild(script);
}

// 觸發第一次加載
loadNextVocabPage();

// 監聽滾動事件以實現 infinite scroll
window.addEventListener('scroll', () => {
  const bottomReached = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
  if (bottomReached) {
    loadNextVocabPage();
  }
});
