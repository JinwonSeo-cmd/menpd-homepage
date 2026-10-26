(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* [선택자, 효과, 형제 간 간격(초)] — 효과: left right up drop pop fly flip wiggle zoom */
  var MAP=[
    ['.top','drop',0],
    ['.page-intro .badge','drop',0],
    ['.page-intro .lede','up',0],
    ['.scene','fly',.12],
    ['.scene-total','up',0],
    ['.wrap > .step','left',0],
    ['.jump a','pop',.06],
    ['.press','wiggle',0],
    ['.group-head','left',0],
    ['.group-desc','up',0],
    ['.choice-card.c1','left',0],
    ['.choice-card.c2','right',0],
    ['.note','pop',0],
    ['.tri-card:nth-of-type(1)','drop',0],
    ['.tri-card:nth-of-type(2)','left',.2],
    ['.tri-card:nth-of-type(3)','right',.35],
    ['.tri-plus','pop',.15],
    ['.tri-flow','up',.2],
    ['.steplist > *','up',.1],
    ['.say-hi','zoom',0],
    ['.flow-item:nth-child(odd)','left',.08],
    ['.flow-item:nth-child(even)','right',.08],
    ['.warn','flip',.15],
    ['.group > .acc','up',.07],
    ['.group > .fold','up',.07]
  ];
  var els=[];
  MAP.forEach(function(m){
    var list=document.querySelectorAll(m[0]);
    Array.prototype.forEach.call(list,function(el,i){
      if(el.classList.contains('rv'))return;
      el.classList.add('rv');
      el.setAttribute('data-fx',m[1]);
      var base=m[0]==='.page-intro .lede'?.2:0;
      el.style.setProperty('--d',(base+Math.min(i*m[2],.7)).toFixed(2)+'s');
      els.push(el);
    });
  });
  /* 같은 부모에서 형제 순서대로 이어 나오게 */
  var h1=document.querySelector('.page-intro h1');
  if(h1){h1.classList.add('rv');h1.setAttribute('data-fx','left');h1.style.setProperty('--d','.1s');els.push(h1)}

  /* 히어로 장식 도형 */
  var intro=document.querySelector('.page-intro');
  if(intro&&!reduce){
    var box=document.createElement('div');box.className='mo-shapes';box.setAttribute('aria-hidden','true');
    var S=[
      ['circle',22,'#E8946B','left:3%;top:8%','f1'],
      ['ring',34,'#2C5F6F','right:6%;top:4%','f2'],
      ['tri',26,'#ffd84d','right:16%;top:46%','sp'],
      ['sq',18,'#2C5F6F','left:10%;top:62%','f2'],
      ['circle',14,'#e0201c','right:3%;top:70%','pu'],
      ['ring',24,'#E8946B','left:46%;top:2%','f1'],
      ['tri',20,'#2C5F6F','left:1%;top:38%','f1'],
      ['sq',14,'#ffd84d','right:30%;top:80%','sp'],
      ['circle',10,'#2C5F6F','left:28%;top:90%','pu']
    ];
    S.forEach(function(s,i){
      var d=document.createElement('span');
      d.className='mo-shape '+s[0]+' '+s[4];
      d.style.cssText='width:'+s[1]+'px;height:'+s[1]+'px;--s:'+s[1]+'px;color:'+s[2]+';background:'+s[2]+';'+s[3]+';animation-delay:'+(i*.35)+'s';
      box.appendChild(d);
    });
    intro.insertBefore(box,intro.firstChild);
  }

  /* 배경 빛 덩어리 + 진행 바 */
  if(!reduce){
    ['b1','b2','b3'].forEach(function(c){var b=document.createElement('div');b.className='mo-blob '+c;b.setAttribute('aria-hidden','true');document.body.appendChild(b)});
  }
  var bar=document.createElement('div');bar.className='mo-progress';document.body.appendChild(bar);
  var tick=false;
  function upd(){tick=false;var h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.transform='scaleX('+(h>0?Math.min(1,window.scrollY/h):0)+')'}
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
  upd();

  /* 보이면 등장 */
  function show(el){el.classList.add('in');var gh=el.classList.contains('group-head');if(gh)el.classList.add('in')}
  if(!('IntersectionObserver' in window)||reduce){els.forEach(show);return}
  root.classList.add('mo');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}});
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(el){io.observe(el)});
})();
