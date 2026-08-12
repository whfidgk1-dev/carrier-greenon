import './style.css';
import {configured,supabase,getDemo,signUp,signIn,signOut,loadCloudState,startMission,addMissionTime,buyReward,saveAircon,missions,rewards as demoRewards} from './store.js';
import {weatherLocation,getHourlyWeather} from './data.js';
import {SALMON_FRAME_DURATION,salmonStoryFrames} from './salmon-story.js';

const app=document.querySelector('#app');
let state={...getDemo(),rewards:demoRewards}; let page='home'; let authOpen=false; let message='';
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const dateText=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date());
const hourlyWeather=getHourlyWeather();
const currentWeather=hourlyWeather[0];

// 마우스를 사용하는 PC에서만 사이트 전용 노란 커서를 만듭니다.
// 터치 기기와 모션 최소화 환경에서는 운영체제 기본 커서를 그대로 사용합니다.
function initCustomCursor(){
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!finePointer||reduceMotion)return;

  const dot=document.createElement('span');
  const ring=document.createElement('span');
  dot.className='custom-cursor-dot';
  ring.className='custom-cursor-ring';
  dot.setAttribute('aria-hidden','true');
  ring.setAttribute('aria-hidden','true');
  document.body.append(dot,ring);
  document.body.classList.add('has-custom-cursor');

  let mouseX=-40;
  let mouseY=-40;
  let ringX=-40;
  let ringY=-40;
  let cursorAnimation=0;
  const interactiveSelector='button, a, input, label, [role="button"]';

  const drawRing=()=>{
    ringX+=(mouseX-ringX)*.24;
    ringY+=(mouseY-ringY)*.24;
    ring.style.transform=`translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    cursorAnimation=requestAnimationFrame(drawRing);
  };

  document.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    mouseX=event.clientX;
    mouseY=event.clientY;
    dot.style.transform=`translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    dot.classList.add('is-visible');
    ring.classList.add('is-visible');
    const interactive=event.target.closest?.(interactiveSelector);
    dot.classList.toggle('is-interactive',Boolean(interactive));
    ring.classList.toggle('is-interactive',Boolean(interactive));
    ring.classList.toggle('is-disabled',Boolean(interactive?.matches(':disabled')));
  });

  document.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch')ring.classList.add('is-pressed');
  });
  document.addEventListener('pointerup',()=>ring.classList.remove('is-pressed'));
  document.documentElement.addEventListener('mouseleave',()=>{
    dot.classList.remove('is-visible');
    ring.classList.remove('is-visible');
  });
  cursorAnimation=requestAnimationFrame(drawRing);
}

