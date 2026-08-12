import './water-button.css';

// 앱 어디서든 동일하게 사용할 수 있는 Water Button 기본 옵션입니다.
export const WATER_BUTTON_DEFAULTS=Object.freeze({
  label:'WATER BUTTON',
  waterColor:'#14dfe8',
  waterLevel:.68,
  glassTint:'rgba(255, 255, 255, .09)',
  frostAmount:12,
  borderColor:'rgba(224, 255, 255, .72)',
  borderRadius:999,
  shadow:'0 20px 46px rgba(0, 0, 0, .42), inset 0 1px 1px rgba(255, 255, 255, .28)',
  waveStrength:1,
  disabled:false,
  onClick:null,
  className:''
});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function normalizeWaterButtonOptions(options={}){
  return {
    ...WATER_BUTTON_DEFAULTS,
    ...options,
    label:String(options.label??WATER_BUTTON_DEFAULTS.label),
    waterLevel:clamp(Number(options.waterLevel??WATER_BUTTON_DEFAULTS.waterLevel),.15,.9),
    frostAmount:Math.max(0,Number(options.frostAmount??WATER_BUTTON_DEFAULTS.frostAmount)),
    borderRadius:Math.max(0,Number(options.borderRadius??WATER_BUTTON_DEFAULTS.borderRadius)),
    waveStrength:clamp(Number(options.waveStrength??WATER_BUTTON_DEFAULTS.waveStrength),.2,3),
    disabled:Boolean(options.disabled),
    className:String(options.className??'')
  };
}

