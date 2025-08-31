function renderFurigana(jpArr) {
  return jpArr.map(token => {
    if (token.f) {
      return `<ruby>${token.k}<rt>${token.f}</rt></ruby>`;
    } else {
      return token.k;
    }
  }).join('');
}

function renderTagged(text) {
  return text.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (_, cls, txt) => {
    return `<span class="${cls}">${txt}</span>`;
  });
}


function generateVisual(name){
  if(name === 'example-flow'){
    // 建立 container
    const container = document.createElement('div');
    container.className = 'container';
    container.style.position = 'relative';
    container.style.width = '600px';
    container.style.height = '150px';
    container.style.marginTop = '20px';
    container.style.background = '#fff';
    container.style.borderRadius = '8px';
    container.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.03)';
    container.style.padding = '20px 0';

    // 節點 A/B/C
    const nodes = ['A','B','C'];
    nodes.forEach((text, i)=>{
      const div = document.createElement('div');
      div.className = 'node';
      div.id = text;
      div.innerHTML = text;
      div.style.position = 'absolute';
      div.style.top = '50px';
      div.style.left = `${50 + i*200}px`;
      div.style.padding = '10px 16px';
      div.style.background = '#f5f1e9';
      div.style.border = '1.5px solid #d8e2dc';
      div.style.borderRadius = '6px';
      div.style.fontWeight = 'bold';
      div.style.boxShadow = '1px 1px 5px rgba(0,0,0,0.05)';
      container.appendChild(div);
    });

    // 標籤
    const label = document.createElement('div');
    label.className = 'label';
    label.innerHTML = '繞過 B 的情況';
    label.style.position = 'absolute';
    label.style.top = '10px';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    container.appendChild(label);

    // SVG 路徑
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('aria-hidden','true');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';

    const defs = document.createElementNS(svgNS,'defs');
    const marker = document.createElementNS(svgNS,'marker');
    marker.setAttribute('id','arrow');
    marker.setAttribute('markerWidth','6');
    marker.setAttribute('markerHeight','6');
    marker.setAttribute('refX','5');
    marker.setAttribute('refY','3');
    marker.setAttribute('orient','auto');
    const polygon = document.createElementNS(svgNS,'polygon');
    polygon.setAttribute('points','0 0, 6 3, 0 6');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const path = document.createElementNS(svgNS,'path');
    path.setAttribute('d','M65 100 V130 H565 V100');
    path.setAttribute('stroke','#3b6978');
    path.setAttribute('stroke-width','2');
    path.setAttribute('fill','none');
    path.setAttribute('marker-end','url(#arrow)');
    svg.appendChild(path);

    container.appendChild(svg);

    return container;
  }
  return null;
}
const categoryList = document.getElementById('category-list');
const grammarContent = document.getElementById('grammar-content');

grammarData.forEach((item, idx) => {
  const id = 'section-' + idx;

  // 左側側欄
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#' + id;
  a.innerHTML = item.tile;
  li.appendChild(a);
  categoryList.appendChild(li);

  // 右側內容
  const section = document.createElement('section');
  section.id = id;

  const h2 = document.createElement('h2');
  h2.innerHTML = item.tile;
  section.appendChild(h2);

  
  if (item.desp) {
    const desc = document.createElement('p');
    desc.innerHTML = renderTagged(item.desp);
    section.appendChild(desc);
  }
  if (item.trans) {
    const zh = document.createElement('div');
    zh.className = 'line-zh';
    zh.textContent = renderTagged(item.trans);
    section.appendChild(zh);
  }

  if (Array.isArray(item.exam)) {
    const exContainer = document.createElement('div');
    exContainer.className = 'examples';

    item.exam.forEach(ex => {
      const jp = document.createElement('p');
      jp.className = 'exam-jp';
      // ✅ 用 renderFurigana 處理 jp 陣列
      jp.innerHTML = Array.isArray(ex.jp) ? renderTagged(renderFurigana(ex.jp)) : ex.jp;
      exContainer.appendChild(jp);

      const zh = document.createElement('p');
      zh.className = 'exam-zh';
      zh.innerHTML = renderTagged(ex.zh);
      exContainer.appendChild(zh);
    });

    section.appendChild(exContainer);
  }

  // visual
  if (item.visl) {
    const container = document.createElement('div');
    container.className = 'svg-container';
    const visual = generateVisual(item.visl);
    if (visual) container.appendChild(visual);
    section.appendChild(container);
  }

  grammarContent.appendChild(section);
});

// 搜尋功能
function search(keyword){
  keyword = keyword.toLowerCase();
  const sections = document.querySelectorAll('.main section');
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(h=>{ h.outerHTML = h.innerHTML; });
  if(!keyword) return;

  for(const section of sections){
    const text = section.innerHTML.toLowerCase();
    if(text.includes(keyword)){
      section.scrollIntoView({behavior:'smooth', block:'start'});
      const regex = new RegExp(`(${keyword})`, 'i');
      section.innerHTML = section.innerHTML.replace(regex,'<span class="highlight">$1</span>');
      break;
    }
  }
}