initCustomCursor();
function alert(text,type='info'){message=`<div class="toast ${type}">${esc(text)}</div>`;render();setTimeout(()=>{message='';render()},2600)}
function level(points){return points>=5000?'TREE':points>=2000?'SPROUT':'SEED'}
function danger(){const a=state.aircon;return !a.sensorOk||a.filter<20||a.temperature<26}
function header(){return `<header><div class="brand"><span class="logo">C</span><div><b>Carrier GreenON</b><small>나의 시원한 친환경 습관</small></div></div><button class="avatar" data-action="auth" aria-label="계정">${state.user?'😊':'👤'}</button></header>`}
function home(){const a=state.aircon;const bad=danger();const progress=Math.min(100,Math.round(((state.mission?.progress_minutes||0)/120)*100));return `<main>
  <section class="hero"><div><span class="eyebrow">${dateText} · ${weatherLocation}</span><h1>오늘도 지구와 함께<br><em>시원해져요!</em></h1><p>작은 냉방 습관이 큰 초록을 만들어요.</p></div><div class="hero-art salmon-story" role="img" aria-label="곰이 오른쪽에서 왼쪽으로 이동해 연어를 양손으로 잡고 먹은 뒤 오른쪽으로 돌아오는 20프레임 애니메이션"><img class="story-frame" src="/salmon-story/frame-01.png" alt="" aria-hidden="true"></div></section>
  <div class="grid two"><article class="card weather"><div class="card-title"><span class="icon">${currentWeather.icon}</span><div><small>${weatherLocation} 현재 날씨</small><h2>${currentWeather.condition} ${currentWeather.temperature}°C</h2></div></div><div class="chips"><span>습도 62%</span><span>미세먼지 좋음</span></div></article>
  <article class="card ${bad?'danger':''}"><div class="card-head"><div class="card-title"><span class="icon">❄️</span><div><small>거실 에어컨</small><h2>${a.power?'냉방 중':'전원 꺼짐'} · ${a.temperature}°C</h2></div></div><span class="status">${bad?'점검 필요':'정상'}</span></div><div class="stats"><span>바람 ${a.fan}</span><span>필터 ${a.filter}%</span><span>${a.sensorOk?'센서 정상':'센서 오류'}</span></div></article></div>
  <section class="hourly-section" aria-labelledby="hourly-weather-title"><div class="section-head hourly-head"><div><small>GWANGJU WEATHER</small><h2 id="hourly-weather-title">시간별 기온</h2></div><span class="weather-source">가상 날씨 데이터</span></div><div class="hourly-weather" role="list" aria-label="광주 24시간 기온">${hourlyWeather.map((weather,index)=>`<article class="hourly-item ${index===0?'current':''}" role="listitem"><span class="hourly-time">${weather.label}</span><span class="hourly-icon" aria-hidden="true">${weather.icon}</span><strong>${weather.temperature}°</strong><small>${weather.condition}</small></article>`).join('')}</div></section>
  <article class="card mission ${state.mission?.status==='completed'?'success':bad?'danger':''}"><div class="card-head"><div><span class="eyebrow">TODAY'S GREEN MISSION</span><h2>${missions[0].title}</h2></div><span class="reward">+${missions[0].reward_points}P</span></div><p>${missions[0].description}</p><div class="progress"><i style="width:${progress}%"></i></div><div class="progress-label"><b>${state.mission?.status==='completed'?'미션 성공!':`${state.mission?.progress_minutes||0} / 120분`}</b><span>${progress}%</span></div>${bad?'<p class="warning">⚠️ 온도·필터·센서 상태를 확인해 주세요.</p>':''}<div class="actions">${!state.mission?'<button data-action="start">미션 참여하기</button>':state.mission.status==='completed'?'<button disabled>오늘 미션 완료</button>':'<button data-action="advance">시간 +30분</button>'}<button class="secondary" data-page="aircon">상태 조절</button></div></article>
  <section class="section-head"><div><small>MY GREEN</small><h2>초록 습관 현황</h2></div><button class="text-btn" data-page="wallet">자세히 →</button></section>
  <div class="grid three"><article class="mini"><span>💰</span><small>GREEN POINT</small><b>${state.points.toLocaleString()} P</b></article><article class="mini"><span>🌱</span><small>GREEN LEVEL</small><b>${level(state.points)}</b></article><article class="mini"><span>🏆</span><small>완료 미션</small><b>${state.mission?.status==='completed'?1:0}개</b></article></div>
  </main>`}
