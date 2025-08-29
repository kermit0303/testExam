const container = document.getElementById('word-list');

vocab.forEach(item => {
  const rubyHTML = item.japanese.map(char => {
    if (char.furigana) {
      return `<ruby>${char.kanji}<rt>${char.furigana}</rt></ruby>`;
    } else {
      return `<ruby>${char.kanji}</ruby>`;
    }
  }).join('');

  const div = document.createElement('div');
  div.className = 'word';
  div.innerHTML = `${rubyHTML}<span class="chinese"> — ${item.chinese}</span>`;
  container.appendChild(div);
});
