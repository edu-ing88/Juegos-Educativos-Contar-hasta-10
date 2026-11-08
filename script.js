'use strict';
/* ===== Datos ===== */
const WORDS = ['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'];
const SETS = [
  {e:'🐢',n:'tortugas'},{e:'🐌',n:'caracoles'},{e:'🍎',n:'manzanas'},{e:'🌸',n:'flores'},
  {e:'🧸',n:'osos de peluche'},{e:'🐞',n:'mariquitas'},{e:'🐟',n:'peces'},{e:'🍓',n:'fresas'},{e:'🐶',n:'perritos'},{e:'🚗',n:'carritos'}
];
const PRAISE = ['¡Excelente!','¡Maravilloso!','¡Muy bien!','¡Felicitaciones!'];
const RETRY = ['¡Inténtalo nuevamente!','¡Tú puedes!'];
const ACTS = [
  {t:'Conocemos los números',i:'🔤',run:a1},
  {t:'Contamos los objetos',i:'🐢',run:a2},
  {t:'¿Cuántos objetos hay?',i:'❓',run:a3},
  {t:'Relacionamos números y cantidades',i:'🔗',run:a4},
  {t:'Ordenamos los números',i:'📶',run:a5}
];
const S = {ok:0,bad:0,stars:0,done:{},cur:null};
let timer = null;

/* ===== Utilidades ===== */
const $ = id => document.getElementById(id);
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[rnd(0,a.length-1)];
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]];} return a; };
const later = (f,ms) => { clearTimeout(timer); timer = setTimeout(f,ms); };
const app = $('app');
const show = h => { app.innerHTML = h; };

/* ===== Audio: voz y sonidos (sin conexión) ===== */
function speak(txt){
  try{
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(txt));
    u.lang = 'es-ES'; u.rate = .85; u.pitch = 1.2;
    speechSynthesis.speak(u);
  }catch(e){}
}
let ctx = null;
function tone(f,t0,d,type='sine',v=.15){
  try{
    ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
    const s = ctx.currentTime + t0;
    g.gain.setValueAtTime(v,s); g.gain.exponentialRampToValueAtTime(.001,s+d);
    o.start(s); o.stop(s+d);
  }catch(e){}
}
const sndOk = () => [523,659,784,1047].forEach((f,i)=>tone(f,i*.12,.25,'triangle'));
const sndBad = () => { tone(220,0,.25,'sine',.1); tone(185,.2,.3,'sine',.1); };
const sndTick = () => tone(880,0,.1,'triangle',.1);

/* ===== Retroalimentación ===== */
function toast(msg,cls){
  const t = $('toast'); t.textContent = msg; t.className = cls+' show';
  setTimeout(()=>t.classList.remove('show'),1300);
}
function confetti(){
  const fx = $('fx'), cols = ['⭐','🎉','✨','🌟','🎈'];
  for(let k=0;k<36;k++){
    const e = document.createElement('i');
    e.textContent = pick(cols);
    e.style.cssText = `left:${rnd(0,100)}%;font-size:${rnd(18,38)}px;animation-duration:${rnd(14,26)/10}s;animation-delay:${rnd(0,5)/10}s`;
    fx.appendChild(e);
  }
  setTimeout(()=>fx.innerHTML='',3000);
}
function good(){ S.ok++; S.stars++; const m = pick(PRAISE); toast(m,'g'); sndOk(); confetti(); speak(m); }
function bad(el){ S.bad++; const m = pick(RETRY); toast(m,'r'); sndBad(); speak(m); if(el){el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),400);} }

