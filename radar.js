'use strict';
/* Public GitHub activity. Daily calendar count comes ONLY from public contribution
   calendar or its synced cache. Commit details are separate, partial public data. */
(()=>{
 const $=id=>document.getElementById(id);
 const user='dion1727', DAY=86400000,columns=53;
 let daysByDate=new Map(),hasCalendar=false,calendarMode='full',selectedDate='',recent=[];
 const calendar=$('heatmap'),months=$('calendar-months'),notice=$('calendar-notice');
 const valid=o=>o&&/^\d{4}-\d{2}-\d{2}$/.test(o.date)&&Number.isInteger(+o.count)&&+o.count>=0;
 const iso=ms=>new Date(ms).toISOString().slice(0,10);
 const niceDate=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const detailsLink=day=>'https://github.com/'+user+'?tab=overview&from='+day+'&to='+day;
 const clean=t=>String(t||'').replace(/\s+/g,' ').trim();
 const eventTypes={PushEvent:'Push',PullRequestEvent:'Pull request',IssuesEvent:'Issue',CreateEvent:'New branch / tag',ReleaseEvent:'Release',IssueCommentEvent:'Comment',WatchEvent:'Star',ForkEvent:'Fork'};
 const counts=()=>{
   let total=0,active=0;for(const [date,row] of daysByDate){if(date>=iso(Date.now()-364*DAY) && date<=iso(Date.now())){total+=row.count;if(row.count>0)active++;}}
   $('contribution-total').textContent=hasCalendar?total.toLocaleString('id-ID'):'—';
   $('contribution-count-label').textContent=calendarMode==='partial'?'KNOWN COMMITS':'CONTRIBUTIONS';
   $('active-days').textContent=hasCalendar?active:'—';
 };
 function dayEntries(date){return recent.filter(e=>e.date===date).slice(0,5);}
 function showDate(date,persist=true){
   if(persist)selectedDate=date;
   const row=daysByDate.get(date);
   const label=$('selected-day'),count=$('selected-count'),eventBox=$('selected-activity');
   label.textContent=niceDate(date);
   count.textContent=!hasCalendar?'Contribution counts have not synced yet.':row?(row.count+(calendarMode==='partial'?' known public commits (partial)':' GitHub contributions')):'No confirmed count available for this date.';
   $('selected-github').href=detailsLink(date);
   eventBox.replaceChildren();
   const selected=dayEntries(date);
   if(selected.length){
     for(const e of selected){
       const row=document.createElement('div');
       const tag=document.createElement('span');tag.textContent=e.kind+' · '+e.repo+' · ';
       row.append(tag);
       const link=document.createElement('a');link.textContent=e.title;link.href=e.url;link.target='_blank';link.rel='noopener noreferrer';
       row.append(link);eventBox.append(row);
     }
     const note=document.createElement('p');note.textContent='Shown: available public commits/events, not a complete contribution breakdown.';eventBox.append(note);
   }else{
     const p=document.createElement('p');p.textContent='No recent public commit details available for this date. Open GitHub for the original activity.';eventBox.append(p);
   }
   calendar.querySelectorAll('.selected').forEach(c=>c.classList.remove('selected'));
   const target=calendar.querySelector('[data-day="'+date+'"]');if(target)target.classList.add('selected');
 }
 function render(rows=[],source='SYNC PENDING',updated='',mode='full'){
   calendarMode=mode;
   daysByDate=new Map(rows.filter(valid).map(d=>[d.date,{count:+d.count,level:Math.min(4,Math.max(0,+d.level||0))}]));
   hasCalendar=daysByDate.size>0;
   $('radar-source').textContent=hasCalendar?source:'NOT SYNCED';
   $('sync-age').textContent=hasCalendar?new Date(updated||Date.now()).toLocaleDateString('en-US',{dateStyle:'medium'}):'Unavailable';
   counts();
   notice.dataset.state=hasCalendar?'ok':'bad';
   notice.textContent=hasCalendar?(calendarMode==='partial'?'Partial data: recent public commits from selected repositories. This is NOT the full GitHub contribution calendar.':'GitHub daily contribution counts · choose a date for available public commit details.'):'Daily contribution data unavailable. Run the GitHub Action “Sync GitHub contribution data” or retry later; blank squares do not mean zero commits.';
   const today=Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate());
   const firstDay=today-364*DAY;
   const start=firstDay-new Date(firstDay).getUTCDay()*DAY;
   const frag=document.createDocumentFragment();months.replaceChildren();
   let lastMonth='';
   for(let col=0;col<columns;col++){
     const firstInWeek=start+col*7*DAY,month=new Date(firstInWeek).toISOString().slice(0,7);
     if(month!==lastMonth){const name=document.createElement('span');name.style.left=(col*20)+'px';name.textContent=new Date(firstInWeek).toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'});months.append(name);lastMonth=month;}
     for(let row=0;row<7;row++){
       const time=firstInWeek+row*DAY,date=iso(time),future=time>today;
       const entry=daysByDate.get(date),count=entry?.count;
       const level=count>0?Math.max(1,entry.level||Math.min(4,1+Math.floor(Math.log2(count)))):0;
       const cell=document.createElement('button');cell.type='button';cell.className='heat-cell';
       if(future){cell.classList.add('future');cell.disabled=true;cell.tabIndex=-1;}
       else if(!hasCalendar||count===undefined)cell.classList.add('no-data');
       else if(count>0)cell.classList.add('l'+level);
       cell.dataset.day=date;
       cell.title=niceDate(date)+' · '+(!hasCalendar||count===undefined?'data unavailable':count+' contributions');
       cell.setAttribute('aria-label',cell.title);
       if(selectedDate===date)cell.classList.add('selected');
       if(!future){
         cell.addEventListener('mouseenter',()=>showDate(date,false));
         cell.addEventListener('focus',()=>showDate(date,false));
         cell.addEventListener('click',()=>showDate(date,true));
       }
       frag.append(cell);
     }
   }
   calendar.replaceChildren(frag);
   showDate(selectedDate||iso(today),true);
 }
 async function fetchCalendar(){
   const sources=[['https://github-contributions-api.jogruber.de/v4/dion1727?y=last','PUBLIC GITHUB CALENDAR'],['./data/contributions.json?ts='+Date.now(),'CACHED GITHUB CALENDAR']];
   for(const [url,label] of sources){
     try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),url.startsWith('http')?6500:2500);
       let r;try{r=await fetch(url,{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer)}if(!r.ok)continue;
       const d=await r.json();const rows=(Array.isArray(d.contributions)?d.contributions:Array.isArray(d.days)?d.days:[]).filter(valid);
       if(rows.length){render(rows,label,d.fetched_at||new Date().toISOString());return;}
     }catch(_){/* try next public source */}
   }
   render([], 'NOT SYNCED', '');
 }
 const sources=[
   ['dion1727/dion1727.github.io','Website / Portfolio'],
   ['dion1727/ForKrip','Kriptofull'],
   ['dion1727/Transkriva','Transkriva'],
   ['Satar2007/Proyek-Informatika','JIMNY COFFEE']
 ];
 async function fetchJson(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
   let r;try{r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/vnd.github+json'}});}finally{clearTimeout(timer)}
   if(!r.ok)throw Error(r.status);return r.json();}
 async function fetchActivity(){
   const pending=[fetchJson('https://api.github.com/users/'+user+'/events/public?per_page=60')];
   for(const [repo] of sources)pending.push(fetchJson('https://api.github.com/repos/'+repo+'/commits?per_page=30'));
   const results=await Promise.allSettled(pending),items=[];
   if(results[0].status==='fulfilled'&&Array.isArray(results[0].value)){
     for(const e of results[0].value){
       if(!e.created_at)continue;
       const repo=e.repo?.name||'Public GitHub';
       const kind=eventTypes[e.type]||e.type.replace('Event','');
       const parts=repo.split('/');
       const url=parts.length===2?'https://github.com/'+parts.map(encodeURIComponent).join('/'):'https://github.com/'+user;
       const title=e.type==='PushEvent'?('Push to '+clean(e.payload?.ref||'repository').replace('refs/heads/','')):
         (e.type==='PullRequestEvent'?clean(e.payload?.pull_request?.title||'Pull request'):
         e.type==='IssuesEvent'?clean(e.payload?.issue?.title||'Issue'):kind+' activity');
       items.push({date:e.created_at.slice(0,10),stamp:e.created_at,kind,repo,title,url});
     }
   }
   for(let i=1;i<results.length;i++){
     if(results[i].status!=='fulfilled'||!Array.isArray(results[i].value))continue;
     const [repo,display]=sources[i-1];
     for(const commit of results[i].value){
       const login=commit.author?.login;
       if(repo.startsWith('Satar2007/')&&login!==user)continue;
       const c=commit.commit||{},stamp=c.author?.date||c.committer?.date;
       if(!stamp)continue;
       const msg=clean(c.message||'Commit').split('\n')[0].slice(0,140);
       items.push({date:stamp.slice(0,10),stamp,kind:'Commit',repo:display,title:msg,url:commit.html_url||'https://github.com/'+repo});
     }
   }
   const seen=new Set();recent=items.sort((a,b)=>b.stamp.localeCompare(a.stamp)).filter(e=>{
     const key=e.kind==='Commit'?e.url:e.stamp+'|'+e.kind+'|'+e.repo;
     if(seen.has(key))return false;seen.add(key);return true;
   });
   const root=$('activity-feed');root.replaceChildren();
   if(!recent.length){root.textContent='Public GitHub activity could not be loaded. Check API limits or view your GitHub profile.';return;}
   const frag=document.createDocumentFragment();
   for(const item of recent.slice(0,8)){
     const card=document.createElement('article');card.className='event';
     const title=document.createElement('strong');title.textContent=item.title;
     const kind=document.createElement('small');kind.textContent=item.kind+' · '+item.repo;
     const date=document.createElement('small');date.textContent=new Date(item.stamp).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'});
     const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View on GitHub ↗';
     card.append(title,kind,date,link);frag.append(card);
   }
   root.append(frag);
   if(selectedDate)showDate(selectedDate,true);
   if(!hasCalendar){
     const countsByDate=new Map();
     for(const entry of recent){if(entry.kind!=='Commit')continue;countsByDate.set(entry.date,(countsByDate.get(entry.date)||0)+1);}
     if(countsByDate.size){
       render([...countsByDate].map(([date,count])=>({date,count,level:Math.min(4,1+Math.floor(Math.log2(count)))})),'PARTIAL PUBLIC COMMITS',new Date().toISOString(),'partial');
     }
   }
 }
 let busy=false;
 async function refresh(){if(busy)return;busy=true;notice.textContent='Loading public contribution and commit data…';
   try{await Promise.all([fetchCalendar(),fetchActivity()]);}
   finally{busy=false;}
 }
 $('refresh-radar')?.addEventListener('click',refresh);
 render([], 'NOT SYNCED','');refresh();
})();
