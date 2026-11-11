'use strict';
let page = 1, total = 0, sequence = 0;
const byId = id => document.getElementById(id);
function query() { const params = new URLSearchParams({page: String(page)}); const search=byId('search').value.trim(); const rating=byId('rating').value; if(search)params.set('search',search); if(rating)params.set('rating',rating); return params; }
function element(tag, text, className) { const node=document.createElement(tag); if(text !== undefined)node.textContent=text; if(className)node.className=className; return node; }
function render(items) {
  const list=byId('items'); list.replaceChildren();
  if(!items.length){const empty=element('div',undefined,'empty');empty.append(element('h3',total?'No responses on this page.':'No feedback to show yet.'),element('p','New submissions will appear here. Try clearing filters or refresh after a visitor submits feedback.'));list.append(empty);return;}
  for(const item of items){
    const article=element('article',undefined,'feedback-item');
    const heading=element('div',undefined,'item-heading');const person=element('div',undefined,'item-person');
    const email=element('a',item.email);email.href='mailto:'+encodeURIComponent(item.email);
    person.append(element('h3',item.name),email);
    const meta=element('div',undefined,'item-meta');const stars=element('span','★'.repeat(item.rating)+'☆'.repeat(5-item.rating),'stars');stars.setAttribute('aria-label',item.rating+' out of 5 stars');
    const date=element('time',new Date(item.created_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}));date.dateTime=item.created_at;
    meta.append(stars,date);heading.append(person,meta);article.append(heading,element('p',item.comments,'comment'));list.append(article);
  }
}
async function load() {
  const current=++sequence;const status=byId('status');status.classList.remove('error');status.textContent='Loading feedback…';byId('items').setAttribute('aria-busy','true');
  byId('previous').disabled=true;byId('next').disabled=true;
  const params=query();const exportParams=new URLSearchParams(params);exportParams.delete('page');byId('export').href='/api/admin/export?'+exportParams;
  try{
    const response=await fetch('/api/admin/feedback?'+params,{cache:'no-store'});const data=await response.json();
    if(current!==sequence)return;
    if(!response.ok)throw Error(response.status===401?'Your session has expired. Reload this page to sign in again.':data.error||'Unable to load feedback.');
    total=data.total;byId('total').textContent=String(total);byId('average').textContent=data.average===null?'—':Number(data.average).toFixed(1);
    const bars=byId('distribution');bars.replaceChildren();
    for(let rating=5;rating>=1;rating--){const count=data.breakdown.find(item=>item.rating===rating)?.count||0;const row=element('div',undefined,'rating-bar');const track=element('div',undefined,'track');const fill=element('div');fill.style.width=(total?count/total*100:0)+'%';track.append(fill);row.append(element('span',rating+' ★'),track,element('span',String(count)));bars.append(row);}
    render(data.items);const pages=Math.max(1,Math.ceil(total/data.pageSize));byId('page-info').textContent='Page '+page+' of '+pages;
    byId('previous').disabled=page<=1;byId('next').disabled=page>=pages;status.textContent=total?total+' response'+(total===1?'':'s')+' · Showing '+data.items.length+' on this page.':'No responses match the current filters.';
  }catch(error){if(current!==sequence)return;status.textContent=error.message||'Unable to load feedback. Please try again.';status.classList.add('error');byId('items').replaceChildren();}
  finally{if(current===sequence)byId('items').setAttribute('aria-busy','false');}
}
byId('filters').addEventListener('submit',event=>{event.preventDefault();page=1;load();});
byId('refresh').addEventListener('click',()=>load());
byId('clear').addEventListener('click',()=>{byId('filters').reset();page=1;load();});
byId('previous').addEventListener('click',()=>{if(page>1){page--;load();}});
byId('next').addEventListener('click',()=>{page++;load();});
load();