// 외부 물리 엔진 없이 1차원 수면 지점과 독립 물방울 입자를 계산합니다.
export function createWaterButton(rawOptions={}){
  const options=normalizeWaterButtonOptions(rawOptions);
  const button=document.createElement('button');
  const canvas=document.createElement('canvas');
  const label=document.createElement('span');
  const coarsePointer=matchMedia('(pointer: coarse)').matches;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointCount=reducedMotion?24:coarsePointer?42:68;
  const maxDroplets=coarsePointer?14:24;
  const heights=new Float32Array(pointCount);
  const velocities=new Float32Array(pointCount);
  const droplets=[];
  const canvasPadding=52;
  let width=0;
  let height=0;
  let dpr=1;
  let animationFrame=0;
  let awake=false;
  let visible=true;
  let destroyed=false;
  let stillFrames=0;
  let lastTime=0;
  let pointerDown=false;
  let lastPointerX=0;
  let lastPointerTime=0;
  let dropletCooldown=0;

  button.type='button';
  button.className=`water-button ${options.className}`.trim();
  button.disabled=options.disabled;
  button.style.setProperty('--water-glass-tint',options.glassTint);
  button.style.setProperty('--water-frost',`${options.frostAmount}px`);
  button.style.setProperty('--water-border',options.borderColor);
  button.style.setProperty('--water-radius',`${options.borderRadius}px`);
  button.style.setProperty('--water-shadow',options.shadow);
  canvas.className='water-button__canvas';
  canvas.setAttribute('aria-hidden','true');
  label.className='water-button__label';
  label.textContent=options.label;
  button.append(canvas,label);
  const context=canvas.getContext('2d',{alpha:true});

  function roundedRectPath(ctx,x,y,w,h,radius){
    const r=Math.min(radius,w/2,h/2);
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  }

  function resize(){
    const rect=button.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    width=rect.width;
    height=rect.height;
    dpr=Math.min(devicePixelRatio||1,2);
    const canvasWidth=width+canvasPadding*2;
    const canvasHeight=height+canvasPadding*2;
    canvas.width=Math.round(canvasWidth*dpr);
    canvas.height=Math.round(canvasHeight*dpr);
    canvas.style.width=`${canvasWidth}px`;
    canvas.style.height=`${canvasHeight}px`;
    canvas.style.left=`-${canvasPadding}px`;
    canvas.style.top=`-${canvasPadding}px`;
    context.setTransform(dpr,0,0,dpr,0,0);
    render();
  }

  function pointIndex(clientX){
    const rect=button.getBoundingClientRect();
    return Math.round(clamp((clientX-rect.left)/rect.width,0,1)*(pointCount-1));
  }

  function addForce(index,force){
    const strength=options.waveStrength;
    for(let offset=-2;offset<=2;offset+=1){
      const target=index+offset;
      if(target>=0&&target<pointCount)velocities[target]+=force*strength*(1-Math.abs(offset)/3);
    }
    wake();
  }

  function spawnDroplets(index,intensity){
    if(reducedMotion)return;
    const count=Math.min(5,Math.max(2,Math.round(Math.abs(intensity)*.45)));
    const ratio=index/(pointCount-1);
    for(let i=0;i<count&&droplets.length<maxDroplets;i+=1){
      droplets.push({
        x:canvasPadding+ratio*width+(Math.random()-.5)*12,
        y:canvasPadding+height*(1-options.waterLevel)-3,
        vx:(Math.random()-.5)*2.2+intensity*.08,
        vy:-2.8-Math.random()*2.4-Math.min(2,Math.abs(intensity)*.12),
        radius:1.7+Math.random()*2.8,
        alpha:.78+Math.random()*.2
      });
    }
  }

  function splash(clientX,intensity=7){
    if(reducedMotion){render();return}
    const index=pointIndex(clientX);
    addForce(index,-Math.abs(intensity));
    spawnDroplets(index,intensity);
  }

  function simulate(delta){
    const frameScale=clamp(delta/16.67,.55,1.8);
    const tension=.028*frameScale;
    const damping=Math.pow(.965,frameScale);
    let energy=0;
    let strongestIndex=0;
    let strongestWave=0;

    // 인접 지점의 높이 차를 장력으로 사용해 파동을 좌우로 전달합니다.
    for(let pass=0;pass<2;pass+=1){
      for(let i=0;i<pointCount;i+=1){
        const left=heights[i?i-1:i];
        const right=heights[i<pointCount-1?i+1:i];
        velocities[i]+=(left+right-heights[i]*2)*tension;
        velocities[i]+=-heights[i]*.006*frameScale;
      }
      for(let i=0;i<pointCount;i+=1){
        velocities[i]*=damping;
        heights[i]+=velocities[i]*frameScale;
        heights[i]=clamp(heights[i],-20,20);
      }
    }

    for(let i=droplets.length-1;i>=0;i-=1){
      const drop=droplets[i];
      drop.vy+=.17*frameScale;
      drop.x+=drop.vx*frameScale;
      drop.y+=drop.vy*frameScale;
      drop.alpha-=.007*frameScale;
      if(drop.y>height+canvasPadding||drop.alpha<=0)droplets.splice(i,1);
    }

    for(let i=0;i<pointCount;i+=1){
      const pointEnergy=Math.abs(heights[i])+Math.abs(velocities[i]);
      energy+=pointEnergy;
      if(pointEnergy>strongestWave){strongestWave=pointEnergy;strongestIndex=i}
    }
    // 충분히 큰 파도가 위로 솟을 때만 수면에서 추가 물방울을 분리합니다.
    dropletCooldown=Math.max(0,dropletCooldown-delta);
    if(!reducedMotion&&strongestWave>9&&velocities[strongestIndex]<-1.2&&dropletCooldown===0){
      spawnDroplets(strongestIndex,Math.min(9,strongestWave*.5));
      dropletCooldown=180;
    }
    return energy/pointCount;
  }

  function render(){
    if(!width||!height)return;
    const ctx=context;
    const x=canvasPadding;
    const y=canvasPadding;
    const baseY=y+height*(1-options.waterLevel);
    ctx.clearRect(0,0,width+canvasPadding*2,height+canvasPadding*2);

    ctx.save();
    roundedRectPath(ctx,x,y,width,height,options.borderRadius);
    ctx.clip();

    // 수면 지점을 부드러운 곡선으로 연결한 뒤 버튼 아래쪽까지 채웁니다.
    ctx.beginPath();
    ctx.moveTo(x,baseY+heights[0]);
    for(let i=1;i<pointCount;i+=1){
      const previousX=x+(i-1)/(pointCount-1)*width;
      const currentX=x+i/(pointCount-1)*width;
      const previousY=baseY+heights[i-1];
      const currentY=baseY+heights[i];
      ctx.quadraticCurveTo(previousX,previousY,(previousX+currentX)/2,(previousY+currentY)/2);
    }
    ctx.lineTo(x+width,y+height);
    ctx.lineTo(x,y+height);
    ctx.closePath();
    const waterGradient=ctx.createLinearGradient(0,baseY,0,y+height);
    waterGradient.addColorStop(0,options.waterColor);
    waterGradient.addColorStop(.18,options.waterColor);
    waterGradient.addColorStop(1,'#037f98');
    ctx.fillStyle=waterGradient;
    ctx.fill();

    ctx.globalAlpha=.42;
    ctx.strokeStyle='#eaffff';
    ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<pointCount;i+=1){
      const px=x+i/(pointCount-1)*width;
      const py=baseY+heights[i]-1;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();

    const depth=ctx.createLinearGradient(0,baseY,0,y+height);
    depth.addColorStop(0,'rgba(255,255,255,.18)');
    depth.addColorStop(.38,'rgba(0,70,100,.04)');
    depth.addColorStop(1,'rgba(0,20,55,.42)');
    ctx.globalAlpha=1;
    ctx.fillStyle=depth;
    ctx.fillRect(x,baseY,width,height*options.waterLevel+24);
    ctx.restore();

    // 분리된 물방울은 유리 캡슐의 clip 밖에서도 보이도록 마지막에 그립니다.
    for(const drop of droplets){
      ctx.globalAlpha=drop.alpha;
      const dropGradient=ctx.createRadialGradient(drop.x-1,drop.y-1,0,drop.x,drop.y,drop.radius);
      dropGradient.addColorStop(0,'#eaffff');
      dropGradient.addColorStop(.35,options.waterColor);
      dropGradient.addColorStop(1,'rgba(0,130,160,.25)');
      ctx.fillStyle=dropGradient;
      ctx.beginPath();
      ctx.arc(drop.x,drop.y,drop.radius,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    button.dataset.droplets=String(droplets.length);
  }

  function animate(time){
    if(!awake||!visible||destroyed)return;
    const delta=lastTime?Math.min(34,time-lastTime):16.67;
    lastTime=time;
    const energy=simulate(delta);
    render();
    button.dataset.waterAwake='true';
    if(energy<.018&&droplets.length===0&&!pointerDown)stillFrames+=1;else stillFrames=0;
    if(stillFrames>45){
      awake=false;
      animationFrame=0;
      button.dataset.waterAwake='false';
      return;
    }
    animationFrame=requestAnimationFrame(animate);
  }

  function wake(){
    if(reducedMotion||destroyed||!visible)return;
    stillFrames=0;
    if(awake)return;
    awake=true;
    lastTime=0;
    animationFrame=requestAnimationFrame(animate);
  }

  function onPointerDown(event){
    if(button.disabled)return;
    pointerDown=true;
    lastPointerX=event.clientX;
    lastPointerTime=performance.now();
    button.classList.add('is-pressed');
    splash(event.clientX,8);
    // 합성 이벤트나 일부 구형 브라우저는 포인터 캡처를 거부할 수 있습니다.
    try{button.setPointerCapture?.(event.pointerId)}catch{/* 물리 효과는 그대로 계속합니다. */}
  }

  function onPointerMove(event){
    if(button.disabled||(!pointerDown&&event.pointerType==='touch'))return;
    const now=performance.now();
    const elapsed=Math.max(8,now-lastPointerTime);
    const movement=event.clientX-lastPointerX;
    const speed=clamp(movement/elapsed*3,-5,5);
    if(pointerDown||Math.abs(speed)>.6)addForce(pointIndex(event.clientX),-speed*(pointerDown?1.9:1.15));
    lastPointerX=event.clientX;
    lastPointerTime=now;
  }

  function onPointerUp(){
    pointerDown=false;
    button.classList.remove('is-pressed');
  }

  function onKeyDown(event){
    if(button.disabled||!['Enter',' '].includes(event.key))return;
    button.classList.add('is-pressed');
    const rect=button.getBoundingClientRect();
    splash(rect.left+rect.width/2,7);
  }

  function onKeyUp(){button.classList.remove('is-pressed')}
  function onClick(event){if(!button.disabled&&typeof options.onClick==='function')options.onClick(event)}

  button.addEventListener('pointerdown',onPointerDown);
  button.addEventListener('pointermove',onPointerMove);
  button.addEventListener('pointerup',onPointerUp);
  button.addEventListener('pointercancel',onPointerUp);
  button.addEventListener('keydown',onKeyDown);
  button.addEventListener('keyup',onKeyUp);
  button.addEventListener('click',onClick);

  const resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(button);
  const intersectionObserver=new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??true;
    if(!visible){cancelAnimationFrame(animationFrame);animationFrame=0;awake=false}
    else{render();wake()}
  });
  intersectionObserver.observe(button);

  function destroy(){
    if(destroyed)return;
    destroyed=true;
    cancelAnimationFrame(animationFrame);
    animationFrame=0;
    awake=false;
    button.dataset.waterAwake='false';
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    button.removeEventListener('pointerdown',onPointerDown);
    button.removeEventListener('pointermove',onPointerMove);
    button.removeEventListener('pointerup',onPointerUp);
    button.removeEventListener('pointercancel',onPointerUp);
    button.removeEventListener('keydown',onKeyDown);
    button.removeEventListener('keyup',onKeyUp);
    button.removeEventListener('click',onClick);
  }

  // 데모·테스트·화면 전환에서 안전하게 제어할 수 있는 작은 공개 API입니다.
  button.waterButton={
    wake,
    splash,
    destroy,
    getState:()=>({awake,droplets:droplets.length,visible,pointCount,reducedMotion,destroyed})
  };
  requestAnimationFrame(resize);
  return button;
}