function aircon(){const a=state.aircon;return `<main><div class="page-title"><span class="eyebrow">SIMULATION</span><h1>가상 에어컨 상태</h1><p>실제 기기 API 없이 상태 변화를 안전하게 체험해요.</p></div><article class="card simulator ${danger()?'danger':''}"><div class="aircon-visual">Carrier <strong>${a.power?a.temperature:'--'}°</strong><small>${a.power?a.mode:'OFF'}</small></div><label>전원 <button class="toggle ${a.power?'on':''}" data-control="power">${a.power?'ON':'OFF'}</button></label><label>설정 온도 <span><button data-control="temp-down">−</button><b>${a.temperature}°C</b><button data-control="temp-up">＋</button></span></label><label>필터 상태 <input data-control="filter" type="range" min="0" max="100" value="${a.filter}"><b>${a.filter}%</b></label><label>센서 <button class="secondary" data-control="sensor">${a.sensorOk?'정상':'오류'}</button></label><p class="hint">26°C 미만, 필터 20% 미만, 센서 오류는 Red 경고 상태입니다.</p></article></main>`}
function wallet(){return `<main><div class="page-title"><span class="eyebrow">GREEN WALLET</span><h1>${state.points.toLocaleString()} P</h1><p>${level(state.points)} 레벨 · 지구를 위한 포인트</p></div><section class="section-head"><h2>포인트 사용내역</h2></section><div class="list">${state.transactions.length?state.transactions.map(t=>`<article><span class="history-icon">${t.amount>0?'＋':'−'}</span><div><b>${esc(t.description)}</b><small>${new Date(t.created_at).toLocaleDateString('ko-KR')}</small></div><strong class="${t.amount<0?'minus':''}">${t.amount>0?'+':''}${Number(t.amount).toLocaleString()} P</strong></article>`).join(''):'<div class="empty">아직 포인트 기록이 없어요.</div>'}</div></main>`}
function shop(){return `<main><div class="page-title shop-title"><span class="eyebrow">GREEN REWARD SHOP</span><h1>초록 습관을 선물로 바꿔요</h1><p>보유 ${state.points.toLocaleString()} P</p></div><div class="products">${state.rewards.map(r=>`<article class="product"><div class="product-art">${r.emoji||'🎁'}</div><span>${esc(r.category)}</span><h2>${esc(r.name)}</h2><p>${esc(r.description||'')}</p><div><b>${Number(r.points).toLocaleString()} P</b><button data-buy="${esc(r.id)}">구매</button></div></article>`).join('')}</div><section class="section-head"><h2>구매내역</h2></section><div class="list">${state.orders.length?state.orders.map(o=>`<article><span class="history-icon">🎁</span><div><b>${esc(o.rewards?.name||o.reward_name)}</b><small>${new Date(o.created_at).toLocaleDateString('ko-KR')}</small></div><strong>${Number(o.points_spent).toLocaleString()} P</strong></article>`).join(''):'<div class="empty">아직 구매한 상품이 없어요.</div>'}</div></main>`}
function report(){const done=state.mission?.status==='completed'?1:0;return `<main><div class="page-title"><span class="eyebrow">GREEN REPORT</span><h1>나의 초록 리포트</h1><p>꾸준한 냉방 습관을 한눈에 확인해요.</p></div><div class="report-hero"><span>🌳</span><h2>${level(state.points)}</h2><p>다음 레벨까지 ${Math.max(0,(state.points<2000?2000:5000)-state.points).toLocaleString()} P</p></div><div class="grid three"><article class="mini"><small>완료 미션</small><b>${done}회</b></article><article class="mini"><small>절약 냉방</small><b>${state.mission?.progress_minutes||0}분</b></article><article class="mini"><small>받은 포인트</small><b>${state.transactions.filter(t=>t.amount>0).reduce((s,t)=>s+Number(t.amount),0)}P</b></article></div></main>`}
function auth(){return authOpen?`<div class="modal-backdrop"><form class="modal" id="auth-form"><button type="button" class="close" data-action="auth">×</button><span class="logo">C</span><h2>${state.user&&configured?'내 계정':'GreenON 시작하기'}</h2>${state.user&&configured?`<p>${esc(state.user.email)}</p><button type="button" data-action="logout">로그아웃</button>`:`<label>이메일<input name="email" type="email" required placeholder="green@example.com"></label><label>비밀번호<input name="password" type="password" minlength="6" required placeholder="6자 이상"></label><button name="mode" value="login">로그인</button><button class="secondary" name="mode" value="signup">회원가입</button>${!configured?'<p class="warning">데모 모드입니다. Supabase 환경변수를 설정하면 인증이 활성화됩니다.</p>':''}`}</form></div>`:''}
function render(){app.innerHTML=`${header()}${message}${page==='home'?home():page==='aircon'?aircon():page==='wallet'?wallet():page==='shop'?shop():report()}<nav>${[['home','⌂','홈'],['aircon','❄','에어컨'],['wallet','P','지갑'],['shop','🎁','리워드'],['report','▥','리포트']].map(([p,i,l])=>`<button data-page="${p}" class="${page===p?'active':''}"><span>${i}</span>${l}</button>`).join('')}</nav>${auth()}`;requestAnimationFrame(startSalmonStory)}
async function refresh(){if(configured&&state.user) state=await loadCloudState(state.user);render()}

