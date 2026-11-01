// SBA 교안 공통: 설정·네비게이션·복사·타이머  (window.CFG, window.TXT 는 index.html 에서 주입)
const CFG=window.CFG||{};
document.querySelectorAll('[data-cfg]').forEach(e=>e.textContent=CFG[e.dataset.cfg]||'');
document.querySelectorAll('[data-txt]').forEach(e=>{const t=(window.TXT||{})[e.dataset.txt]||'';const l=e.querySelector('.lb2');const f=document.createDocumentFragment();t.split('\n\n').forEach(p=>{const d=document.createElement('div');d.style.cssText='break-inside:avoid;margin-bottom:1.65em';d.textContent=p;f.appendChild(d)});l?l.after(f):e.prepend(f)});
function cp(k,b){const t=(window.TXT||{})[k]||'';const done=()=>{const o=b.textContent;b.textContent='복사됨 ✓';b.classList.add('ok');setTimeout(()=>{b.textContent=o;b.classList.remove('ok')},1400)};
  const fb=()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();done()};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,fb)}else fb()}
function cpimg(src,b){const o=b.textContent;const say=(t,c)=>{b.textContent=t;if(c)b.classList.add('ok');setTimeout(()=>{b.textContent=o;b.classList.remove('ok')},1600)};
  fetch(src).then(r=>r.blob()).then(bl=>createImageBitmap(bl)).then(bm=>{const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;c.getContext('2d').drawImage(bm,0,0);return new Promise(r=>c.toBlob(r,'image/png'))}).then(p=>navigator.clipboard.write([new ClipboardItem({'image/png':p})])).then(()=>say('복사됨 ✓',1),()=>say('복사 불가 · 다운로드 이용'))}
let tmI=null;function tmStart(b,sec){if(tmI){clearInterval(tmI);tmI=null;b.textContent='타이머 시작';return}
  let s=sec||300;const v=document.getElementById('tmv');b.textContent='정지';
  tmI=setInterval(()=>{s--;v.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(s<=0){clearInterval(tmI);tmI=null;b.textContent='타이머 시작'}},1000)}
const S=[...document.querySelectorAll('.slide')],st=document.getElementById('stage');
let i=Math.max(0,Math.min(S.length-1,(parseInt(location.hash.slice(1))||1)-1));
function fit(){st.style.setProperty('--s',Math.min(innerWidth/1280,innerHeight/720))}
function show(n){i=Math.max(0,Math.min(S.length-1,n));S.forEach((s,k)=>s.classList.toggle('active',k===i));
  document.getElementById('bar').style.width=((i+1)/S.length*100)+'%';
  document.getElementById('num').textContent=(i+1)+' / '+S.length;history.replaceState(null,'','#'+(i+1))}
addEventListener('resize',fit);fit();show(i);
// 클리커: PageDown/PageUp/방향키/Space/Enter, B=화면 암전, F=전체화면
let blk=false;
addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('button')&&(e.key===' '||e.key==='Enter'))return;
  if(['ArrowRight','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();show(i+1)}
  else if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();show(i-1)}
  else if(e.key==='Home')show(0);else if(e.key==='End')show(S.length-1);
  else if(e.key==='b'||e.key==='B'||e.key==='.'){blk=!blk;st.style.visibility=blk?'hidden':'visible'}
  else if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
});
addEventListener('click',e=>{if(e.target.closest('a,button,input,textarea'))return;show(e.clientX>innerWidth/2?i+1:i-1)});