/* ===== Navegación ===== */
function setNav(){
  $('bPrev').disabled = S.cur===null || S.cur===0;
  $('bNext').disabled = S.cur===null || S.cur===ACTS.length-1;
}
function go(i){ clearTimeout(timer); S.cur = i; setNav(); ACTS[i].run(); }
function home(){
  clearTimeout(timer); S.cur = null; setNav(); speechSynthesis && speechSynthesis.cancel();
  show(`<div class="center"><div class="hero">🦁🔢🐘</div>
  <p class="big">¡Hola! Vamos a aprender los números del 1 al 10.</p>
  <p>Toca, cuenta y juega. ¡Gana muchas estrellas!</p>
  <button class="btn" id="play">▶ ¡Jugar!</button></div>`);
  $('play').onclick = menu;
}
function menu(){
  clearTimeout(timer); S.cur = null; setNav();
  show(`<p class="instr">Elige una actividad:</p><div class="menu">`+
    ACTS.map((a,i)=>`<button class="card c${i} ${S.done[i]?'ok':''}" data-i="${i}"><span class="ico">${a.i}</span><b>${i+1}. ${a.t}</b></button>`).join('')+`</div>`);
  app.querySelectorAll('.card').forEach(c=>c.onclick=()=>go(+c.dataset.i));
}
function complete(){
  S.done[S.cur] = true; confetti(); sndOk();
  const last = S.cur===ACTS.length-1;
  show(`<div class="center"><div class="hero">🏆</div>
  <p class="big">¡Felicitaciones! Terminaste "${ACTS[S.cur].t}".</p>
  <button class="btn na" id="rep">🔁 Repetir</button>
  ${last?'':'<button class="btn" id="nx">➡️ Siguiente actividad</button>'}
  <button class="btn az" id="mn">📋 Volver al menú</button></div>`);
  speak('¡Felicitaciones! Terminaste la actividad.');
  const c = S.cur;
  // Al terminar las 5 actividades se abre el progreso en una ventana modal
  if(Object.keys(S.done).length===ACTS.length) later(progress,2500);
  $('rep').onclick = () => go(c);
  if(!last) $('nx').onclick = () => go(c+1);
  $('mn').onclick = menu;
}
function progress(){
  const tot = S.ok+S.bad, pct = tot ? Math.round(S.ok*100/tot) : 0;
  const medal = S.stars>=25 ? '🥇' : S.stars>=15 ? '🥈' : S.stars>=5 ? '🥉' : '—';
  const d = $('dlg');
  d.innerHTML = `<h2>⭐ Mi progreso</h2><table style="margin:auto">
  <tr><td>Actividades completadas</td><td><b>${Object.keys(S.done).length} / ${ACTS.length}</b></td></tr>
  <tr><td>Respuestas correctas</td><td><b>${S.ok}</b></td></tr>
  <tr><td>Respuestas incorrectas</td><td><b>${S.bad}</b></td></tr>
  <tr><td>Porcentaje de aciertos</td><td><b>${pct}%</b></td></tr>
  <tr><td>Estrellas</td><td><b>${'⭐'.repeat(Math.min(S.stars,10))}${S.stars>10?' +'+(S.stars-10):''} (${S.stars})</b></td></tr>
  <tr><td>Medalla</td><td class="medal">${medal}</td></tr></table>
  <button class="btn" id="cl">¡Seguir jugando!</button>`;
  d.onclose = () => { S.ok = S.bad = S.stars = 0; S.done = {}; menu(); };   // al cerrar, se reinicia el progreso
  d.showModal(); $('cl').onclick = () => d.close();
}
$('bHome').onclick = home;
$('bMenu').onclick = menu;
$('bPrev').onclick = () => S.cur>0 && go(S.cur-1);
$('bNext').onclick = () => S.cur<ACTS.length-1 && go(S.cur+1);

/* ===== Piezas comunes de las actividades ===== */
function instr(txt,round){
  return `<p class="instr"><button class="spk" aria-label="Escuchar" data-say="${txt}">🔊</button><span>${txt}</span></p>`+
         (round?`<p class="round">Ronda ${round}</p>`:'');
}
function bindSpk(){ app.querySelectorAll('.spk').forEach(b=>b.onclick=()=>speak(b.dataset.say)); }
function numTray(){ return '<div class="tray">'+Array.from({length:10},(_,i)=>`<button class="num" data-n="${i+1}">${i+1}</button>`).join('')+'</div>'; }
const objsHtml = (n,e) => Array.from({length:n},(_,i)=>`<button class="obj" data-k="${i}">${e}</button>`).join('');

/* ===== Actividad 1: Conocemos los números ===== */
function a1(){
  const seen = new Set();
  show(instr('Toca un número para verlo y escucharlo.')+`<div class="explore"><div class="tray" style="max-width:none;margin:0">`+
    Array.from({length:10},(_,i)=>`<button class="num" data-n="${i+1}">${i+1}</button>`).join('')+
    `</div><div class="panel" id="pn"><p class="big">👆 Toca un número</p></div></div>`);
  bindSpk();
  app.querySelectorAll('.num').forEach(b=>b.onclick=()=>{
    const n = +b.dataset.n, e = SETS[(n-1)%SETS.length].e;
    seen.add(n); b.classList.add('done'); sndTick();
    $('pn').innerHTML = `<div class="n">${n}</div><p class="big">${WORDS[n-1]}</p><div class="it">${e.repeat(n)}</div>`;
    speak(`${n}, ${WORDS[n-1]}`);
    if(seen.size===10){ good(); later(complete,2200); }
  });
}

