(() => {
'use strict';
const canvas=document.querySelector('#space'), ctx=canvas.getContext('2d');
if(!ctx) return;
const paper=document.querySelector('.paper'), control=document.querySelector('.cloud-controls'), motion=document.querySelector('#motion');
const runway=document.createElement('div');runway.className='cloud-runway';runway.setAttribute('aria-hidden','true');document.querySelector('main').after(runway);
const polish=document.documentElement.lang==='pl';
const media=matchMedia('(prefers-reduced-motion: reduce)');
const touchDevice=matchMedia('(pointer: coarse)');
const phoneMotion=()=>touchDevice.matches&&innerWidth<760;
const travelLength=()=>H*(phoneMotion()?1.2:2.1);
function sizeRunway(){runway.style.height=enabled?(travelLength()+H*.2)+'px':'0'}
let enabled=!media.matches, W=innerWidth,H=innerHeight,dpr=1,seed=4711,particles=[],released=false,returning=false,inhibit=false,last=0,raf=0,cloudAngle=0,phoneTravel=0;
const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const vocab=polish?[["znaczenie", "j\u0119zyk", "poj\u0119cia", "s\u0142owa", "interpretacja", "kontekst", "rozumienie", "semantyka", "r\u00f3\u017cnica", "reprezentacja", "fragmenty", "narracja"], ["pomiar", "wnioskowanie", "dane", "gradienty", "wymiary", "wzorce", "stabilno\u015b\u0107", "psychologia", "postawy", "do\u015bwiadczenie", "emocje", "jednostka"], ["modele", "zachowanie", "trening", "samoopis", "atrybucja", "persona", "sztuczny", "systemy", "odpowied\u017a", "struktura", "uczenie", "percepcja"], ["otwarto\u015b\u0107", "nauka", "ciekawo\u015b\u0107", "pytania", "wsp\u00f3\u0142praca", "wiedza", "metody", "odkrywanie", "relacje", "my\u015bl", "badania", "mo\u017cliwo\u015bci"]]:[
['meaning','language','concepts','words','interpretation','context','understanding','semantic','difference','representation','passages','narrative'],
['measurement','inference','evidence','gradients','dimensions','patterns','stability','psychology','attitudes','experience','emotion','individual'],
['models','behaviour','training','self-report','attribution','persona','artificial','systems','response','structure','learning','perception'],
['openness','science','curiosity','questions','collaboration','knowledge','methods','discovery','relations','thought','research','possibility']
];
const background=Array.from({length:76},(_,i)=>({text:vocab[i%4][Math.floor(i/4)%12],side:i%2,slot:random(),depth:random(),phase:random()*Math.PI*2,size:12+random()*11,threshold:.07+random()*.72,group:i%4}));
function splitWords(){
 const walker=document.createTreeWalker(paper,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
 const nodes=[];while(walker.nextNode()) nodes.push(walker.currentNode);
 for(const node of nodes){const frag=document.createDocumentFragment();for(const part of node.textContent.split(/(\s+)/)){if(!part)continue;if(/^\s+$/.test(part))frag.append(document.createTextNode(part));else{const span=document.createElement('span');span.className='word';span.textContent=part;frag.append(span)}}node.replaceWith(frag)}
}
splitWords();
const words=[...paper.querySelectorAll('.word,.link-icon')];
function dimensions(keepSceneHeight=false){W=innerWidth;if(!keepSceneHeight)H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(innerHeight*dpr);canvas.style.width=W+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
dimensions();
function pos(b,t){
 const bounds=paper.getBoundingClientRect(),margin=Math.max(24,(W-bounds.width)/2-32);
 const x=b.side===0?14+b.depth*Math.max(5,margin-70):W-margin+b.depth*Math.max(5,margin-75);
 return{x:x+Math.sin(t*.15+b.phase)*11,y:45+b.slot*(H-90)+Math.cos(t*.12+b.phase)*14}
}
function backgroundOpacity(b){
 return clamp((clamp(scrollY/breakStart())-b.threshold)*1.7)*(W<760?.13:.43);
}
function fontOf(s){return s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily}
function target(p,i){
 const col=i%4;
 const centerX=W<600?(col%2?W*.70:W*.28):W*(.17+col*.22);
 const centerY=W<600?(col<2?H*.32:H*.59):H*(col%2?.53:.39);
 p.tx=clamp(centerX+(random()-.5)*(W<600?W*.48:W*.29),14,Math.max(15,W-p.width-14));
 p.ty=clamp(centerY+(random()-.5)*H*.54,45,H-145);
}
function colourChannels(colour){
 ctx.fillStyle=colour;
 const normalized=ctx.fillStyle;
 if(normalized.startsWith('#')){
  const hex=normalized.slice(1);
  return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
 }
 return normalized.match(/[\d.]+/g).slice(0,3).map(Number);
}
function sphereColour(p,mix){
 if(!p.cloud||mix===0)return p.color;
 const charcoal=[57,60,55];
 return 'rgb('+p.colourChannels.map((channel,i)=>Math.round(channel+(charcoal[i]-channel)*mix)).join(',')+')';
}
function makeParticle(text,x,y,font,color,width,i){
 const p={text,x,y,ox:x,oy:y,font,color,width,vx:0,vy:0,outwardX:0,outwardY:0,phase:random()*6.28,opacity:1,colourChannels:colourChannels(color)};
 target(p,i);return p;
}
function projectCloud(p,angle){
 if(p.contact)return{...p.contact,depth:2,alpha:1};
 const v=p.cloud;
 if(!v)return{x:p.tx,y:p.ty,scale:1,depth:0,alpha:1};
 const x=v.x*Math.cos(angle)+v.z*Math.sin(angle);
 const z=-v.x*Math.sin(angle)+v.z*Math.cos(angle);
 const tilt=.16*Math.sin(angle*.7);
 const y=v.y*Math.cos(tilt)-z*Math.sin(tilt);
 const depth=v.y*Math.sin(tilt)+z*Math.cos(tilt);
 // Grow continuously with the viewport instead of stopping at a small pixel cap.
 const desktop=clamp((W-600)/600);
 const largerType=1+desktop*clamp((W-900)/1200)*.14;
 const scale=3.5/(3.5-depth*.65)*largerType;
 const compactX=Math.min(W*.27,320),compactY=Math.min(W*.30,H*.255,235);
 const radiusX=(compactX+(Math.min(W*.30,H*.52)-compactX)*desktop)*1.08;
 const radiusY=(compactY+(H*.31-compactY)*desktop)*1.08;
 return{x:W*.5+x*radiusX*scale-p.width*scale/2,
  y:H*.43+y*radiusY*scale,
  scale,depth,alpha:.32+.68*(depth+1)/2};
}
function breakStart(){return Math.max(1,document.querySelector('main').getBoundingClientRect().bottom+scrollY-H-16)}
function measureBaselines(elements){
 // Empty inline boxes sit on the real CSS baseline, including line-height.
 // Batch insertion and measurement to avoid a layout pass for every word.
 const markers=elements.map(el=>{
  // Avoid span-specific decoration rules, such as publication metadata slashes.
  const marker=document.createElement('i');
  marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;vertical-align:baseline';
  el.append(marker);return marker;
 });
 const offsets=new Map(elements.map((el,i)=>[el,markers[i].getBoundingClientRect().top-el.getBoundingClientRect().top]));
 markers.forEach(marker=>marker.remove());return offsets;
}
let fadingUnderlines=[],underlineFadeStart=0;
function captureUnderlines(baselines,offset){
 fadingUnderlines=[];underlineFadeStart=performance.now();
 for(const link of paper.querySelectorAll('a')){
  const style=getComputedStyle(link);
  if(!style.textDecorationLine.includes('underline'))continue;
  const lines=[];
  for(const word of link.querySelectorAll('.word')){
   const rect=word.getBoundingClientRect(),baseline=baselines.get(word);
   if(!rect.width||baseline===undefined)continue;
   const y=rect.top+offset+baseline+(parseFloat(style.textUnderlineOffset)||0);
   let line=lines.find(line=>Math.abs(line.y-y)<1);
   if(line){line.left=Math.min(line.left,rect.left);line.right=Math.max(line.right,rect.right)}
   else lines.push({left:rect.left,right:rect.right,y,colour:style.textDecorationColor,thickness:parseFloat(style.textDecorationThickness)||1});
  }
  fadingUnderlines.push(...lines.filter(line=>line.y>=0&&line.y<=H));
 }
}
function drawUnderlines(now){
 const phase=clamp((now-underlineFadeStart)/800);
 if(phase===1)return;
 ctx.save();ctx.globalAlpha=1-phase*phase*(3-2*phase);
 for(const line of fadingUnderlines){
  ctx.fillStyle=line.colour;ctx.fillRect(line.left,line.y,line.right-line.left,line.thickness);
 }
 ctx.restore();
}
let descendPlaceholder=null;
function floatDownArrow(offset){
 const button=document.querySelector('#descend'),rect=button.getBoundingClientRect();
 const style=getComputedStyle(button);
 descendPlaceholder=document.createElement('div');
 descendPlaceholder.setAttribute('aria-hidden','true');
 descendPlaceholder.style.cssText='width:'+rect.width+'px;height:'+rect.height+'px;margin:'+style.marginTop+' auto '+style.marginBottom;
 button.before(descendPlaceholder);document.body.append(button);
 button.classList.add('floating');
 button.style.cssText='position:fixed;left:'+rect.left+'px;top:'+(rect.top+offset)+'px;margin:0;z-index:4;opacity:1';
}
function restoreDownArrow(){
 if(!descendPlaceholder)return;
 const button=document.querySelector('#descend');
 descendPlaceholder.replaceWith(button);descendPlaceholder=null;
 button.classList.remove('floating');button.removeAttribute('style');button.inert=false;
}
function release(){
 if(released||returning||!enabled)return;
 seed=9371;particles=[];cloudAngle=0;phoneTravel=0;
 control.hidden=false;control.classList.remove('landed');control.inert=true;control.setAttribute('aria-hidden','true');
 const landingWords=[...control.querySelectorAll('.landing-word')];
 const baselines=measureBaselines([...words.filter(word=>!word.classList.contains('link-icon')),...landingWords]);
 const scrollOffset=scrollY-breakStart();
 captureUnderlines(baselines,scrollOffset);
 for(const word of words){const r=word.getBoundingClientRect(),y=r.top+scrollOffset;if(!r.width||y+r.height<0||y>H-25)continue;
 const s=getComputedStyle(word);const font=fontOf(s);
 const item=makeParticle(word.textContent,r.left,y,font,s.color,r.width,particles.length);
 item.baseline=baselines.get(word);
 if(word.classList.contains('link-icon'))item.iconHeight=r.height;
 const isContact=word.closest('#contact .email')||(word.closest('#contact h2')&&!word.closest('.section-number'));
 if(isContact){
  const destination=landingWords.find(el=>el.textContent===word.textContent);
  if(destination){
   const dest=destination.getBoundingClientRect(),style=getComputedStyle(destination);
   item.contact={x:dest.left,y:dest.top,scale:parseFloat(style.fontSize)/parseFloat(s.fontSize)};
   item.contact.y+=baselines.get(destination)-item.baseline*item.contact.scale;
   item.tx=item.contact.x;item.ty=item.contact.y;
  }
 }
 particles.push(item);
 }
 // Use the bounds of the visible text, not the surrounding background words.
 const textLeft=Math.min(...particles.map(p=>p.ox));
 const textRight=Math.max(...particles.map(p=>p.ox+p.width));
 const textTop=Math.min(...particles.map(p=>p.oy));
 const textBottom=Math.max(...particles.map(p=>p.oy+24));
 const centerX=(textLeft+textRight)/2,centerY=(textTop+textBottom)/2;
 // Keep expansion gentle and within the horizontal margins on narrow phones.
 const expansion=Math.max(0,Math.min(W<600?.075:.13,
  (W-24-(textRight-textLeft))/Math.max(1,textRight-textLeft)));
 const time=performance.now()/1000;
 for(let i=0;i<background.length;i++){if(W<760&&i%3!==0)continue;const b=background[i],p=pos(b,time);ctx.font=b.size+'px Georgia';
 const item=makeParticle(b.text,p.x,p.y,b.size+'px Georgia','#798272',ctx.measureText(b.text).width,i);item.background=b;item.opacity=backgroundOpacity(b);particles.push(item)}

 for(const p of particles){
  const dx=(p.ox+p.width/2-centerX)*expansion;
  const dy=(p.oy+12-centerY)*expansion;
  // Stable, small differences: about six degrees and twelve percent in distance.
  const angle=Math.sin(p.phase*2.3)*.105;
  const gain=1+Math.cos(p.phase*1.7)*.12;
  p.outwardX=(dx*Math.cos(angle)-dy*Math.sin(angle))*gain;
  p.outwardY=(dx*Math.sin(angle)+dy*Math.cos(angle))*gain;
 }
 // Every visible word detaches; incidental words fade as meaningful terms settle.
 // Positions are an artistic arrangement, not measured embedding coordinates.
 const seen=new Set(),stop=new Set('with from this that what which their them they into than also have where when about contact making work part together important involving welcome enquiries institute academy society sciences polish warsaw research'.split(' '));
 if(polish)for(const word of ["kt\u00f3re", "kt\u00f3ry", "kt\u00f3ra", "kt\u00f3rych", "oraz", "jest", "jestem", "tego", "tych", "przez", "moich", "mojej", "moje", "swoich", "siebie", "samego", "spos\u00f3b", "tak\u017ce", "zamiast", "stopniu", "jakie", "jako", "gdzie", "kontakt", "napisz", "mnie"])stop.add(word);
 const wordLimit=W<600?64:W<1600?140:180;
 let count=0;
 for(const p of particles){
  if(p.contact){p.alphaTarget=1;continue}
  const key=p.text.toLowerCase().replace(/[^\p{L}-]/gu,'');
  p.alphaTarget=key.length>3&&!stop.has(key)&&!seen.has(key)&&!p.text.includes('@')&&count<wordLimit?p.opacity:0;
  if(p.alphaTarget){seen.add(key);count++}
 }
 // Bring vocabulary from the rest of the page into the final space.
 // These additional words fade in during travel, leaving the initial breakup intact.
 const vocabulary=[...vocab.flat(),...words.map(word=>word.textContent)];
 for(const text of vocabulary){
  if(count>=wordLimit)break;
  const clean=text.replace(/^[^\p{L}]+|[^\p{L}-]+$/gu,'');
  const key=clean.toLowerCase();
  if(key.length<4||stop.has(key)||seen.has(key)||/[@/0-9]/.test(text))continue;
  const size=(W<600?12:13)+random()*5;
  const font=size+'px Georgia';
  ctx.font=font;
  const width=ctx.measureText(clean).width;
  const x=count%2?W-width-18:18;
  const y=H*(.1+random()*.64);
  const item=makeParticle(clean,x,y,font,'#677260',width,count);
  item.opacity=0;item.alphaTarget=.82;
  particles.push(item);seen.add(key);count++;
 }
 for(const p of particles)p.startAlpha=p.opacity;
 const active=particles.filter(p=>p.alphaTarget&&!p.contact);
 const goldenAngle=Math.PI*(3-Math.sqrt(5));
 active.forEach((p,i)=>{
  const y=1-2*(i+.5)/active.length;
  const ring=Math.sqrt(1-y*y),angle=i*goldenAngle;
  const radius=.72+random()*.28;
  p.cloud={x:Math.cos(angle)*ring*radius,y:y*radius,z:Math.sin(angle)*ring*radius};
  p.alphaTarget=Math.max(p.alphaTarget,.8);
  const projected=projectCloud(p,0);
  p.tx=projected.x;p.ty=projected.y;
 });
 floatDownArrow(scrollOffset);
 released=true;document.body.classList.add('released');control.hidden=false;paper.inert=true;
}
function restore(immediate=false){
 if(!released&&!returning)return;
 if(!immediate&&cloudReturn){
  reconstructedAt=performance.now();
  // Do not carry a large queued flick into the newly reconstructed document.
  if(scrollTarget!==null)scrollTarget=Math.max(scrollTarget,scrollY-12);
  scrollRemainder=0;
 }else reconstructedAt=-Infinity;
 // Only explicit navigation needs to suppress release while moving away.
 // Ordinary reconstruction must allow another breakup on the next crossing.
 released=false;inhibit=immediate;returning=!immediate;control.hidden=true;control.classList.remove('landed');control.inert=true;control.setAttribute('aria-hidden','true');paper.inert=false;
 // The document scrolls naturally while its words return.
 fadingUnderlines=[];
 restoreDownArrow();
 paper.style.removeProperty('transform');
 document.body.classList.remove('released');delete document.body.dataset.cloudStage;particles=[];
 returning=false;
}
// Only the boundary between the document and the cloud has scroll resistance.
// Wheel/touch input remains native elsewhere; zoom, keys and scrollbar dragging
// remain available, and reduced-motion visitors always get native scrolling.
let scrollTarget=null,scrollDirection=0,touchPoint=null,cloudReturn=false,scrollRemainder=0,reconstructedAt=-Infinity,autoReturn=null;
function cancelScrollEase(){scrollTarget=null;scrollDirection=0;scrollRemainder=0;autoReturn=null}
function reconstructionRelease(){
 const phase=clamp((performance.now()-reconstructedAt-150)/180);
 return phase*phase*(3-2*phase);
}
function returnResistance(){
 return released?1:1-reconstructionRelease();
}
function reconstructionWeight(y=scrollY){
 // Enter the cushion while the last words are still returning. Its spatial
 // ramp stays lighter than the timed cushion after reconstruction.
 if(released){
  const proximity=clamp(1-Math.max(0,y-breakStart())/(H*.28));
  return 1-.50*proximity*proximity*(3-2*proximity);
 }
 // After the brief pause, restore normal scrolling over just 180 ms.
 return .65+.35*reconstructionRelease();
}
function reconstructionPaused(){
 return cloudReturn&&performance.now()-reconstructedAt<150;
}
function returnProximity(y){
 const distance=(y-breakStart())/H;
 const edge=distance<0?1.15:.85;
 const proximity=clamp(1-Math.abs(distance)/edge);
 return proximity*proximity*(3-2*proximity);
}
function boundaryWeight(y){
 if(cloudReturn&&scrollDirection<0)return (1-.80*returnProximity(y)*returnResistance())*reconstructionWeight(y);
 const distance=(y-breakStart())/H;
 const edge=distance<0?.72:.48;
 const proximity=clamp(1-Math.abs(distance)/edge);
 const smooth=proximity*proximity*(3-2*proximity);
 const resistance=scrollDirection>0&&!touchDevice.matches?.70:.76;
 return 1-resistance*smooth;
}
function easeInput(delta){
 if(!enabled||media.matches||!Number.isFinite(delta)||!delta)return false;
 if(phoneMotion())return false;
 const boundary=breakStart(),direction=Math.sign(delta);
 // Remember an upward return across separate wheel events and touch gestures.
 // Extend its taper into the reconstructed page; downward input stays unchanged.
 if(direction>0||scrollY<boundary-H*1.15){cloudReturn=false;reconstructedAt=-Infinity}
 else if(released||scrollY>=boundary)cloudReturn=true;
 const from=scrollTarget??scrollY,to=from+delta;
 const returningUp=cloudReturn&&direction<0;
 if(returningUp&&!released&&reconstructionRelease()===1&&scrollTarget===null)return false;
 const before=returningUp?1.15:.72,after=returningUp?.85:.48;
 if(Math.max(from,to)<boundary-H*before||Math.min(from,to)>boundary+H*after){
  if(scrollTarget===null)return false;
 }
 if(scrollDirection&&direction!==scrollDirection)scrollTarget=scrollY;
 scrollDirection=direction;
 let target=scrollTarget??scrollY;
 // Integrate resistance across the movement so large wheel events cannot
 // jump over the slowed region in one step.
 let remaining=Math.min(Math.abs(delta),H*2);
 while(remaining>0){
  const step=Math.min(remaining,18);
  target+=direction*step*boundaryWeight(target);
  remaining-=step;
 }
 const limit=document.documentElement.scrollHeight-H;
 // Reduce queued movement near reconstruction so a fast flick leaves time
 // for the words to settle, then smoothly restore the ordinary input response.
 const buffer=returningUp&&reconstructionPaused()?12:H*(.38-(returningUp?.23*returnProximity(scrollY)*returnResistance():0));
 scrollTarget=clamp(target,Math.max(0,scrollY-buffer),Math.min(limit,scrollY+buffer));
 start();
 return true;
}
let breakPause=null,breakPauseArmed=true,manualDescent=false;
function noteScrollIntent(delta){
 if(delta>0)manualDescent=true;
 else if(delta<0){manualDescent=false;breakPause=null}
}
function updateBreakPause(now){
 const boundary=Math.ceil(breakStart());
 if(autoReturn){breakPause=null;manualDescent=false;return}
 if(scrollY<boundary-30){breakPauseArmed=true;breakPause=null}
 if(!breakPause&&breakPauseArmed&&manualDescent&&!released&&!inhibit&&scrollY>=boundary){
  breakPause={until:now+250,boundary,pending:0};breakPauseArmed=false;
 }
 if(!breakPause)return;
 if(scrollY<breakPause.boundary-1){breakPause=null;return}
 const pause=breakPause;
 pause.pending=Math.min(H*.15,Math.max(pause.pending,(scrollTarget??scrollY)-pause.boundary));
 scrollTarget=null;scrollRemainder=0;
 scrollTo({top:pause.boundary,behavior:'instant'});
 if(now>=pause.until){
  breakPause=null;manualDescent=false;
  scrollTarget=pause.boundary+pause.pending;scrollDirection=1;
 }
}
function nestedScroller(target){
 for(let el=target instanceof Element?target:null;el&&el!==document.body;el=el.parentElement){
  if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+1)return true;
 }
 return false;
}
addEventListener('wheel',event=>{
 if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.cancelable||nestedScroller(event.target))return;
 if(autoReturn)cancelScrollEase();
 const delta=event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?H:1);
 noteScrollIntent(delta);
 if(easeInput(delta))event.preventDefault();
},{passive:false});
addEventListener('touchstart',event=>{
 cancelScrollEase();
 touchPoint=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
},{passive:true});
addEventListener('touchmove',event=>{
 if(!touchPoint||event.touches.length!==1){touchPoint=null;return}
 const point=event.touches[0],dy=touchPoint.y-point.clientY,dx=touchPoint.x-point.clientX;
 touchPoint={x:point.clientX,y:point.clientY};
 if(event.cancelable&&Math.abs(dy)>=Math.abs(dx)&&!nestedScroller(event.target)){
  noteScrollIntent(dy);
  if(easeInput(dy))event.preventDefault();
 }
},{passive:false});
addEventListener('touchend',()=>{touchPoint=null},{passive:true});
addEventListener('touchcancel',()=>{touchPoint=null;cancelScrollEase()},{passive:true});
addEventListener('pointerdown',cancelScrollEase,{passive:true});
addEventListener('keydown',()=>{cancelScrollEase();breakPause=null;manualDescent=false});
function updateScrollEase(dt){
 if(scrollTarget===null)return;
 // Let the fully reconstructed page rest before resuming upward movement.
 // Downward input and native keyboard/scrollbar navigation remain immediate.
 if(scrollDirection<0&&reconstructionPaused()){scrollRemainder=0;return}
 const gap=scrollTarget-scrollY;
 if(Math.abs(gap)<.8){window.scrollTo({top:scrollTarget,behavior:'instant'});cancelScrollEase();return}
 const response=.085+(cloudReturn&&scrollDirection<0?.045*returnProximity(scrollY)*returnResistance():0);
 // Preserve fractional movement so the slower tail can finish on pixel-rounded browsers.
 const cushion=cloudReturn&&scrollDirection<0?reconstructionWeight():1;
 const next=scrollY+gap*(1-Math.exp(-dt/response))*cushion+scrollRemainder;
 window.scrollTo({top:next,behavior:'instant'});
 scrollRemainder=next-scrollY;
}
function focusTop(){
 const heading=paper.querySelector('h1');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
}
function evenReturnProgress(t){
 const ramp=.12;
 if(t<ramp)return t*t/(2*ramp*(1-ramp));
 if(t>1-ramp)return 1-(1-t)*(1-t)/(2*ramp*(1-ramp));
 return (t-ramp/2)/(1-ramp);
}
function prepareReturnPaths(forward=false,continueForward=false){
 for(const p of particles){
  const origin=continueForward?{x:p.x,y:p.y}:{x:p.ox,y:p.oy};
  const c1=continueForward?{x:origin.x+p.outwardX,y:origin.y+p.outwardY}:{x:p.ox+p.outwardX*2.7,y:p.oy+p.outwardY*2.7};
  const c2=continueForward?{x:origin.x+(p.tx-origin.x)*.65+p.outwardX*.5,y:origin.y+(p.ty-origin.y)*.65+p.outwardY*.5}:{x:p.ox+p.outwardX*2.1+(p.tx-p.ox)*.12,y:p.oy+p.outwardY*2.1+(p.ty-p.oy)*.12};
  const endpoint=forward?{x:p.tx,y:p.ty}:{x:p.x,y:p.y};
  const points=[];let length=0;
  for(let i=0;i<=120;i++){
   const u=i/120,v=1-u;
   const point={x:v**3*origin.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u**3*endpoint.x,
    y:v**3*origin.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u**3*endpoint.y};
   if(i)length+=Math.hypot(point.x-points[i-1].x,point.y-points[i-1].y);
   points.push({...point,length});
  }
  p.returnPath={points,length};
 }
}
function returnPosition(p,remaining){
 const path=p.returnPath,distance=remaining*path.length;
 const index=path.points.findIndex(point=>point.length>=distance);
 if(index<=0)return index===0?path.points[0]:path.points[path.points.length-1];
 const a=path.points[index-1],b=path.points[index];
 const mix=(distance-a.length)/Math.max(.0001,b.length-a.length);
 return {x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix};
}
function updateAutoReturn(now){
 const journey=autoReturn;if(!journey)return;
 if(journey.phase==='land'){
  if(control.classList.contains('landed')){autoReturn=null;document.querySelector('#return').focus({preventScroll:true})}
  return;
 }
 if(journey.phase==='wait'){
  if(released)return;
  if(journey.restoredAt===undefined)journey.restoredAt=now;
  if(now-journey.restoredAt<150)return;
  journey.phase='top';journey.start=now;journey.from=scrollY;journey.to=0;journey.duration=1400;
 }
 const progress=clamp((now-journey.start)/journey.duration);
 const eased=['reconstruct','deconstruct'].includes(journey.phase)?evenReturnProgress(progress):progress*progress*(3-2*progress);
 if(['reconstruct','deconstruct'].includes(journey.phase))journey.motion=eased;
 scrollTo({top:journey.from+(journey.to-journey.from)*eased,behavior:'instant'});
 if(progress===1){
  if(journey.phase==='approach'){
   inhibit=false;release();prepareReturnPaths(true);
   Object.assign(journey,{phase:'deconstruct',motion:0,start:now,from:scrollY,to:breakStart()+travelLength()+H*.05,duration:phoneMotion()?2400:2000});
  }else if(journey.phase==='deconstruct')journey.phase='land';
  else if(journey.phase==='reconstruct')journey.phase='wait';
  else{autoReturn=null;focusTop()}
 }
}
let previousScroll=scrollY;
function progress(){return clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-H))}
function render(now){
 raf=0;if(!enabled||document.hidden)return;
 const dt=Math.min((now-(last||now))/1000,.035);last=now;
 updateAutoReturn(now);
 updateScrollEase(dt);
 updateBreakPause(now);
 if(phoneMotion()){
  if(scrollY<previousScroll&&released)cloudReturn=true;
  else if(scrollY>previousScroll){cloudReturn=false;reconstructedAt=-Infinity;inhibit=false}
 }
 previousScroll=scrollY;
 const t=now/1000,pr=progress(),distance=scrollY-breakStart();
 document.querySelector('.reading-progress').style.transform='scaleX('+pr+')';
 if(distance< -30)inhibit=false;
 if(distance>=0&&scrollY>250&&!released&&!inhibit&&!breakPause)release();
 else if(distance< -5&&released&&(!phoneMotion()||phoneTravel===0))restore();
 // Keep the fading page rules alongside the words' breakup positions.
 // A transform leaves document height and the scroll boundary unchanged.
 if(released)paper.style.transform='translateY('+Math.max(0,distance)+'px)';
 ctx.clearRect(0,0,W,canvas.height/dpr);ctx.textBaseline='top';
 if(released){
  drawUnderlines(now);

  // One curve blends the outward vector with the cloud-bound direction.
  // There is no phase boundary or pause: scroll controls the entire journey.
  const targetTravel=clamp(distance/travelLength());
  // Limit the visual journey, not native touch scrolling. Ordinary gestures
  // track directly; a flick takes at least 1.5 seconds to cross the curve.
  const maxStep=dt/1.5;
  phoneTravel+=clamp(targetTravel-phoneTravel,-maxStep,maxStep);
  const travel=phoneMotion()?phoneTravel:targetTravel;
  const downArrow=document.querySelector('#descend');
  const arrowFade=clamp((travel-.12)/.18);
  const arrowOpacity=cloudReturn?0:1-arrowFade*arrowFade*(3-2*arrowFade);
  downArrow.style.opacity=String(arrowOpacity);downArrow.inert=arrowOpacity<.02;
  const fade=clamp((travel-.32)/.6);
  const depthProgress=clamp((travel-.72)/.28);
  const depthMix=depthProgress*depthProgress*(3-2*depthProgress);
  // Preserve the page colours until the final fifth of the journey.
  // Blend reversibly as the words become a single rotating space.
  const colourProgress=clamp((travel-.8)/.2);
  const colourMix=colourProgress*colourProgress*(3-2*colourProgress);
  if(!autoReturn)cloudAngle+=dt*.13*depthMix;
  const drawing=[];
  const arrowReconstruction=autoReturn&&['reconstruct','wait'].includes(autoReturn.phase);
  const arrowDeconstruction=autoReturn&&['deconstruct','land'].includes(autoReturn.phase);
  // Finish at the exact source positions before replacing canvas with HTML.
  const animationDistance=phoneMotion()?travel*travelLength():distance;
  const settle=cloudReturn&&!arrowReconstruction?clamp(Math.max(0,animationDistance)/(H*.12)):1;
  const sourceMix=settle*settle*(3-2*settle);
  const documentOffset=-Math.min(0,distance)*(phoneMotion()&&!arrowReconstruction?1-sourceMix:1);
  document.body.dataset.cloudStage=travel<.99?'travelling':'settled';

  for(const p of particles){
   const wordProgress=Math.pow(travel,1+Math.sin(p.phase*2.7)*.16);
   const mix=wordProgress*wordProgress*(3-2*wordProgress);
   const dx=p.tx-p.ox,dy=p.ty-p.oy;
   // A radial first control point prevents opposing cloud directions from
   // cancelling the initial expansion. The second bends gently toward the cloud.
   const c1x=p.ox+p.outwardX*2.7,c1y=p.oy+p.outwardY*2.7;
   const c2x=p.ox+p.outwardX*2.1+dx*.12;
   const c2y=p.oy+p.outwardY*2.1+dy*.12;
   const inverse=1-mix,first=3*inverse*inverse*mix,second=3*inverse*mix*mix;
   const projected=projectCloud(p,cloudAngle);
   const shiftX=(projected.x-p.tx)*depthMix,shiftY=(projected.y-p.ty)*depthMix;
   const drift=mix*mix*(1-depthMix);
   const tx=inverse**3*p.ox+first*c1x+second*c2x+mix**3*p.tx+Math.sin(t*.28+p.phase)*5*drift+shiftX;
   const ty=inverse**3*p.oy+first*c1y+second*c2y+mix**3*p.ty+Math.cos(t*.23+p.phase)*4*drift+shiftY;
   if((arrowReconstruction||arrowDeconstruction)&&p.returnPath){
    // Arc-length sampling keeps the inward curve at an even pace, including
    // its final radial segment, without spring lag or a second settling ease.
    const position=returnPosition(p,arrowDeconstruction?autoReturn.motion:1-autoReturn.motion);
    const live=p.background&&arrowReconstruction?pos(p.background,t):{x:p.ox,y:p.oy};
    p.x=position.x+(live.x-p.ox)*autoReturn.motion;
    p.y=position.y+(live.y-p.oy)*autoReturn.motion;
    p.vx=0;p.vy=0;
   }else if(phoneMotion()){
    // Native touch scroll already has momentum: avoid adding spring lag to it.
    p.x=tx;p.y=ty;p.vx=0;p.vy=0;
   }else{
    const stiffness=48,damping=14;
    p.vx+=(tx-p.x)*stiffness*dt;p.vy+=(ty-p.y)*stiffness*dt;
    p.vx*=Math.exp(-damping*dt);p.vy*=Math.exp(-damping*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
   }
   const alpha=p.startAlpha+(p.alphaTarget-p.startAlpha)*fade;
   p.opacity=phoneMotion()?alpha:p.opacity+(alpha-p.opacity)*Math.min(1,dt*8);
   drawing.push({p,scale:1+(projected.scale-1)*depthMix,
    alpha:p.opacity*(1+(projected.alpha-1)*depthMix),depth:projected.depth*depthMix});
  }
  // Replace the arriving canvas words with real, selectable, clickable text
  // only after they reach the exact positions of the contact footer.
  const contactParticles=particles.filter(p=>p.contact);
  const landed=travel>.995&&contactParticles.length===control.querySelectorAll('.landing-word').length&&contactParticles.every(p=>Math.hypot(p.x-p.contact.x,p.y-p.contact.y)<.7);
  control.classList.toggle('landed',landed);control.inert=!landed;
  control.setAttribute('aria-hidden',String(!landed));
  // Back-to-front drawing and perspective make the volume legible.
  drawing.sort((a,b)=>a.depth-b.depth);
  for(const item of drawing){
   if(item.alpha<.005||(landed&&item.p.contact))continue;
   const p=item.p;
   // Background words keep drifting while the document becomes a cloud.
   // Rejoin their live positions, without the document's scroll displacement.
   const origin=p.background?pos(p.background,t):{x:p.ox,y:p.oy};
   const x=origin.x+(p.x-origin.x)*sourceMix;
   const y=origin.y+(p.y-origin.y)*sourceMix+(p.background?0:documentOffset);
   const alpha=p.background?item.alpha*sourceMix+backgroundOpacity(p.background)*(1-sourceMix):item.alpha;
   ctx.save();ctx.translate(x,y);ctx.scale(item.scale,item.scale);
   ctx.font=p.font;ctx.fillStyle=sphereColour(p,colourMix);ctx.globalAlpha=alpha;
   ctx.textBaseline=p.baseline===undefined?'top':'alphabetic';
   if(p.iconHeight){
    // Draw the same SVG path on the canvas so icons travel with the text.
    ctx.scale(p.width/16,p.iconHeight/16);ctx.strokeStyle=p.color;
    ctx.lineWidth=1.25;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(4,12);ctx.lineTo(12,4);
    ctx.moveTo(4,4);ctx.lineTo(12,4);ctx.lineTo(12,12);ctx.stroke();
   }else ctx.fillText(p.text,0,p.baseline??0);
   ctx.restore();
  }
 }else{
  const mobile=W<760;
  for(let i=0;i<background.length;i++){
   if(mobile&&i%3!==0)continue;
   const b=background[i],opacity=backgroundOpacity(b);if(opacity<=0)continue;
   const p=pos(b,t);ctx.font=b.size+'px Georgia';ctx.fillStyle='#798272';ctx.globalAlpha=opacity;
   ctx.fillText(b.text,p.x,p.y);
  }
 }
 ctx.globalAlpha=1;raf=requestAnimationFrame(render);
}
function start(){if(!raf&&enabled&&!document.hidden){last=0;raf=requestAnimationFrame(render)}}
function setMotion(value){cancelScrollEase();breakPause=null;manualDescent=false;enabled=value;document.querySelector('#descend').hidden=!enabled;document.querySelector('#hero-descend').hidden=false;sizeRunway();motion.hidden=false;motion.setAttribute('aria-pressed',String(!enabled));motion.querySelector('span').textContent=polish?(enabled?'w\u0142.':'wy\u0142.'):(enabled?'on':'off');motion.title=polish?(enabled?'Wy\u0142\u0105cz animacj\u0119 s\u0142\u00f3w':'W\u0142\u0105cz animacj\u0119 s\u0142\u00f3w'):(enabled?'Turn off animated words':'Turn on animated words');if(!enabled){cancelAnimationFrame(raf);raf=0;restore(true);ctx.clearRect(0,0,W,H)}else start()}
motion.addEventListener('click',()=>setMotion(!enabled));media.addEventListener('change',()=>setMotion(!media.matches));
function startDescent(fromHero=false){
 if(!enabled||media.matches){
  scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
  const heading=document.querySelector('#contact h2');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});return;
 }
 cancelScrollEase();cloudReturn=false;reconstructedAt=-Infinity;
 if(released){
  prepareReturnPaths(true,true);
  autoReturn={phase:'deconstruct',motion:0,start:performance.now(),from:scrollY,to:breakStart()+travelLength()+H*.05,duration:phoneMotion()?2400:2000};
 }else autoReturn={phase:'approach',motion:0,start:performance.now(),from:scrollY,to:Math.ceil(breakStart()),duration:fromHero?1400:350};
 start();
}
document.querySelector('#descend').addEventListener('click',()=>startDescent());
document.querySelector('#hero-descend').addEventListener('click',()=>startDescent(true));
document.querySelector('#return').addEventListener('click',()=>{
 cancelScrollEase();
 if(media.matches||!enabled){restore(true);scrollTo({top:0,behavior:'instant'});focusTop();return}
 cloudReturn=true;prepareReturnPaths();
 autoReturn={motion:0,phase:released?'reconstruct':'top',start:performance.now(),from:scrollY,
  to:released?breakStart()-6:0,duration:released?(phoneMotion()?2400:2000):1400};
 start();
});
addEventListener('resize',()=>{
 if(touchDevice.matches&&innerWidth===W){
  // Browser chrome changes viewport height during a swipe. Keep the scene and
  // scroll boundary stable instead of destroying the returning word particles.
  dimensions(true);
  if(released){
   const destinations=[...control.querySelectorAll('.landing-word')];
   const baselines=measureBaselines(destinations);
   for(const p of particles.filter(p=>p.contact)){
    const el=destinations.find(el=>el.textContent===p.text),rect=el.getBoundingClientRect();
    p.contact.x=rect.left;p.contact.y=rect.top+baselines.get(el)-p.baseline*p.contact.scale;
    p.tx=p.contact.x;p.ty=p.contact.y;
   }
  }
 }else{
  const wasReleased=released,position=(scrollY-breakStart())/travelLength();
  cancelScrollEase();restore(true);dimensions();sizeRunway();inhibit=false;
  if(wasReleased){scrollTo({top:breakStart()+Math.max(0,position)*travelLength(),behavior:'instant'});release()}
 }
 start();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelScrollEase();cancelAnimationFrame(raf);raf=0}else start()});
addEventListener('scroll',()=>{document.querySelector('.reading-progress').style.transform='scaleX('+progress()+')';start()},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{cancelScrollEase();restore(true)}));
setMotion(enabled);
})();