// 20장의 프레임을 0.2초마다 교체해 4초 길이의 GIF 같은 장면을 만듭니다.
// 걷기와 잡기 사이의 중간 자세를 촘촘히 넣어 자세가 갑자기 튀는 느낌을 줄였습니다.
salmonStoryFrames.forEach(frame=>{const image=new Image();image.src=frame.src});
let salmonStoryAnimation=0;
function startSalmonStory(){
  cancelAnimationFrame(salmonStoryAnimation);
  const stage=app.querySelector('.salmon-story');
  if(!stage)return;
  const frameImage=stage.querySelector('.story-frame');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    frameImage.src=salmonStoryFrames[0].src;
    return;
  }
  let previousFrame=-1;
  const startedAt=performance.now();
  const showFrame=timestamp=>{
    if(!frameImage.isConnected)return;
    const frameIndex=Math.floor((timestamp-startedAt)/SALMON_FRAME_DURATION)%salmonStoryFrames.length;
    if(frameIndex===previousFrame){salmonStoryAnimation=requestAnimationFrame(showFrame);return}
    const frame=salmonStoryFrames[frameIndex];
    if(!frameImage.src.endsWith(frame.src))frameImage.src=frame.src;
    stage.dataset.storyFrame=String(frameIndex+1);
    previousFrame=frameIndex;
    salmonStoryAnimation=requestAnimationFrame(showFrame);
  };
  salmonStoryAnimation=requestAnimationFrame(showFrame);
}

app.addEventListener('click',async e=>{const target=e.target.closest('button');if(!target)return;
  if(target.dataset.page){page=target.dataset.page;render();return} const action=target.dataset.action;
  if(action==='auth'){authOpen=!authOpen;render();return} if(action==='logout'){await signOut();authOpen=false;location.reload();return}
  if(action==='start'){if(configured){const {error}=await startMission();if(error)return alert(error.message,'error');await refresh()}else state.mission={status:'active',progress_minutes:0};alert('미션을 시작했어요!');return}
  if(action==='advance'){if(danger())return alert('미션 조건을 먼저 정상으로 바꿔 주세요.','error');if(configured){const {error}=await addMissionTime();if(error)return alert(error.message,'error');await refresh()}else{state.mission.progress_minutes+=30;if(state.mission.progress_minutes>=120){state.mission.status='completed';state.points+=300;state.transactions.unshift({id:Date.now(),amount:300,description:'26°C 친환경 냉방 미션',created_at:new Date().toISOString()})}}alert(state.mission.status==='completed'?'미션 성공! 300P를 받았어요.':'30분을 시뮬레이션했어요.','success');return}
  if(target.dataset.control){const c=target.dataset.control,a=state.aircon;if(c==='power')a.power=!a.power;if(c==='temp-down')a.temperature=Math.max(18,a.temperature-1);if(c==='temp-up')a.temperature=Math.min(30,a.temperature+1);if(c==='sensor')a.sensorOk=!a.sensorOk;if(configured){const {error}=await saveAircon(a);if(error)return alert(error.message,'error')}render();return}
  if(target.dataset.buy){const item=state.rewards.find(r=>String(r.id)===target.dataset.buy);if(state.points<item.points)return alert('GREEN POINT가 부족해요.','error');if(configured){const {error}=await buyReward(item.id);if(error)return alert(error.message,'error');await refresh()}else{state.points-=item.points;state.orders.unshift({id:Date.now(),reward_name:item.name,points_spent:item.points,created_at:new Date().toISOString()});state.transactions.unshift({id:Date.now()+1,amount:-item.points,description:item.name+' 구매',created_at:new Date().toISOString()})}alert('상품을 구매했어요!','success')}
});
app.addEventListener('change',async e=>{if(e.target.dataset.control==='filter'){state.aircon.filter=Number(e.target.value);if(configured){const {error}=await saveAircon(state.aircon);if(error)return alert(error.message,'error')}render()}});
app.addEventListener('submit',async e=>{e.preventDefault();const submitter=e.submitter;const data=new FormData(e.target);const fn=submitter.value==='signup'?signUp:signIn;const {data:result,error}=await fn(data.get('email'),data.get('password'));if(error)return alert(error.message,'error');if(submitter.value==='signup'&&!result.session){authOpen=false;return alert('인증 메일을 확인해 주세요.','success')}state.user=result.user;authOpen=false;await refresh();alert('로그인했어요!','success')});
if(configured){supabase.auth.getSession().then(async({data})=>{if(data.session){state.user=data.session.user;await refresh()}else{state={...state,user:null};render()}});supabase.auth.onAuthStateChange((_event,session)=>{if(session&&!state.user){state.user=session.user;setTimeout(refresh,0)}})}else render();
