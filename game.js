"use strict";
(() => {
  const USER='dion1727';
  const $=(id)=>document.getElementById(id);
  const canvas=$('board'), ctx=canvas.getContext('2d');
  const COLS=26, ROWS=7, STEP=25, BX=20, BY=125;
  const snakeRows=15, snakeCols=23, unit=30;
  const dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  const gameSpeed=()=>Math.max(.75,Number($('game-speed')?.value||1));
  const allDirs=Object.values(dirs);
  let mode='quest', phase='ready', score=0, best=0, lives=3, sound=false;
  let days=[], board=new Map(), active=[], fetchedAt=null, source='not-synced', eventsCache=[];
  let player={x:0,y:0},direction=dirs.right, queued=dirs.right, ghosts=[], stepNumber=0;
  let snake=[], food={x:10,y:7}, ctxAudio=null, last=0;
  let ball={x:345,y:340,vx:3.6,vy:-4.2},paddle={x:286,w:118},bricks=[],breakHeld=null;
  // Canvas-only visual effects. All game rules, scores and GitHub source logic remain unchanged.
  let fx=[],ballTrail=[],lastScore=0,nowFrame=0;
  const reduced=()=>document.body.classList.contains('motion-off')||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function spark(x,y,color,n=12){
    if(reduced())return;
    for(let i=0;i<n;i++){const angle=Math.random()*Math.PI*2,spd=1+Math.random()*3.8;
      fx.push({x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,life:22+Math.random()*18,max:40,color,r:1+Math.random()*2.5});
    }
    if(fx.length>130)fx.splice(0,fx.length-130);
  }
  function particles(){if(reduced()){fx.length=0;return;}ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.045;p.vx*=.98;p.life-=1;
      if(p.life<=0){fx.splice(i,1);continue;}
      ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }ctx.restore();}
  function fillRounded(x,y,w,h,r,color,stroke=null){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  
  const px=(p)=>`${p.x},${p.y}`;
  const inQuest=(p)=>p.x>=0&&p.x<COLS&&p.y>=0&&p.y<ROWS;
  const inSnake=(p)=>p.x>=0&&p.x<snakeCols&&p.y>=0&&p.y<snakeRows;
  const rand=(n)=>Math.floor(Math.random()*n);
  const dayKey=(date)=>date.slice(0,10);
  const formatDate=(d)=>new Date(`${d}T12:00:00Z`).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const prettyTime=(t)=>t?new Date(t).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'belum tersedia';
  const bestKey=()=>`dion-afterhours-v4-${mode}`;
  function soundFX(f=650){ if(!sound)return;try{ctxAudio ??= new (window.AudioContext||window.webkitAudioContext)();const o=ctxAudio.createOscillator(),g=ctxAudio.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.035,ctxAudio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctxAudio.currentTime+.085);o.connect(g);g.connect(ctxAudio.destination);o.start();o.stop(ctxAudio.currentTime+.09);}catch{}}
  function bestLoad(){try{return Number(localStorage.getItem(bestKey())||0)}catch{return 0}}
  function bestUpdate(){if(score>best){best=score;try{localStorage.setItem(bestKey(),String(best))}catch{}}}
  function hud(){ if(score!==lastScore){const label=$('score');label.classList.remove('score-flash');void label.offsetWidth;label.classList.add('score-flash');lastScore=score;} $('score').textContent=String(score).padStart(4,'0');$('best').textContent=String(best).padStart(4,'0');$('third').textContent=String(mode==='snake'?snake.length:lives);$('status').textContent=phase.toUpperCase() }
  function overlay(title,detail,label='Start game ↗'){$('overlay-title').textContent=title;$('overlay-message').textContent=detail;$('overlay-start').textContent=label;$('overlay').classList.remove('hidden')}
  function end(title,detail){phase='game over';bestUpdate();$('pause').disabled=true;overlay(title,detail,'Play again ↗');soundFX(240);hud()}
  function setPhase(playing){phase=playing?'playing':'ready';$('pause').disabled=!playing;$('pause').textContent='Ⅱ Pause';$('overlay').classList.toggle('hidden',playing);last=0;hud()}
  function liveStatus(message,at,src){$('data-status').textContent=message;$('data-updated').textContent=(src?src+' · ':'')+(at?'Updated '+prettyTime(at):'Waiting for sync')}
  function normalize(raw){const items=Array.isArray(raw?.days)?raw.days:Array.isArray(raw?.contributions)?raw.contributions:[];return items.filter(p=>typeof p.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(Number(p.count)))
    .map(p=>({date:p.date,count:Math.max(0,Math.trunc(Number(p.count))),level:Math.max(0,Number(p.level||0))}));}
  async function loadCalendar(force=false){
    liveStatus('Fetching real contribution calendar…',null,null);
    const raw=`https://github-contributions-api.jogruber.de/v4/${USER}?y=last&v=${Math.floor(Date.now()/300000)}`;
    for(const url of [raw, `./data/contributions.json?v=${Date.now()}`]){
      try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)continue;const payload=await r.json();const arr=normalize(payload);
        if(arr.length){days=arr;source=url.includes('jogruber')?'Public contribution calendar mirror':'Full contribution calendar';fetchedAt=payload.fetched_at||(url.includes('jogruber')?new Date().toISOString():null);
          buildBoard();liveStatus(`${arr.filter(d=>d.count>0).length} active days from dion1727 · genuine GitHub counts`,fetchedAt,source);
          if(phase!=='playing')reset(false);return;}
      }catch(e){/* proceed to other sources */}
    }
    // A public events fallback is honest, but NOT the full GitHub contribution calendar.
    try{const ev=eventsCache.length?eventsCache:await fetchPublicEvents();const cnt=new Map();
      for(const e of ev){const d=(e.created_at||'').slice(0,10);if(d)cnt.set(d,(cnt.get(d)||0)+1)}
      if(cnt.size){days=[...cnt].map(([date,count])=>({date,count,level:Math.min(4,count)}));source='Recent public events (partial)';fetchedAt=new Date().toISOString();
        buildBoard();liveStatus(`Showing ${cnt.size} days of public events, NOT the complete contribution calendar`,fetchedAt,source);if(phase!=='playing')reset(false);return;}
    }catch(e){/* offline */}
    days=[];source='Practice only';fetchedAt=null;buildBoard();liveStatus('Calendar unavailable. Practice mode uses clearly marked practice tiles.',null,'Practice');if(phase!=='playing')reset(false);
  }
  async function fetchPublicEvents(){const r=await fetch(`https://api.github.com/users/${USER}/events/public?per_page=100`,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw new Error(`API ${r.status}`);const a=await r.json();eventsCache=Array.isArray(a)?a:[];return eventsCache;}
  async function loadActivity(){
    try{const [pr,ev]=await Promise.all([fetch(`https://api.github.com/users/${USER}`,{headers:{Accept:'application/vnd.github+json'}}),fetchPublicEvents()]);
      if(pr.ok){const d=await pr.json();$('public-repos').textContent=Number(d.public_repos||0).toLocaleString('id-ID');$('followers').textContent=Number(d.followers||0).toLocaleString('id-ID')}
      const top=ev[0];$('recent-event').textContent=top?`${top.type.replace(/Event$/,'')} · ${(top.repo&&top.repo.name)||'GitHub'} · ${prettyTime(top.created_at)}. Public events refresh when you reopen the page.`:'No recent public events returned.';
    }catch(e){$('recent-event').textContent='Public GitHub API temporarily unavailable. The games still work.'}
  }
  function buildBoard(){
    board=new Map();active=[];const now=new Date(),today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()),dow=new Date(today).getUTCDay();const start=today-dow*86400000-(COLS-1)*7*86400000;
    // Board is the latest 26 calendar weeks, left-to-right, Sunday to Saturday.
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const date=new Date(start+(x*7+y)*86400000).toISOString().slice(0,10);
      board.set(`${x},${y}`,{x,y,date,count:0,future:(start+(x*7+y)*86400000)>today,level:0});
    }
    for(const d of days){const dt=Date.parse(d.date+'T00:00:00Z'),col=Math.floor((dt-start)/(7*86400000)),row=new Date(dt).getUTCDay();if(col<0||col>=COLS||dt>today)continue;const target=board.get(`${col},${row}`);if(target){target.count=d.count;target.level=d.level}}
    active=[...board.values()].filter(v=>v.count>0);
    $('stats-title').textContent=(source==='Full contribution calendar'||source==='Public contribution calendar mirror')?`${active.reduce((a,d)=>a+d.count,0)} real contributions on this board`:source==='Recent public events (partial)'?`${active.reduce((a,d)=>a+d.count,0)} recent public events`:'Practice mode';
  }
  function practiceTiles(){const used=new Set();const list=[];for(let i=0;i<28;i++){let x=rand(COLS),y=rand(ROWS);while(used.has(`${x},${y}`)){x=rand(COLS);y=rand(ROWS)}used.add(`${x},${y}`);list.push({x,y,date:'Practice',count:1,level:1,practice:true})}return list;}
  let tiles=[];
  function randomStart(){return {x:1,y:3}}
  function reset(start){
    score=0;lastScore=0;fx=[];ballTrail=[];lives=3;stepNumber=0;best=bestLoad();player=randomStart();direction=dirs.right;queued=dirs.right;
    tiles=(active.length?active:practiceTiles()).map(v=>({...v})).filter(t=>!(t.x===player.x&&t.y===player.y));
    setupBreaker();
    ghosts=[{x:20,y:1},{x:16,y:5}];snake=[{x:4,y:7},{x:3,y:7},{x:2,y:7}];placeFood();setPhase(start);
    if(!start)overlay(mode==='quest'?'Commit Quest':mode==='breaker'?'Commit Breaker':'Pixel Snake',mode==='quest'?((source==='Full contribution calendar'||source==='Public contribution calendar mirror')?'Collect actual dion1727 contribution days. Tiles score their real GitHub counts.':source==='Recent public events (partial)'?'Playing recent real public events (partial calendar). Collect tiles and dodge bugs.':'Practice mode while GitHub data sync is unavailable.'):'Eat green pixels, grow longer, and avoid your own tail.');
    draw();
  }
  function setMode(m){
    mode=m;
    $('game-top-title').textContent=({quest:'COMMIT QUEST',snake:'PIXEL SNAKE',breaker:'COMMIT BREAKER'})[m];
    document.querySelector('.game-main').dataset.mode=m;
    document.querySelector('.canvas-wrap').dataset.mode=m;
    fx=[];ballTrail=[];
    for(const key of ['quest','snake','breaker']){
      const b=$('mode-'+key);b.classList.toggle('active',key===m);b.setAttribute('aria-pressed',String(key===m));
    }
    $('third-label').childNodes[0].textContent=m==='quest'?'LIVES':m==='snake'?'LENGTH':'LIVES';
    $('how-title').textContent=m==='quest'?'Collect the commits.':m==='snake'?'Keep growing.':'Break the board.';
    $('how-text').textContent=m==='quest'?'Use arrows or WASD. Pick up GitHub tiles; dodge the bugs.':m==='snake'?'Collect glowing food. Avoid walls and your tail.':'Move the paddle with ← → or A / D. Clear the bricks.';
    reset(false);
  }
  function setupBreaker(){
    paddle={x:285,w:120};ball={x:345,y:340,vx:3.6,vy:-4.2};
    const genuine=active.length?active.filter(x=>x.count>0):[];
    bricks=[];
    for(let r=0;r<5;r++)for(let c=0;c<13;c++){
      const entry=genuine[(r*13+c)%Math.max(1,genuine.length)];
      if(genuine.length&& !entry)continue;
      bricks.push({x:27+c*49,y:62+r*29,w:43,h:21,hp:1,date:entry?.date||'Practice',count:entry?.count||1,level:entry?.level||1,practice:!genuine.length});
    }
  }
  function breakerTick(){
    if(breakHeld==='left')paddle.x=Math.max(15,paddle.x-7);
    if(breakHeld==='right')paddle.x=Math.min(675-paddle.w,paddle.x+7);
    ball.x+=ball.vx*gameSpeed();ball.y+=ball.vy*gameSpeed();
    if(ball.x<=13||ball.x>=677)ball.vx*=-1;
    if(ball.y<=23)ball.vy=Math.abs(ball.vy);
    if(ball.y>=398&&ball.y<=417&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w&&ball.vy>0){
      spark(ball.x,403,'#a6eff1',8);ball.vy=-Math.abs(ball.vy);ball.vx=((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*5.2;
      soundFX(380);
    }
    if(ball.y>441){lives--;soundFX(220);if(lives<=0)return end('Out of lives',`Earned ${score} points. Try again.`);ball={x:paddle.x+paddle.w/2,y:336,vx:3.5,vy:-4.2}}
    for(let i=bricks.length-1;i>=0;i--){let b=bricks[i];if(ball.x+6>b.x&&ball.x-6<b.x+b.w&&ball.y+6>b.y&&ball.y-6<b.y+b.h){
      ball.vy*=-1;spark(ball.x,ball.y,'#ffc3a0',19);bricks.splice(i,1);score+=b.count;bestUpdate();soundFX(700);
      $('recent-event').textContent=`${b.date} · ${b.count} ${b.practice?'practice points':'contributions'} cleared.`;
      break;
    }}
    if(!bricks.length)end('Board cleared!',`You broke all bricks and scored ${score} points.`);
  }
  function pause(){if(phase==='playing'){phase='paused';overlay('Paused','Take a break. Your progress will stay here.','Resume ↗');$('pause').textContent='▶ Resume'}else if(phase==='paused'){phase='playing';$('overlay').classList.add('hidden');$('pause').textContent='Ⅱ Pause';last=0}hud()}
  function move(d){if(!d)return;if(mode==='breaker'){paddle.x=Math.max(15,Math.min(675-paddle.w,paddle.x+(d.x*33)));return;}if(mode==='snake'&&snake.length>1&&d.x===-direction.x&&d.y===-direction.y)return;queued=d;if(mode==='quest')direction=d}
  function questTick(){
    const p={x:player.x+direction.x,y:player.y+direction.y};if(inQuest(p))player=p;
    const i=tiles.findIndex(t=>t.x===player.x&&t.y===player.y);if(i>=0){const t=tiles.splice(i,1)[0];score+=t.count;spark(BX+player.x*STEP+STEP/2,BY+player.y*STEP+STEP/2,'#a9ebfc',16);bestUpdate();soundFX(780);$('recent-event').textContent=(t.practice?'Practice tile':formatDate(t.date))+` · ${t.count} ${source==='Recent public events (partial)'?'public events':'contributions'} collected!`;if(!tiles.length)return end('Board cleared!',`Collected ${score} ${source==='Recent public events (partial)'?'events':'contributions'}. Play again?`)}
    if(stepNumber%4===0)for(const g of ghosts){const ways=allDirs.map(d=>({x:g.x+d.x,y:g.y+d.y})).filter(inQuest);if(ways.length){ways.sort((a,b)=>(Math.abs(a.x-player.x)+Math.abs(a.y-player.y))-(Math.abs(b.x-player.x)+Math.abs(b.y-player.y)));const target=Math.random()<.52?ways[0]:ways[rand(ways.length)];g.x=target.x;g.y=target.y}}
    if(ghosts.some(g=>px(g)===px(player))){spark(BX+player.x*STEP,BY+player.y*STEP,'#ffa6a9',25);lives--;soundFX(230);player=randomStart();direction=dirs.right;if(lives<=0)end('Out of lives',`Collected ${score} contribution points. Try again.`)}
  }
  function randomFood(){const occ=new Set(snake.map(px));const choices=[];for(let y=0;y<snakeRows;y++)for(let x=0;x<snakeCols;x++)if(!occ.has(`${x},${y}`))choices.push({x,y});return choices.length?choices[rand(choices.length)]:null}
  function placeFood(){food=randomFood()||{x:10,y:7}}
  function snakeTick(){direction=queued;const p={x:snake[0].x+direction.x,y:snake[0].y+direction.y},eat=px(p)===px(food);const body=eat?snake:snake.slice(0,-1);if(!inSnake(p)||body.some(t=>px(t)===px(p)))return end('Game over',`You scored ${score}. Another round?`);snake.unshift(p);if(eat){spark(p.x*unit+unit/2,p.y*unit+unit/2,'#b7ffe0',20);score+=10;bestUpdate();soundFX(760);placeFood();if(snake.length>=snakeRows*snakeCols-1)end('You win!','Board completely filled!')}else snake.pop()}
  function rect(x,y,w,h,fill,stroke,r=5){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=1;ctx.strokeStyle=stroke;ctx.stroke()}}
  // Render at 60fps, with intentionally separate visual languages for the three games.
  function draw(t=performance.now()){
    nowFrame=t;
    const W=canvas.width,H=canvas.height,quiet=reduced();
    const g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#123e60');g.addColorStop(.55,'#153d5d');g.addColorStop(1,'#163754');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Calm frosted glass glow and faint architectural grid.
    const haze=ctx.createRadialGradient(W*.68,H*.28,0,W*.68,H*.28,W*.7);
    haze.addColorStop(0,'#5fb0d524');haze.addColorStop(1,'#1a598200');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#d2f0ff10';ctx.lineWidth=.65;
    for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    if(mode==='quest'){
      ctx.fillStyle='#b1d1e6';ctx.font='11px ui-monospace,Consolas,monospace';ctx.textAlign='left';
      ctx.fillText('← OLDER',20,42);ctx.fillText('GITHUB ACTIVITY  /  26 WEEKS',215,42);ctx.fillText('NEWER →',600,42);
      fillRounded(13,67,665,246,16,'#d0ecff0c','#d0ecff29');
      const tags=['S','M','T','W','T','F','S'];ctx.font='10px ui-monospace,monospace';
      tags.forEach((v,i)=>{ctx.fillStyle='#98bcd6';ctx.fillText(v,5,BY+i*STEP+16)});
      const colors=['#214c6c','#397a9f','#559ec2','#7dcee1','#b9eaf1'];
      for(const d of board.values()){
        const x=BX+d.x*STEP,y=BY+d.y*STEP;
        const intensity=Math.max(0,Math.min(4,d.level||Math.ceil(d.count/3)));
        fillRounded(x+2,y+2,STEP-4,STEP-4,d.future?4:5,d.future?'#1d4360':d.count?colors[intensity]:'#2b5a7b',d.count?'#caefff38':'#e2f8ff14');
      }
      for(const tile of tiles){
        const cx=BX+tile.x*STEP+STEP/2,cy=BY+tile.y*STEP+STEP/2;
        const pulse=quiet?0:(Math.sin(t/250+(tile.x+tile.y)*.63)+1)*.5;
        ctx.save();ctx.globalAlpha=.23+.16*pulse;ctx.fillStyle=tile.practice?'#b6e3ff':'#bcffee';ctx.beginPath();ctx.arc(cx,cy,11+pulse*5,0,Math.PI*2);ctx.fill();ctx.restore();
        fillRounded(cx-6,cy-6,12,12,3,tile.practice?'#e2ecff':'#c4fff2','#fff');
      }
      for(const ghost of ghosts){
        const gx=BX+ghost.x*STEP+STEP/2,gy=BY+ghost.y*STEP+STEP/2;
        ctx.fillStyle='#ffc09f';ctx.beginPath();ctx.arc(gx,gy-1,9,Math.PI,0);ctx.lineTo(gx+9,gy+8);ctx.lineTo(gx+5,gy+5);ctx.lineTo(gx+2,gy+8);ctx.lineTo(gx-2,gy+5);ctx.lineTo(gx-6,gy+8);ctx.lineTo(gx-9,gy+5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#16405d';ctx.fillRect(gx-4,gy-2,2,4);ctx.fillRect(gx+2,gy-2,2,4);
      }
      const px0=BX+player.x*STEP+STEP/2,py0=BY+player.y*STEP+STEP/2;
      ctx.save();ctx.translate(px0,py0);
      ctx.rotate(direction.x===1?0:direction.x===-1?Math.PI:direction.y===1?Math.PI/2:-Math.PI/2);
      ctx.fillStyle='#fff5d6';ctx.shadowColor='#fff1b8';ctx.shadowBlur=13;
      ctx.beginPath();ctx.arc(0,0,9,.25,Math.PI*2-.25);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();
      ctx.textAlign='left';ctx.fillStyle='#aed0e6';ctx.font='11px ui-monospace,monospace';
      ctx.fillText(source==='Practice only'?'PRACTICE BOARD — OFFLINE':source==='Recent public events (partial)'?'RECENT PUBLIC ACTIVITY — PARTIAL':'SYNCED CONTRIBUTION COUNTS',20,371);
      ctx.fillText(`${tiles.length} tiles remaining   •   hover for dates`,20,397);
    }else if(mode==='snake'){
      const gridA='#2c6985',gridB='#306f8b';
      for(let y=0;y<snakeRows;y++)for(let x=0;x<snakeCols;x++){
        fillRounded(x*unit+3,y*unit+3,unit-6,unit-6,6,(x+y)%2?gridA:gridB,'#d4faff0d');
      }
      // Slightly transparent tail, fresher mint head and eye glints.
      for(let i=snake.length-1;i>=0;i--){
        const v=snake[i],x=v.x*unit+4,y=v.y*unit+4;
        const intensity=1-(i/Math.max(3,snake.length))*.38;
        ctx.save();ctx.globalAlpha=intensity;
        fillRounded(x,y,unit-8,unit-8,i?8:10,i?'#77c6be':'#d9fff3',i?'#b1fff633':'#ffffffb9');
        if(i===0){ctx.fillStyle='#184f69';
          const dx=direction.x===1?6:direction.x===-1?-6:0,dy=direction.y===1?6:direction.y===-1?-6:0;
          ctx.beginPath();ctx.arc(x+7+dx*.25,y+7+dy*.25,2,0,Math.PI*2);ctx.arc(x+15+dx*.25,y+7+dy*.25,2,0,Math.PI*2);ctx.fill();}
        ctx.restore();
      }
      const fx0=food.x*unit+unit/2,fy0=food.y*unit+unit/2;
      const r=quiet?7:7+Math.sin(t/160)*1.7;
      ctx.fillStyle='#ffce9f';ctx.shadowColor='#f7b183';ctx.shadowBlur=quiet?0:19;
      ctx.beginPath();ctx.arc(fx0,fy0,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='#ffc0a188';ctx.beginPath();ctx.arc(fx0,fy0,quiet?11:13+Math.sin(t/290)*3,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.fillStyle='#b9e3f7';ctx.font='12px ui-monospace,monospace';ctx.fillText('COMMIT BREAKER   /   ← →  MOVE PADDLE',21,28);
      const colors=['#367d9c','#4e9db6','#76bbc4','#b0dcd4','#ffd3b9'];
      for(const b of bricks){
        const c=b.practice?'#5294ab':colors[Math.min(4,b.level||0)];
        fillRounded(b.x,b.y,b.w,b.h,6,c,'#ffffff4e');
        fillRounded(b.x+4,b.y+3,b.w-8,3,2,'#ffffff3c');
      }
      ballTrail.unshift({x:ball.x,y:ball.y});if(ballTrail.length>13)ballTrail.length=13;
      if(!quiet){ctx.save();for(let i=ballTrail.length-1;i>=0;i--){let v=ballTrail[i];ctx.globalAlpha=(1-i/ballTrail.length)*.35;ctx.fillStyle='#fff7da';ctx.beginPath();ctx.arc(v.x,v.y,Math.max(1,5-i*.28),0,Math.PI*2);ctx.fill()}ctx.restore()}
      fillRounded(paddle.x,407,paddle.w,17,9,'#c9fff1','#eaffff');
      fillRounded(paddle.x+12,410,paddle.w-24,4,2,'#ffffff81');
      ctx.save();ctx.shadowBlur=quiet?0:18;ctx.shadowColor='#fff4c3';ctx.fillStyle='#fff6dd';ctx.beginPath();ctx.arc(ball.x,ball.y,7,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle='#b9d9eb';ctx.font='11px ui-monospace,monospace';ctx.fillText(source==='Practice only'?'PRACTICE BRICKS':'ACTIVITY-POWERED BRICKS',20,443);
    }
    particles();
  }
  function frame(t){const threshold=(mode==='breaker'?16:mode==='quest'?105:135)/gameSpeed();if(phase==='playing'&&(last===0||t-last>=threshold)){if(last===0)last=t;else{last=t;stepNumber++;mode==='quest'?questTick():mode==='snake'?snakeTick():breakerTick();hud()}}draw(t);requestAnimationFrame(frame)}
  $('mode-quest').addEventListener('click',()=>setMode('quest'));
  $('mode-snake').addEventListener('click',()=>setMode('snake'));
  $('mode-breaker').addEventListener('click',()=>setMode('breaker'));
  $('start').addEventListener('click',()=>reset(true));
  $('pause').addEventListener('click',pause);
  $('overlay-start').addEventListener('click',()=>phase==='paused'?pause():reset(true));
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'♪ Sound on':'♪ Sound off';$('sound').setAttribute('aria-pressed',String(sound));soundFX(770)});
  $('refresh-data').addEventListener('click',()=>{loadCalendar(true);loadActivity()});
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;
    if(mode==='breaker' && ['arrowleft','arrowright','a','d'].includes(e.key.toLowerCase()))breakHeld=['arrowleft','a'].includes(e.key.toLowerCase())?'left':'right';const k=e.key.toLowerCase(),v={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'}[k];if(v){e.preventDefault();move(dirs[v]);}else if(k===' '){e.preventDefault();phase==='ready'||phase==='game over'?reset(true):pause()}});
  document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(k))breakHeld=null;});
  document.querySelectorAll('[data-dir]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{e.preventDefault();move(dirs[b.dataset.dir]);if(mode==='breaker')breakHeld=b.dataset.dir==='left'?'left':b.dataset.dir==='right'?'right':null;});
    for(const type of ['pointerup','pointercancel','pointerleave'])b.addEventListener(type,()=>{breakHeld=null;});
  });
  canvas.addEventListener('mousemove',e=>{if(mode!=='quest')return;const r=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)*canvas.width/r.width-BX)/STEP),y=Math.floor(((e.clientY-r.top)*canvas.height/r.height-BY)/STEP),d=board.get(`${x},${y}`);canvas.title=d&&!d.future?`${formatDate(d.date)} — ${d.count} contributions`:'GitHub contribution calendar'});
  $('year').textContent=String(new Date().getFullYear());
  const requested=new URL(location.href).searchParams.get('game');setMode(['snake','breaker'].includes(requested)?requested:'quest');buildBoard();requestAnimationFrame(frame);
  loadActivity();loadCalendar();setInterval(()=>{loadActivity();if(phase!=='playing')loadCalendar()},300000);
})();
