'use strict';
const db=window.econovaDb;
const byId=id=>document.getElementById(id);
let page=1,total=0,sequence=0,authorized=false;
let authEpoch=0,demoInstance=null,demoLoading=false;
function selectWorkspace(name){
  if(!authorized)return;
  const demo=name==='demo';
  byId('feedback-workspace').hidden=demo;byId('demo-workspace').hidden=!demo;
  byId('view-feedback').setAttribute('aria-pressed',String(!demo));byId('view-demo').setAttribute('aria-pressed',String(demo));
  demoInstance?.setVisible(demo);
}
async function openProductDemo(){
  if(!authorized||demoLoading)return;
  selectWorkspace('demo');
  if(demoInstance)return;
  const epoch=authEpoch;demoLoading=true;
  const root=byId('demo-root');root.classList.remove('pd-error');root.textContent='Loading the private demo…';
  try{
    const module=await import('./product-demo.js');
    const instance=await module.mountProductDemo(root,{db,isAuthorized:()=>authorized&&epoch===authEpoch,onDenied:()=>{if(epoch===authEpoch)showLogin('Please sign in again with the authorized account.',true);}});
    if(!authorized||epoch!==authEpoch){instance.destroy();return;}
    demoInstance=instance;demoInstance.setVisible(!byId('demo-workspace').hidden);
  }catch(error){if(authorized&&epoch===authEpoch){root.textContent=error.message||'The demo could not be loaded. Please try again.';root.classList.add('pd-error');}}
  finally{if(epoch===authEpoch)demoLoading=false;}
}
function node(tag,text,className){const item=document.createElement(tag);if(text!==undefined)item.textContent=text;if(className)item.className=className;return item;}
function showLogin(message='Only the authorized dashboard account can access responses.',error=false){
  authEpoch++;demoInstance?.destroy();demoInstance=null;demoLoading=false;byId('demo-root').replaceChildren();byId('demo-root').classList.remove('pd-error');
  authorized=false;sequence++;byId('dashboard-view').hidden=true;byId('login-view').hidden=false;byId('sign-out').hidden=true;byId('signed-in-email').textContent='';
  byId('items').replaceChildren();byId('total').textContent='—';byId('average').textContent='—';byId('distribution').replaceChildren();
  byId('login-status').textContent=message;byId('login-status').classList.toggle('error',error);
}
function params(exporting=false){return {p_search:byId('search').value.trim(),p_rating:byId('rating').value?Number(byId('rating').value):null,p_page:page,p_export:exporting};}
function render(items){
  const list=byId('items');list.replaceChildren();
  if(!items.length){const empty=node('div',undefined,'empty');empty.append(node('h3','No feedback to show.'),node('p','New submissions will appear here. Try clearing filters or refreshing.'));list.append(empty);return;}
  for(const item of items){
    const article=node('article',undefined,'feedback-item');const heading=node('div',undefined,'item-heading');const person=node('div',undefined,'item-person');
    const email=node('a',item.email);email.href='mailto:'+encodeURIComponent(item.email);person.append(node('h3',item.name),email);
    const meta=node('div',undefined,'item-meta');const stars=node('span','★'.repeat(item.rating)+'☆'.repeat(5-item.rating),'stars');stars.setAttribute('aria-label',item.rating+' out of 5 stars');
    const time=node('time',new Date(item.created_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}));time.dateTime=item.created_at;
    meta.append(stars,time);heading.append(person,meta);article.append(heading,node('p',item.comments,'comment'));list.append(article);
  }
}
function rpcError(error){
  if(['42501','PGRST301','PGRST302','PGRST303'].includes(error.code)){showLogin('Please sign in again with the authorized account.',true);return;}
  throw Error(error.code==='PGRST202'?'The database setup is not complete yet. Please try again after setup.':error.message||'Unable to load feedback.');
}
async function load(){
  if(!authorized)return;const current=++sequence;const status=byId('status');status.classList.remove('error');status.textContent='Loading feedback…';byId('items').setAttribute('aria-busy','true');byId('previous').disabled=true;byId('next').disabled=true;
  try{
    const {data,error}=await db.rpc('econova_list_feedback',params());if(current!==sequence||!authorized)return;
    if(error){rpcError(error);return;}
    total=data.total;byId('total').textContent=String(total);byId('average').textContent=data.average===null?'—':Number(data.average).toFixed(1);
    const bars=byId('distribution');bars.replaceChildren();
    for(let rating=5;rating>=1;rating--){const count=Number(data.breakdown.find(item=>item.rating===rating)?.count||0);const row=node('div',undefined,'rating-bar');const track=node('div',undefined,'track');const fill=node('div');fill.style.width=(total?count/total*100:0)+'%';track.append(fill);row.append(node('span',rating+' ★'),track,node('span',String(count)));bars.append(row);}
    render(data.items);const pages=Math.max(1,Math.ceil(total/data.pageSize));byId('page-info').textContent='Page '+page+' of '+pages;byId('previous').disabled=page<=1;byId('next').disabled=page>=pages;status.textContent=total+' response'+(total===1?'':'s')+' · Showing '+data.items.length+' on this page.';
  }catch(error){if(current!==sequence)return;status.textContent=error.message||'Unable to connect. Please try again.';status.classList.add('error');byId('items').replaceChildren();}
  finally{if(current===sequence)byId('items').setAttribute('aria-busy','false');}
}
async function authorize(){
  const epoch=++authEpoch;
  demoInstance?.destroy();demoInstance=null;demoLoading=false;
  const {data:{user},error}=await db.auth.getUser();
  if(epoch!==authEpoch)return false;
  if(error||!user){showLogin();return false;}
  const permission=await db.rpc('econova_admin_status');
  if(epoch!==authEpoch)return false;
  if(permission.error||permission.data!==true){await db.auth.signOut({scope:'local'});showLogin(permission.error?.code==='PGRST202'?'The dashboard database setup is not complete yet.':'This account does not have dashboard access.',true);return false;}
  authorized=true;byId('login-password').value='';byId('login-view').hidden=true;byId('dashboard-view').hidden=false;byId('signed-in-email').textContent=user.email||'';byId('sign-out').hidden=false;page=1;selectWorkspace('feedback');await load();return true;
}
byId('login-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!byId('login-form').reportValidity()||byId('login-submit').disabled)return;
  const button=byId('login-submit');button.disabled=true;button.textContent='Signing in…';byId('login-status').classList.remove('error');byId('login-status').textContent='Checking your account…';
  try{
    if(!db)throw Error('The dashboard connection has not been configured.');
    const {error}=await db.auth.signInWithPassword({email:byId('login-email').value.trim(),password:byId('login-password').value});
    if(error)throw Error(error.message?.toLowerCase().includes('invalid')?'Email or password is incorrect. Please try again.':error.message);
    await authorize();
  }catch(error){showLogin(error.message||'Unable to sign in. Please try again.',true);}
  finally{button.disabled=false;button.textContent='Sign in to dashboard ↗';byId('login-password').value='';}
});
byId('show-password').addEventListener('change',()=>{byId('login-password').type=byId('show-password').checked?'text':'password';});
byId('sign-out').addEventListener('click',async()=>{
  const result=await db.auth.signOut({scope:'local'});
  if(result.error){byId('status').textContent='Sign-out could not be completed. Please try again.';return;}
  byId('filters').reset();showLogin('You have signed out.');byId('login-email').focus();
});
byId('filters').addEventListener('submit',event=>{event.preventDefault();page=1;load();});
byId('refresh').addEventListener('click',load);
byId('view-feedback').addEventListener('click',()=>selectWorkspace('feedback'));
byId('view-demo').addEventListener('click',openProductDemo);
byId('clear').addEventListener('click',()=>{byId('filters').reset();page=1;load();});
byId('previous').addEventListener('click',()=>{if(page>1){page--;load();}});
byId('next').addEventListener('click',()=>{page++;load();});
function csvCell(value){let text=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
byId('export').addEventListener('click',async()=>{
  if(!authorized)return;const button=byId('export');button.disabled=true;
  try{
    const {data,error}=await db.rpc('econova_list_feedback',params(true));if(!authorized)return;if(error){rpcError(error);return;}
    const csv='\uFEFF'+[['Date (UTC)','Name','Email','Rating','Suggestions / details'].map(csvCell).join(','),...data.items.map(item=>[item.created_at,item.name,item.email,item.rating,item.comments].map(csvCell).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=node('a');link.href=url;link.download='econovalabs-feedback.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){byId('status').textContent=error.message||'Unable to export feedback.';byId('status').classList.add('error');}finally{button.disabled=false;}
});
if(db){db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')showLogin('You have signed out.');});authorize().catch(()=>showLogin('Unable to check your session. Please sign in again.',true));}
else showLogin('The dashboard connection has not been configured.',true);
window.addEventListener('pageshow',event=>{if(event.persisted&&db)authorize().catch(()=>showLogin());});
