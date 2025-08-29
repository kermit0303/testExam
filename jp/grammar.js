
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
      div.innerText = text;
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
    label.innerText = '繞過 B 的情況';
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

grammarData.forEach((item, idx)=>{
  const id = 'section-'+idx;

  // 左側側欄
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#' + id;
  a.innerText = item.title;
  li.appendChild(a);
  categoryList.appendChild(li);

  // 右側內容
  const section = document.createElement('section');
  section.id = id;

  const h2 = document.createElement('h2');
  h2.innerText = item.title;
  section.appendChild(h2);

  const desc = document.createElement('p');
  desc.innerText = item.description;
  section.appendChild(desc);

  const example = document.createElement('p');
  example.innerText = item.example;
  section.appendChild(example);

  // visual
  if(item.visual){
  const container = document.createElement('div');
  container.className = 'svg-container';

  const visual = generateVisual(item.visual); // 回傳 DOM 元素
  if (visual) container.appendChild(visual);   // 直接 append
  section.appendChild(container);
}

  grammarContent.appendChild(section);
});

// 搜尋功能
function search(keyword){
  keyword = keyword.toLowerCase();
  const sections = document.querySelectorAll('.main section');
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(h=>{ h.outerHTML = h.innerText; });
  if(!keyword) return;

  for(const section of sections){
    const text = section.innerText.toLowerCase();
    if(text.includes(keyword)){
      section.scrollIntoView({behavior:'smooth', block:'start'});
      const regex = new RegExp(`(${keyword})`, 'i');
      section.innerHTML = section.innerHTML.replace(regex,'<span class="highlight">$1</span>');
      break;
    }
  }
}
