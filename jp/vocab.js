const container = document.getElementById('word-list');

vocab.forEach(item => {
  const rubyHTML = item.jp.map(char => {
    if (char.f) {
      return `<ruby>${char.k}<rt>${char.f}</rt></ruby>`;
    } else {
      return `<ruby>${char.k}</ruby>`;
    }
  }).join('');

  const div = document.createElement('div');
  div.className = 'word';
  div.innerHTML = `${rubyHTML}<span class="chinese"> — ${item.zh}</span>`;
  container.appendChild(div);
});