/* ===== Actividad 2: Contamos los objetos ===== */
function a2(){
  let r = 0; const TOTAL = 3;
  (function next(){
    if(++r>TOTAL) return complete();
    const n = rnd(1,10), s = pick(SETS); let c = 0;
    show(instr(`Cuenta ${s.n}. Toca cada una para llevar la cuenta.`,`${r} de ${TOTAL}`)+`<div class="objs">${objsHtml(n,s.e)}</div><p class="big" id="cnt">0</p>`);
    bindSpk();
    app.querySelectorAll('.obj').forEach(o=>o.onclick=()=>{
      if(o.classList.contains('on')) return;          // evita contar dos veces
      o.classList.add('on'); c++;
      o.insertAdjacentHTML('beforeend',`<span class="bd">${c}</span>`);
      $('cnt').textContent = c; speak(c); sndTick();
      if(c===n) later(()=>{ $('cnt').textContent = `¡Hay ${n} ${s.n}!`; good(); later(next,2500); },700);
    });
  })();
}

/* ===== Actividad 3: ¿Cuántos objetos hay? ===== */
function a3(){
  let r = 0; const TOTAL = 5;
  (function next(){
    if(++r>TOTAL) return complete();
    const n = rnd(1,10), s = pick(SETS); let sel = 0;
    show(instr('¿Cuántos objetos hay?',`${r} de ${TOTAL}`)+`<div class="objs">${objsHtml(n,s.e).replace(/class="obj"/g,'class="obj" tabindex="-1"')}</div>`+numTray()+`<div class="center"><button class="btn" id="env">Enviar</button></div>`);
    bindSpk();
    const btns = app.querySelectorAll('.num');
    btns.forEach(b=>b.onclick=()=>{ btns.forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.n; speak(sel); });
    $('env').onclick = () => {
      if(!sel) return toast('Elige un número','r');
      if(sel===n){ good(); later(next,2000); }
      else { bad(app.querySelector('.tray')); sel = 0; btns.forEach(x=>x.classList.remove('sel')); }
    };
  })();
}

/* ===== Actividad 4: Relacionamos números y cantidades ===== */
function a4(){
  let r = 0; const TOTAL = 3;
  (function next(){
    if(++r>TOTAL) return complete();
    const nums = shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0,4);
    const groups = shuffle(nums); let sel = null, left = 4;
    show(instr('Toca un número y luego el grupo que tiene esa cantidad.',`${r} de ${TOTAL}`)+
      `<div class="row">`+nums.slice().sort((a,b)=>a-b).map(n=>`<button class="num" data-n="${n}">${n}</button>`).join('')+`</div><div class="row">`+
      groups.map(n=>`<button class="grp" data-n="${n}">${pick(SETS).e.repeat(n)}</button>`).join('')+`</div>`);
    bindSpk();
    const nb = app.querySelectorAll('.num'), gb = app.querySelectorAll('.grp');
    nb.forEach(b=>b.onclick=()=>{
      if(b.classList.contains('done')) return;
      nb.forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel = b; speak(b.dataset.n);
    });
    gb.forEach(g=>g.onclick=()=>{
      if(g.classList.contains('done')) return;
      if(!sel) return toast('Primero elige un número','r');
      if(sel.dataset.n===g.dataset.n){
        g.classList.add('done'); sel.classList.remove('sel'); sel.classList.add('done'); sel = null; good();
        if(--left===0) later(next,2200);
      } else { bad(g); sel.classList.remove('sel'); sel = null; }
    });
  })();
}

/* ===== Actividad 5: Ordenamos los números ===== */
function a5(){
  let r = 0; const TOTAL = 2;
  (function next(){
    if(++r>TOTAL) return complete();
    let arr; do { arr = shuffle([1,2,3,4,5,6,7,8,9,10]); } while(arr.every((v,i)=>v===i+1));
    let sel = -1;
    const draw = () => {
      $('sl').innerHTML = arr.map((n,i)=>`<button class="num ${i===sel?'sel':''}" data-i="${i}">${n}</button>`).join('');
      $('sl').querySelectorAll('.num').forEach(b=>b.onclick=()=>{
        const i = +b.dataset.i; sndTick();
        if(sel<0){ sel = i; }
        else { [arr[sel],arr[i]] = [arr[i],arr[sel]]; sel = -1; }   // intercambia dos tarjetas
        draw();
      });
    };
    show(instr('Ordena los números de menor a mayor. Toca dos tarjetas para cambiarlas de lugar.',`${r} de ${TOTAL}`)+
      `<div class="slots" id="sl"></div><div class="center"><button class="btn" id="chk">Comprobar</button></div>`);
    bindSpk(); draw();
    $('chk').onclick = () => {
      if(arr.every((v,i)=>v===i+1)){ good(); later(next,2200); }
      else bad($('sl'));
    };
  })();
}

home();
