const KEY='pharmaDB_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>parseFloat(v)||0;
const fmt=n=>num(n).toLocaleString('en-US',{maximumFractionDigits:2});
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const now=()=>{const d=new Date();return today()+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const daysTo=d=>Math.ceil((new Date(d+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5);
const val=id=>($('#'+id)||{}).value;

/* ---------- البيانات ---------- */
function seed(){
 const P=(n,g,bc,cat,u,cost,price,qty,min,exp,loc)=>({id:uid(),name:n,generic:g,barcode:bc,category:cat,unit:u,cost,price,qty,minQty:min,expiry:exp,location:loc});
 return{
  settings:{name:'صيدلية الشفاء',phone:'',address:'',currency:'ج.س',tax:0,footer:'شكراً لزيارتكم - نتمنى لكم الشفاء العاجل'},
  users:[{id:'u1',username:'admin',password:'admin123',role:'admin',name:'المدير'},{id:'u2',username:'cashier',password:'1234',role:'cashier',name:'الكاشير'}],
  products:[
   P('باراسيتامول 500 مجم','Paracetamol','6001','مسكنات','شريط',600,900,120,30,addDays(400),'رف 1'),
   P('بنادول إكسترا','Paracetamol+Caffeine','6002','مسكنات','شريط',900,1300,80,20,addDays(300),'رف 1'),
   P('أموكسيسيلين 500 مجم','Amoxicillin','6003','مضادات حيوية','شريط',2500,3500,60,20,addDays(200),'رف 2'),
   P('أزيثروميسين 500 مجم','Azithromycin','6004','مضادات حيوية','شريط',4500,6000,25,10,addDays(60),'رف 2'),
   P('إيبوبروفين 400 مجم','Ibuprofen','6005','مسكنات','شريط',1000,1500,15,20,addDays(500),'رف 1'),
   P('أوميبرازول 20 مجم','Omeprazole','6006','الجهاز الهضمي','علبة',2000,3000,45,15,addDays(250),'رف 3'),
   P('ميتفورمين 500 مجم','Metformin','6007','السكري','علبة',1800,2600,70,20,addDays(600),'رف 4'),
   P('أملوديبين 5 مجم','Amlodipine','6008','الضغط','علبة',1500,2200,50,15,addDays(45),'رف 4'),
   P('سيتريزين 10 مجم','Cetirizine','6009','حساسية','شريط',700,1100,40,15,addDays(350),'رف 5'),
   P('أملاح الإماهة ORS','ORS','6010','الجهاز الهضمي','كيس',300,500,200,50,addDays(700),'رف 3'),
   P('فيتامين C 1000','Vitamin C','6011','فيتامينات','علبة',2200,3200,35,10,addDays(20),'رف 6'),
   P('ديكلوفيناك جل','Diclofenac gel','6012','موضعي','أنبوب',1800,2600,22,8,addDays(450),'رف 5'),
   P('بخاخ سالبيوتامول','Salbutamol','6013','الجهاز التنفسي','علبة',3000,4200,18,6,addDays(-10),'رف 7'),
   P('شراب كحة للأطفال','Cough syrup','6014','الجهاز التنفسي','زجاجة',1600,2400,5,10,addDays(150),'رف 7')],
  suppliers:[{id:'s1',name:'شركة النيل للأدوية',phone:'',balance:0}],
  customers:[{id:'c1',name:'عميل نقدي',phone:'',balance:0}],
  sales:[],purchases:[],expenses:[],seq:{sale:1,purchase:1}
 };
}
/* ---------- طبقة قاعدة البيانات (IndexedDB) ---------- */
const DBNAME='pharmacyDB',TABLES=['products','sales','customers','suppliers','purchases','expenses','users'];
let db,idb=null,sig={meta:{}};
function openIDB(){return new Promise((res,rej)=>{
 if(!window.indexedDB)return rej(new Error('IndexedDB غير متاح'));
 let r;try{r=indexedDB.open(DBNAME,1)}catch(e){return rej(e)}
 r.onupgradeneeded=()=>{const d=r.result;TABLES.forEach(n=>d.createObjectStore(n,{keyPath:'id'}));d.createObjectStore('meta',{keyPath:'k'})};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'));
})}
function getAll(n){return new Promise((res,rej)=>{const q=idb.transaction(n).objectStore(n).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
function normalize(d){
 const z=seed();
 d.settings=Object.assign({},z.settings,d.settings||{});
 d.seq=Object.assign({sale:1,purchase:1},d.seq||{});
 TABLES.forEach(n=>{if(!Array.isArray(d[n]))d[n]=[]});
 if(!d.users.length)d.users=z.users;
 return d;
}
function sortDB(){
 const ar=(a,b)=>String(a).localeCompare(String(b),'ar');
 db.products.sort((a,b)=>ar(a.name,b.name));db.customers.sort((a,b)=>ar(a.name,b.name));db.suppliers.sort((a,b)=>ar(a.name,b.name));
 db.sales.sort((a,b)=>a.no-b.no);db.purchases.sort((a,b)=>a.no-b.no);db.expenses.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function flush(){
 const tx=idb.transaction(TABLES.concat('meta'),'readwrite');
 TABLES.forEach(n=>{
  const os=tx.objectStore(n),old=sig[n]||(sig[n]={}),seen={};
  db[n].forEach(r=>{const j=JSON.stringify(r);seen[r.id]=1;if(old[r.id]!==j){os.put(r);old[r.id]=j}});
  Object.keys(old).forEach(id=>{if(!seen[id]){os.delete(id);delete old[id]}});
 });
 const m=tx.objectStore('meta');
 ['settings','seq'].forEach(k=>{const j=JSON.stringify(db[k]);if(sig.meta[k]!==j){m.put({k,v:db[k]});sig.meta[k]=j}});
 tx.onabort=()=>{sig={meta:{}};toast('⚠️ تعذّر الحفظ في قاعدة البيانات')};
}
function save(){
 if(idb){try{flush()}catch(e){sig={meta:{}};toast('تعذّر الحفظ: '+e.message)}return}
 try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('تعذّر الحفظ: مساحة التخزين ممتلئة')}
}
async function initDB(){
 try{idb=await openIDB()}catch(e){idb=null}
 let d=null;
 if(idb){
  try{
   const meta=await getAll('meta');
   if(meta.length){
    d={};for(const n of TABLES)d[n]=await getAll(n);
    meta.forEach(m=>{d[m.k]=m.v;sig.meta[m.k]=JSON.stringify(m.v)});
    TABLES.forEach(n=>{sig[n]={};d[n].forEach(r=>sig[n][r.id]=JSON.stringify(r))});
   }
  }catch(e){idb=null;d=null}
 }
 if(d){db=normalize(d);sortDB();return}
 /* قاعدة جديدة: ترحيل البيانات القديمة من LocalStorage أو بيانات تجريبية */
 let old=null;try{old=JSON.parse(localStorage.getItem(KEY))}catch(e){}
 db=normalize((old&&old.products)?old:seed());sortDB();
 sig={meta:{}};save();
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

/* ---------- الجلسة والتنقل ---------- */
let user=JSON.parse(sessionStorage.getItem('pu')||'null');
let view='dashboard';
const isAdmin=()=>user&&user.role==='admin';
const NAV=[['dashboard','🏠','الرئيسية'],['pos','🛒','نقطة البيع'],['products','💊','المخزون'],['sales','🧾','المبيعات'],['customers','👥','العملاء'],['purchases','📦','المشتريات',1],['suppliers','🚚','الموردون',1],['expenses','💸','المصروفات',1],['reports','📊','التقارير',1],['settings','⚙️','الإعدادات',1]];
function toggleMenu(){document.querySelector('.side')?.classList.toggle('open');document.querySelector('.bk')?.classList.toggle('show')}
function closeMenu(){document.querySelector('.side')?.classList.remove('open');document.querySelector('.bk')?.classList.remove('show')}
function go(v){view=v;closeMenu();render()}
function login(){
 const u=db.users.find(x=>x.username===val('lu').trim()&&x.password===val('lp'));
 if(!u)return toast('اسم المستخدم أو كلمة المرور غير صحيحة');
 user=u;sessionStorage.setItem('pu',JSON.stringify(u));view='dashboard';render();
}
const recCode=()=>db.settings.recoveryCode||'PHARMA-7391';
function recoverForm(){
 modal('استرجاع بيانات الدخول',`<p style="color:#64748b;font-size:13px">أدخل رمز الاسترجاع، ثم اسم مستخدم وكلمة مرور جديدين لحساب المدير.</p><label>رمز الاسترجاع</label><input id="rc"><label>اسم المستخدم الجديد</label><input id="rn"><label>كلمة المرور الجديدة</label><input id="rp" type="password">`,()=>{
  if(val('rc').trim()!==recCode())return toast('رمز الاسترجاع غير صحيح');
  const n=val('rn').trim(),p=val('rp');
  if(!n||!p)return toast('أدخل اسم المستخدم وكلمة المرور');
  let u=db.users.find(x=>x.role==='admin');
  if(db.users.some(x=>x.username===n&&x!==u))return toast('اسم المستخدم مستخدم لحساب آخر');
  if(u){u.username=n;u.password=p}else db.users.push({id:uid(),username:n,password:p,role:'admin',name:'المدير'});
  save();closeModal();toast('تم التحديث، سجّل الدخول الآن');
 },'تأكيد');
}
function logout(){user=null;sessionStorage.removeItem('pu');render()}
function render(){
 document.body.classList.toggle('lg',!user);
 if(!user){$('#app').innerHTML=`<div id="login"><div class="logo big">💊</div><h1>${esc(db.settings.name)}</h1><p>نظام إدارة الصيدلية — سجّل الدخول للمتابعة</p><label>اسم المستخدم</label><input id="lu" autocomplete="username" onkeydown="if(event.key==='Enter')$('#lp').focus()"><label>كلمة المرور</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')login()"><button class="btn pr full" onclick="login()">دخول</button><p style="margin-top:14px"><a href="#" onclick="recoverForm();return false" class="lnk">نسيت بيانات الدخول؟</a></p></div>`;return}
 if(NAV.find(n=>n[0]===view&&n[3])&&!isAdmin())view='dashboard';
 const nv0=NAV.find(n=>n[0]===view);
 const nv=n=>`<button class="nv ${view===n[0]?'on':''}" onclick="go('${n[0]}')"><span class="ic">${n[1]}</span><span>${n[2]}</span></button>`;
 const bt=id=>{const n=NAV.find(x=>x[0]===id);return `<button class="bt ${view===id?'on':''}" onclick="go('${id}')"><span>${n[1]}</span><small>${n[2]}</small></button>`};
 $('#app').innerHTML=`<div class="bk" onclick="closeMenu()"></div>
 <div class="layout"><aside class="side"><div class="brand"><div class="logo">💊</div><div><b>${esc(db.settings.name)}</b><small>نظام إدارة الصيدلية</small></div></div><nav>${NAV.filter(n=>!n[3]||isAdmin()).map(nv).join('')}</nav><div class="usr"><div class="av">${esc((user.name||'?').charAt(0))}</div><div><b>${esc(user.name)}</b><small>${isAdmin()?'مدير':'كاشير'}</small></div><button class="out" onclick="logout()" title="تسجيل الخروج">🚪</button></div></aside>
 <div class="wrap"><header class="ph"><button class="mn" onclick="toggleMenu()">☰</button><h2>${nv0?nv0[1]+' '+nv0[2]:''}</h2><span class="dt">${today()}</span></header><div id="main"></div></div></div>
 <nav class="bnav">${bt('dashboard')}${bt('products')}<button class="bt fab ${view==='pos'?'on':''}" onclick="go('pos')"><span>🛒</span><small>بيع</small></button>${bt('sales')}<button class="bt" onclick="toggleMenu()"><span>☰</span><small>المزيد</small></button></nav>`;
 ({dashboard:dashView,pos:posView,products:prodView,sales:salesView,customers:custView,purchases:purView,suppliers:supView,expenses:expView,reports:repView,settings:setView})[view]();
 window.scrollTo(0,0);
}

/* ---------- أدوات ---------- */
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',2500)}
function modal(title,body,onOk,okText='حفظ'){
 $('#modal').innerHTML=`<div class="ov"><div class="md"><div class="mh"><b>${title}</b><button onclick="closeModal()">✕</button></div><div class="mb">${body}</div><div class="mf">${onOk?`<button class="btn pr" id="mok">${okText}</button>`:''}<button class="btn" onclick="closeModal()">إغلاق</button></div></div></div>`;
 if(onOk)$('#mok').onclick=onOk;
}
function closeModal(){$('#modal').innerHTML=''}
const cur=()=>esc(db.settings.currency);
const money=n=>fmt(n)+' '+cur();
function expStatus(p){if(!p.expiry)return'ok';const d=daysTo(p.expiry);return d<0?'exp':d<=90?'near':'ok'}
function expBadge(p){const s=expStatus(p);return s==='exp'?'<span class="bd r">منتهي</span>':s==='near'?`<span class="bd o">ينتهي بعد ${daysTo(p.expiry)} يوم</span>`:''}
const pname=id=>(db.products.find(p=>p.id===id)||{}).name||'—';
const cname=id=>(db.customers.find(c=>c.id===id)||{}).name||'—';
const sname=id=>(db.suppliers.find(c=>c.id===id)||{}).name||'—';

/* ---------- الرئيسية ---------- */
function dashView(){
 const t=today(),ts=db.sales.filter(s=>s.date.startsWith(t)&&!s.returned);
 const L=db.products.filter(p=>!p.archived),low=L.filter(p=>p.qty<=p.minQty),exp=L.filter(p=>expStatus(p)==='exp'),near=L.filter(p=>expStatus(p)==='near');
 const rec=db.customers.reduce((s,c)=>s+num(c.balance),0);
 const rows=a=>a.length?a.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.qty}</td><td>${esc(p.expiry||'—')}</td></tr>`).join(''):'<tr><td colspan=3 style="color:#64748b">لا يوجد</td></tr>';
 const st=(ic,l,v,c='')=>`<div class="stat ${c}"><div class="si">${ic}</div><small>${l}</small><b>${v}</b></div>`;
 const box=(h,a)=>`<div class="card"><h3>${h}</h3><div class="tw"><table><tr><th>الصنف</th><th>الكمية</th><th>الانتهاء</th></tr>${rows(a)}</table></div></div>`;
 const lb=db.settings.lastBackup,since=lb?-daysTo(lb):999;
 const bkBanner=(isAdmin()&&since>=7)?`<div class="card" style="border-color:#fde68a;background:#fffbeb;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between"><span>⚠️ ${lb?'مرّ '+since+' يوم على آخر نسخة احتياطية':'لم تأخذ نسخة احتياطية بعد'} — احفظ نسخة عشان بياناتك ما تضيع</span><button class="btn sm pr" onclick="backup();go('dashboard')">⬇ نسخة الآن</button></div>`:'';
 $('#main').innerHTML=`<div class="hero"><div><h2>مرحباً ${esc(user.name)} 👋</h2><p>ملخص اليوم في ${esc(db.settings.name)}</p></div><button class="btn gold" onclick="go('pos')">🛒 فاتورة جديدة</button></div>
 ${bkBanner}<div class="grid g6">${st('💰','مبيعات اليوم',money(ts.reduce((s,x)=>s+x.total,0)))}${st('🧾','فواتير اليوم',ts.length,'b')}${st('📉','نقص في المخزون',low.length,'o')}${st('⏳','تنتهي خلال 90 يوم',near.length,'o')}${st('⛔','منتهية الصلاحية',exp.length,'r')}${st('👥','ديون العملاء',money(rec),'b')}</div>
 <div class="cols">${box('⚠️ منتهية الصلاحية',exp)}${box('⏳ قاربت على الانتهاء',near)}${box('📉 نقص في المخزون',low)}</div>`;
}

/* ---------- نقطة البيع ---------- */
let cart=[],pos={customer:'',discount:0,method:'نقدي',paid:''};
function posView(){
 $('#main').innerHTML=`<div class="pos"><div class="card"><h3>الأصناف</h3><input id="posq" placeholder="ابحث بالاسم أو الاسم العلمي أو الباركود (Enter للإضافة)" oninput="posSearch()" onkeydown="if(event.key==='Enter')posEnter()"><div id="posres" class="res"></div></div><div class="card"><h3>الفاتورة</h3><div id="cart"></div></div></div><div id="cartbar" class="cartbar empty" onclick="$('#cart').scrollIntoView({behavior:'smooth',block:'center'})"></div>`;
 posSearch();renderCart();if(!('ontouchstart' in window))$('#posq').focus();
}
function posList(){const q=val('posq').trim().toLowerCase();return db.products.filter(p=>!p.archived&&(!q||[p.name,p.generic,p.barcode].some(x=>String(x||'').toLowerCase().includes(q))))}
function posSearch(){
 $('#posres').innerHTML=posList().slice(0,40).map(p=>{const bad=p.qty<=0||expStatus(p)==='exp';return`<div class="pi ${bad?'dis':''}" onclick="addCart('${p.id}')"><b>${esc(p.name)}</b><small>${esc(p.generic||'')}</small><br><span>${fmt(p.price)} ${cur()}</span> · <small>متوفر: ${p.qty}</small><br>${expBadge(p)}</div>`}).join('')||'<p style="color:#64748b">لا نتائج</p>';
}
function posEnter(){const q=val('posq').trim();const ex=db.products.find(p=>p.barcode&&p.barcode===q&&!p.archived);if(ex){addCart(ex.id);$('#posq').value='';posSearch()}else{const l=posList();if(l.length===1)addCart(l[0].id)}}
function addCart(id){
 const p=db.products.find(x=>x.id===id);
 if(expStatus(p)==='exp')return toast('⛔ الصنف منتهي الصلاحية');
 if(p.qty<=0)return toast('الصنف غير متوفر');
 const it=cart.find(i=>i.pid===id);
 if(it){if(it.qty>=p.qty)return toast('الكمية المتاحة '+p.qty);it.qty++}
 else cart.push({pid:id,name:p.name,qty:1,price:p.price,cost:p.cost});
 renderCart();
}
function chgQty(i,d){const it=cart[i],p=db.products.find(x=>x.id===it.pid);const q=it.qty+d;if(q<=0)cart.splice(i,1);else if(q>p.qty)return toast('الكمية المتاحة '+p.qty);else it.qty=q;renderCart()}
function setQty(i,v){const it=cart[i],p=db.products.find(x=>x.id===it.pid);let q=Math.floor(num(v));if(q<=0){cart.splice(i,1)}else{it.qty=Math.min(q,p.qty);if(q>p.qty)toast('الكمية المتاحة '+p.qty)}renderCart()}
function totals(){const sub=cart.reduce((s,i)=>s+i.qty*i.price,0),disc=Math.min(num(pos.discount),sub),tax=(sub-disc)*num(db.settings.tax)/100;return{sub,disc,tax,total:sub-disc+tax}}
function renderCart(){
 const t=totals();
 const cb=$('#cartbar');if(cb){cb.className='cartbar'+(cart.length?'':' empty');cb.innerHTML='<span>🧾 '+cart.reduce((a,i)=>a+i.qty,0)+' قطعة · '+money(t.total)+'</span><span>عرض الفاتورة ⬇</span>'}
 $('#cart').innerHTML=(cart.length?`<div class="tw"><table><tr><th>الصنف</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th><th></th></tr>${cart.map((i,k)=>`<tr><td>${esc(i.name)}</td><td>${fmt(i.price)}</td><td><button class="btn sm" onclick="chgQty(${k},-1)">−</button> <input type="number" value="${i.qty}" style="width:60px;display:inline" onchange="setQty(${k},this.value)"> <button class="btn sm" onclick="chgQty(${k},1)">+</button></td><td>${fmt(i.qty*i.price)}</td><td><button class="btn sm dg" onclick="cart.splice(${k},1);renderCart()">✕</button></td></tr>`).join('')}</table></div>`:'<p style="color:#64748b">السلة فارغة — اضغط على صنف لإضافته</p>')+
 `<div class="f2"><div><label>العميل</label><select onchange="pos.customer=this.value;renderCart()"><option value="">— بدون —</option>${db.customers.map(c=>`<option value="${c.id}" ${pos.customer===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
 <div><label>طريقة الدفع</label><select onchange="pos.method=this.value;renderCart()">${['نقدي','بنكك','آجل'].map(m=>`<option ${pos.method===m?'selected':''}>${m}</option>`).join('')}</select></div>
 <div><label>خصم (${cur()})</label><input type="number" min="0" value="${pos.discount||''}" onchange="pos.discount=num(this.value);renderCart()"></div>
 ${pos.method==='آجل'?`<div><label>المدفوع الآن</label><input type="number" min="0" value="${pos.paid}" onchange="pos.paid=this.value;renderCart()"></div>`:''}</div>
 <div class="tot"><div><span>المجموع</span><span>${fmt(t.sub)}</span></div><div><span>الخصم</span><span>${fmt(t.disc)}</span></div>${t.tax?`<div><span>الضريبة (${db.settings.tax}%)</span><span>${fmt(t.tax)}</span></div>`:''}<div class="g"><span>الإجمالي</span><span>${money(t.total)}</span></div></div>
 <div class="bar" style="margin-top:10px"><button class="btn pr" style="flex:2" onclick="completeSale()">✔ إتمام البيع</button><button class="btn dg" onclick="if(cart.length&&confirm('إلغاء الفاتورة؟')){cart=[];pos={customer:'',discount:0,method:'نقدي',paid:''};renderCart()}">إلغاء</button></div>`;
}
function completeSale(){
 if(!cart.length)return toast('السلة فارغة');
 const t=totals();
 for(const i of cart){const p=db.products.find(x=>x.id===i.pid);if(!p||p.qty<i.qty)return toast('كمية غير كافية: '+i.name);if(expStatus(p)==='exp')return toast('صنف منتهي: '+i.name)}
 let paid=t.total;
 if(pos.method==='آجل'){if(!pos.customer)return toast('اختر العميل للبيع الآجل');paid=Math.min(num(pos.paid),t.total)}
 cart.forEach(i=>{db.products.find(x=>x.id===i.pid).qty-=i.qty});
 const s={id:uid(),no:db.seq.sale++,date:now(),customerId:pos.customer,customerName:pos.customer?cname(pos.customer):'',items:cart.map(i=>({...i})),sub:t.sub,discount:t.disc,tax:t.tax,total:t.total,paid,method:pos.method,user:user.name};
 db.sales.push(s);
 if(pos.customer&&t.total-paid>0){const c=db.customers.find(x=>x.id===pos.customer);c.balance=num(c.balance)+t.total-paid}
 save();cart=[];pos={customer:'',discount:0,method:'نقدي',paid:''};
 toast('تم البيع ✔');posView();showReceipt(s.id,true);
}
function receiptHTML(s){
 const st=db.settings;
 return `<div class="rc"><h2>💊 ${esc(st.name)}</h2>${s.returned?'<p><b>— فاتورة مرتجعة —</b></p>':''}<p>${esc(st.address||'')} ${esc(st.phone||'')}</p><p>فاتورة رقم: <b>${s.no}</b><br>${s.date}<br>الكاشير: ${esc(s.user)}${s.customerId?'<br>العميل: '+esc(s.customerName||cname(s.customerId)):''}</p>
 <table><tr><th>الصنف</th><th>كمية</th><th>سعر</th><th>مجموع</th></tr>${s.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${fmt(i.price)}</td><td>${fmt(i.qty*i.price)}</td></tr>`).join('')}</table>
 <p style="text-align:right">المجموع: ${fmt(s.sub)}<br>${s.discount?'الخصم: '+fmt(s.discount)+'<br>':''}${s.tax?'الضريبة: '+fmt(s.tax)+'<br>':''}<b>الإجمالي: ${fmt(s.total)} ${esc(st.currency)}</b><br>الدفع: ${s.method}${s.total-s.paid>0?'<br>المتبقي: '+fmt(s.total-s.paid):''}</p><p>${esc(st.footer||'')}</p></div>`;
}
function printReceipt(id){
 const s=db.sales.find(x=>x.id===id);if(!s)return;
 $('#printArea').innerHTML=receiptHTML(s);
 setTimeout(()=>window.print(),150);
}
function showReceipt(id,isNew){
 const s=db.sales.find(x=>x.id===id);if(!s)return;
 modal(isNew?'✅ تمت عملية البيع':'🧾 فاتورة رقم '+s.no,`<div class="paper">${receiptHTML(s)}</div>`,()=>printReceipt(id),'🖨 طباعة الفاتورة');
}

/* ---------- المخزون ---------- */
let pf={q:'',f:'all'};
function prodView(){
 $('#main').innerHTML=`<div class="card"><div class="bar"><input id="pq" placeholder="بحث..." value="${esc(pf.q)}" oninput="pf.q=this.value;prodList()"><select onchange="pf.f=this.value;prodList()">${[['all','كل الأصناف'],['low','نقص المخزون'],['near','قاربت الانتهاء'],['exp','منتهية'],['arch','🗄 المؤرشفة']].map(o=>`<option value="${o[0]}" ${pf.f===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
 ${isAdmin()?`<button class="btn pr" onclick="prodForm()">+ صنف جديد</button><button class="btn" onclick="exportCSV()">⬇ CSV</button>`:''}</div><div class="tw" id="plist"></div></div>`;
 prodList();
}
function prodList(){
 const q=pf.q.toLowerCase();
 const l=db.products.filter(p=>(pf.f==='arch'?!!p.archived:!p.archived)&&(!q||[p.name,p.generic,p.barcode,p.category].some(x=>String(x||'').toLowerCase().includes(q)))&&(pf.f==='all'||pf.f==='arch'||(pf.f==='low'&&p.qty<=p.minQty)||(pf.f===expStatus(p))));
 const cost=l.reduce((s,p)=>s+p.qty*p.cost,0),ret=l.reduce((s,p)=>s+p.qty*p.price,0);
 $('#plist').innerHTML=`<table><tr><th>الصنف</th><th>الفئة</th><th>الباركود</th><th>الكمية</th><th>التكلفة</th><th>السعر</th><th>الانتهاء</th><th>الموقع</th>${isAdmin()?'<th></th>':''}</tr>${l.map(p=>`<tr class="${expStatus(p)}"><td><b>${esc(p.name)}</b><br><small>${esc(p.generic||'')}</small></td><td>${esc(p.category||'')}</td><td>${esc(p.barcode||'')}</td><td>${p.qty<=p.minQty?'<span class="bd o">'+p.qty+'</span>':p.qty} <small>${esc(p.unit||'')}</small></td><td>${fmt(p.cost)}</td><td>${fmt(p.price)}</td><td>${esc(p.expiry||'—')} ${expBadge(p)}</td><td>${esc(p.location||'')}</td>${isAdmin()?`<td><button class="btn sm" onclick="prodForm('${p.id}')">تعديل</button> ${p.archived?`<button class="btn sm" onclick="archProd('${p.id}',false)">↩ استرجاع</button>`:`<button class="btn sm dg" onclick="archProd('${p.id}',true)">🗄 أرشفة</button>`}</td>`:''}</tr>`).join('')}</table><p style="margin-top:8px;color:#64748b">عدد: ${l.length} · قيمة المخزون بالتكلفة: ${money(cost)} · بسعر البيع: ${money(ret)}</p>`;
}
function prodForm(id){
 const p=id?db.products.find(x=>x.id===id):{name:'',generic:'',barcode:'',category:'',unit:'شريط',cost:'',price:'',qty:0,minQty:10,expiry:'',location:''};
 const cats=[...new Set(db.products.map(x=>x.category).filter(Boolean))];
 const f=(k,l,t='text',x='')=>`<div><label>${l}</label><input id="f_${k}" type="${t}" value="${esc(p[k])}" ${x}></div>`;
 modal(id?'تعديل صنف':'صنف جديد',`<datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist><div class="f2">${f('name','اسم الصنف *')}${f('generic','الاسم العلمي')}${f('barcode','الباركود')}<div><label>الفئة</label><input id="f_category" list="cats" value="${esc(p.category)}"></div>${f('unit','الوحدة')}${f('location','موقع الرف')}${f('cost','سعر التكلفة','number','step="any"')}${f('price','سعر البيع *','number','step="any"')}${f('qty','الكمية','number')}${f('minQty','حد إعادة الطلب','number')}${f('expiry','تاريخ الانتهاء','date')}</div>`,()=>{
  const o={name:val('f_name').trim(),generic:val('f_generic').trim(),barcode:val('f_barcode').trim(),category:val('f_category').trim(),unit:val('f_unit').trim(),location:val('f_location').trim(),cost:num(val('f_cost')),price:num(val('f_price')),qty:Math.floor(num(val('f_qty'))),minQty:Math.floor(num(val('f_minQty'))),expiry:val('f_expiry')};
  if(!o.name||o.price<=0)return toast('أدخل الاسم وسعر البيع');
  if(o.barcode&&db.products.some(x=>x.barcode===o.barcode&&x.id!==id))return toast('الباركود مستخدم لصنف آخر');
  if(id)Object.assign(p,o);else db.products.push({id:uid(),...o});
  save();closeModal();prodView();toast('تم الحفظ');
 });
}
function archProd(id,on){const p=db.products.find(x=>x.id===id);if(!p)return;if(on&&!confirm('أرشفة هذا الصنف؟ سيختفي من البيع والمخزون، ويبقى في سجل الفواتير ويمكنك استرجاعه.'))return;p.archived=on;save();prodView();toast(on?'تمت الأرشفة':'تم الاسترجاع')}
function exportCSV(){
 const rows=[['الصنف','الاسم العلمي','الباركود','الفئة','الكمية','التكلفة','السعر','الانتهاء']].concat(db.products.filter(p=>!p.archived).map(p=>[p.name,p.generic,p.barcode,p.category,p.qty,p.cost,p.price,p.expiry]));
 download('inventory.csv','\ufeff'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');
}
function download(name,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ---------- المبيعات ---------- */
let sf={from:'',to:''};
function salesView(){
 if(!sf.from)sf={from:today(),to:today()};
 $('#main').innerHTML=`<div class="card"><div class="bar"><label style="margin:0">من</label><input type="date" value="${sf.from}" onchange="sf.from=this.value;salesList()"><label style="margin:0">إلى</label><input type="date" value="${sf.to}" onchange="sf.to=this.value;salesList()"></div><div class="tw" id="slist"></div></div>`;salesList();
}
function inRange(d,f,t){const x=d.slice(0,10);return(!f||x>=f)&&(!t||x<=t)}
function salesList(){
 const l=db.sales.filter(s=>inRange(s.date,sf.from,sf.to)).sort((a,b)=>b.no-a.no);
 $('#slist').innerHTML=`<table><tr><th>#</th><th>التاريخ</th><th>العميل</th><th>الدفع</th><th>الإجمالي</th><th>المتبقي</th><th>الكاشير</th><th></th></tr>${l.map(s=>`<tr class="${s.returned?'ret':''}"><td>${s.no}${s.returned?' <span class="bd r">مرتجعة</span>':''}</td><td>${s.date}</td><td>${esc(s.customerName||cname(s.customerId))}</td><td>${s.method}</td><td>${fmt(s.total)}</td><td>${fmt(s.total-s.paid)}</td><td>${esc(s.user)}</td><td><button class="btn sm" onclick="showReceipt('${s.id}')">🖨 عرض وطباعة</button> ${isAdmin()&&!s.returned?`<button class="btn sm dg" onclick="refund('${s.id}')">إرجاع</button>`:''}</td></tr>`).join('')}</table><p style="margin-top:8px"><b>الإجمالي: ${money(l.filter(x=>!x.returned).reduce((s,x)=>s+x.total,0))}</b> · عدد الفواتير: ${l.filter(x=>!x.returned).length}${l.some(x=>x.returned)?' · مرتجعة: '+l.filter(x=>x.returned).length:''}</p>`;
}
function refund(id){
 const s=db.sales.find(x=>x.id===id);if(!s||s.returned)return;
 if(!confirm('إرجاع الفاتورة رقم '+s.no+'؟ ستبقى محفوظة في السجل بحالة "مرتجعة" وتعود الكميات للمخزون.'))return;
 s.items.forEach(i=>{const p=db.products.find(x=>x.id===i.pid);if(p)p.qty+=i.qty});
 if(s.customerId){const c=db.customers.find(x=>x.id===s.customerId);if(c)c.balance=num(c.balance)-(s.total-s.paid)}
 s.returned=true;s.returnedAt=now();s.returnedBy=user.name;
 save();salesList();toast('تم الإرجاع — الفاتورة محفوظة في السجل');
}

/* ---------- العملاء والموردون ---------- */
function partyView(kind,title){
 const L=db[kind];
 $('#main').innerHTML=`<div class="card"><div class="bar"><h3 style="margin:0;flex:1">${title}</h3><button class="btn pr" onclick="partyForm('${kind}')">+ إضافة</button></div><div class="tw"><table><tr><th>الاسم</th><th>الهاتف</th><th>${kind==='customers'?'مديونية (عليه)':'مستحق (له)'}</th><th></th></tr>${L.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.phone||'')}</td><td>${c.balance>0?'<span class="bd r">'+fmt(c.balance)+'</span>':fmt(c.balance)}</td><td><button class="btn sm" onclick="partyForm('${kind}','${c.id}')">تعديل</button> <button class="btn sm" onclick="payForm('${kind}','${c.id}')">تسديد</button> ${isAdmin()?`<button class="btn sm dg" onclick="delParty('${kind}','${c.id}')">حذف</button>`:''}</td></tr>`).join('')}</table></div></div>`;
}
const custView=()=>partyView('customers','العملاء'),supView=()=>partyView('suppliers','الموردون');
function partyForm(kind,id){
 const c=id?db[kind].find(x=>x.id===id):{name:'',phone:'',balance:0};
 modal(id?'تعديل':'إضافة',`<label>الاسم *</label><input id="pn" value="${esc(c.name)}"><label>الهاتف</label><input id="pp" value="${esc(c.phone||'')}">`,()=>{
  if(!val('pn').trim())return toast('أدخل الاسم');
  if(id){c.name=val('pn').trim();c.phone=val('pp').trim()}else db[kind].push({id:uid(),name:val('pn').trim(),phone:val('pp').trim(),balance:0});
  save();closeModal();render();
 });
}
function payForm(kind,id){
 const c=db[kind].find(x=>x.id===id);
 modal('تسديد — '+esc(c.name),`<p>الرصيد الحالي: <b>${money(c.balance)}</b></p><label>المبلغ المسدّد</label><input id="pamt" type="number" min="0" step="any">`,()=>{
  const a=num(val('pamt'));if(a<=0)return toast('أدخل مبلغاً صحيحاً');
  c.balance=num(c.balance)-a;save();closeModal();render();toast('تم التسديد');
 });
}
function delParty(kind,id){const c=db[kind].find(x=>x.id===id);if(c&&num(c.balance)!==0)return toast('لا يمكن الحذف: يوجد رصيد غير مسدّد');if(confirm('حذف؟ (الفواتير السابقة تبقى محفوظة في السجل)')){db[kind]=db[kind].filter(x=>x.id!==id);save();render()}}

/* ---------- المشتريات ---------- */
let pur=[];
function purView(){
 const l=[...db.purchases].sort((a,b)=>b.no-a.no);
 $('#main').innerHTML=`<div class="card"><div class="bar"><h3 style="margin:0;flex:1">فواتير المشتريات</h3><button class="btn pr" onclick="purForm()">+ فاتورة شراء</button></div><div class="tw"><table><tr><th>#</th><th>التاريخ</th><th>المورد</th><th>الأصناف</th><th>الإجمالي</th><th>المدفوع</th></tr>${l.map(p=>`<tr><td>${p.no}</td><td>${p.date}</td><td>${esc(p.supplierName||sname(p.supplierId))}</td><td>${p.items.map(i=>esc(pname(i.pid))+' ×'+i.qty).join('، ')}</td><td>${fmt(p.total)}</td><td>${fmt(p.paid)}</td></tr>`).join('')}</table></div></div>`;
}
function purForm(){
 pur=[{pid:'',qty:1,cost:0,expiry:''}];
 modal('فاتورة شراء',`<label>المورد</label><select id="psup"><option value="">— اختر —</option>${db.suppliers.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><div id="prows"></div><button class="btn sm" onclick="pur.push({pid:'',qty:1,cost:0,expiry:''});purRows()" style="margin-top:8px">+ صنف</button><div class="f2"><div><label>الإجمالي</label><input id="ptot" readonly></div><div><label>المدفوع</label><input id="ppaid" type="number" min="0" step="any"></div></div>`,savePur);
 purRows();
}
function purRows(){
 $('#prows').innerHTML=pur.map((r,i)=>`<div class="card" style="padding:8px;margin:8px 0;background:#f8fafc"><select onchange="pickPur(${i},this.value)"><option value="">— اختر الصنف —</option>${db.products.filter(p=>!p.archived).map(p=>`<option value="${p.id}" ${r.pid===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><div class="f2"><div><label>الكمية</label><input type="number" min="1" value="${r.qty}" oninput="pur[${i}].qty=num(this.value);purTot()"></div><div><label>سعر الشراء</label><input type="number" step="any" value="${r.cost}" oninput="pur[${i}].cost=num(this.value);purTot()"></div></div><label>تاريخ الانتهاء</label><input type="date" value="${r.expiry}" onchange="pur[${i}].expiry=this.value"> ${pur.length>1?`<button class="btn sm dg" style="margin-top:6px" onclick="pur.splice(${i},1);purRows()">حذف السطر</button>`:''}</div>`).join('');
 purTot();
}
function pickPur(i,id){pur[i].pid=id;const p=db.products.find(x=>x.id===id);if(p){pur[i].cost=p.cost;pur[i].expiry=p.expiry||''}purRows()}
function purTot(){const t=pur.reduce((s,r)=>s+r.qty*r.cost,0);$('#ptot').value=fmt(t)}
function savePur(){
 const rows=pur.filter(r=>r.pid&&r.qty>0);
 if(!rows.length)return toast('أضف صنفاً واحداً على الأقل');
 const total=rows.reduce((s,r)=>s+r.qty*r.cost,0),paid=Math.min(num(val('ppaid')),total),sup=val('psup');
 if(total-paid>0&&!sup)return toast('اختر المورد للمبلغ المتبقي');
 rows.forEach(r=>{const p=db.products.find(x=>x.id===r.pid);
  if(r.expiry){p.expiry=(p.qty>0&&p.expiry&&p.expiry<r.expiry)?p.expiry:r.expiry}
  p.qty+=r.qty;p.cost=r.cost});
 db.purchases.push({id:uid(),no:db.seq.purchase++,date:now(),supplierId:sup,supplierName:sup?sname(sup):'',items:rows.map(r=>({pid:r.pid,qty:r.qty,cost:r.cost})),total,paid});
 if(sup){const s=db.suppliers.find(x=>x.id===sup);s.balance=num(s.balance)+total-paid}
 save();closeModal();purView();toast('تم حفظ الفاتورة وتحديث المخزون');
}

/* ---------- المصروفات ---------- */
function expView(){
 const l=[...db.expenses].sort((a,b)=>b.date.localeCompare(a.date));
 $('#main').innerHTML=`<div class="card"><div class="bar"><h3 style="margin:0;flex:1">المصروفات</h3><button class="btn pr" onclick="expForm()">+ مصروف</button></div><div class="tw"><table><tr><th>التاريخ</th><th>البند</th><th>المبلغ</th><th></th></tr>${l.map(e=>`<tr><td>${e.date}</td><td>${esc(e.title)}</td><td>${fmt(e.amount)}</td><td><button class="btn sm dg" onclick="if(confirm('حذف؟')){db.expenses=db.expenses.filter(x=>x.id!=='${e.id}');save();expView()}">حذف</button></td></tr>`).join('')}</table></div></div>`;
}
function expForm(){
 modal('مصروف جديد',`<label>البند (إيجار، كهرباء، رواتب...)</label><input id="et"><label>المبلغ</label><input id="ea" type="number" step="any"><label>التاريخ</label><input id="ed" type="date" value="${today()}">`,()=>{
  if(!val('et').trim()||num(val('ea'))<=0)return toast('أكمل البيانات');
  db.expenses.push({id:uid(),title:val('et').trim(),amount:num(val('ea')),date:val('ed')||today()});save();closeModal();expView();
 });
}

/* ---------- التقارير ---------- */
let rf={from:'',to:''};
function repView(){
 if(!rf.from){const d=new Date();rf={from:today().slice(0,8)+'01',to:today()}}
 $('#main').innerHTML=`<div class="card"><div class="bar"><label style="margin:0">من</label><input type="date" value="${rf.from}" onchange="rf.from=this.value;repBody()"><label style="margin:0">إلى</label><input type="date" value="${rf.to}" onchange="rf.to=this.value;repBody()"><button class="btn" onclick="window.print()">🖨</button></div></div><div id="rep"></div>`;repBody();
 // طباعة التقرير: نسخ المحتوى لمنطقة الطباعة
 window.onbeforeprint=()=>{if(view==='reports')$('#printArea').innerHTML='<div style="direction:rtl;padding:10px">'+$('#rep').innerHTML+'</div>'};
}
function repBody(){
 const S=db.sales.filter(s=>!s.returned&&inRange(s.date,rf.from,rf.to)),E=db.expenses.filter(e=>inRange(e.date,rf.from,rf.to));
 const rev=S.reduce((a,s)=>a+s.total,0),net=S.reduce((a,s)=>a+s.sub-s.discount,0),cost=S.reduce((a,s)=>a+s.items.reduce((x,i)=>x+i.qty*i.cost,0),0),ex=E.reduce((a,e)=>a+e.amount,0);
 const top={};S.forEach(s=>s.items.forEach(i=>{const t=top[i.name]||(top[i.name]={q:0,v:0});t.q+=i.qty;t.v+=i.qty*i.price}));
 const topL=Object.entries(top).sort((a,b)=>b[1].v-a[1].v).slice(0,10);
 const day={};S.forEach(s=>{const d=s.date.slice(0,10);day[d]=(day[d]||0)+s.total});
 const LP=db.products.filter(p=>!p.archived),invCost=LP.reduce((a,p)=>a+p.qty*p.cost,0),invRet=LP.reduce((a,p)=>a+p.qty*p.price,0);
 $('#rep').innerHTML=`<div class="grid"><div class="stat"><small>إجمالي المبيعات</small><b>${money(rev)}</b></div><div class="stat o"><small>تكلفة البضاعة المباعة</small><b>${money(cost)}</b></div><div class="stat b"><small>مجمل الربح</small><b>${money(net-cost)}</b></div><div class="stat r"><small>المصروفات</small><b>${money(ex)}</b></div><div class="stat"><small>صافي الربح</small><b>${money(net-cost-ex)}</b></div></div>
 <div class="card"><h3>أعلى الأصناف مبيعاً</h3><div class="tw"><table><tr><th>الصنف</th><th>الكمية</th><th>القيمة</th></tr>${topL.map(t=>`<tr><td>${esc(t[0])}</td><td>${t[1].q}</td><td>${fmt(t[1].v)}</td></tr>`).join('')||'<tr><td colspan=3>لا بيانات</td></tr>'}</table></div></div>
 <div class="card"><h3>المبيعات اليومية</h3><div class="tw"><table><tr><th>اليوم</th><th>المبيعات</th></tr>${Object.entries(day).sort().map(d=>`<tr><td>${d[0]}</td><td>${fmt(d[1])}</td></tr>`).join('')||'<tr><td colspan=2>لا بيانات</td></tr>'}</table></div></div>
 <div class="card"><h3>قيمة المخزون الحالي</h3><p>بالتكلفة: <b>${money(invCost)}</b> · بسعر البيع: <b>${money(invRet)}</b></p></div>`;
}

/* ---------- الإعدادات ---------- */
function setView(){
 const s=db.settings;
 $('#main').innerHTML=`<div class="card"><h3>بيانات الصيدلية</h3><div class="f2"><div><label>اسم الصيدلية</label><input id="s_name" value="${esc(s.name)}"></div><div><label>الهاتف</label><input id="s_phone" value="${esc(s.phone)}"></div><div><label>العنوان</label><input id="s_address" value="${esc(s.address)}"></div><div><label>العملة</label><input id="s_currency" value="${esc(s.currency)}"></div><div><label>الضريبة %</label><input id="s_tax" type="number" step="any" value="${s.tax}"></div><div><label>تذييل الفاتورة</label><input id="s_footer" value="${esc(s.footer)}"></div><div><label>رمز استرجاع بيانات الدخول (احفظه)</label><input id="s_recovery" value="${esc(s.recoveryCode||"PHARMA-7391")}"></div></div><br><button class="btn pr" onclick="saveSet()">حفظ</button></div>
 <div class="card"><h3>المستخدمون</h3><div class="tw"><table><tr><th>الاسم</th><th>المستخدم</th><th>الصلاحية</th><th></th></tr>${db.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.username)}</td><td>${u.role==='admin'?'مدير':'كاشير'}</td><td><button class="btn sm" onclick="userForm('${u.id}')">تعديل</button> ${u.id!==user.id?`<button class="btn sm dg" onclick="delUser('${u.id}')">حذف</button>`:''}</td></tr>`).join('')}</table></div><br><button class="btn" onclick="userForm()">+ مستخدم</button></div>
 <div class="card"><h3>النسخ الاحتياطي</h3><p style="color:#64748b;margin-bottom:8px">البيانات محفوظة داخل المتصفح فقط. خذ نسخة احتياطية بانتظام واحفظها خارج الجهاز.</p><div class="bar"><button class="btn pr" onclick="backup()">⬇ تنزيل نسخة احتياطية</button><label class="btn" style="margin:0">⬆ استعادة نسخة<input type="file" accept=".json" hidden onchange="restore(this.files[0])"></label><button class="btn dg" onclick="resetAll()">مسح كل البيانات</button></div></div>`+dbCard()+installCard();
 dbUsage();
}
function dbCard(){
 const rows=[['products','💊 الأصناف'],['sales','🧾 الفواتير'],['purchases','📦 المشتريات'],['customers','👥 العملاء'],['suppliers','🚚 الموردون'],['expenses','💸 المصروفات'],['users','🔑 المستخدمون']];
 return `<div class="card"><h3>🗄 قاعدة البيانات</h3><p style="color:#64748b;margin-bottom:10px">${idb?'المحرك: IndexedDB — قاعدة بيانات حقيقية داخل المتصفح، تُحفظ كل عملية فوراً في جداولها':'المحرك: LocalStorage (وضع احتياطي — IndexedDB غير متاح في هذا المتصفح)'}</p><div class="grid">${rows.map(r=>`<div class="stat"><small>${r[1]}</small><b>${db[r[0]].length}</b></div>`).join('')}</div><p id="dbusage" style="color:#64748b;font-size:12px"></p></div>`;
}
function dbUsage(){try{navigator.storage&&navigator.storage.estimate&&navigator.storage.estimate().then(e=>{const el=$('#dbusage');if(el)el.textContent='المساحة المستخدمة: '+(e.usage/1048576).toFixed(2)+' MB'})}catch(e){}}
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(user&&view==='settings')setView()});
function installApp(){if(!deferredInstall)return;deferredInstall.prompt();deferredInstall.userChoice.finally(()=>{deferredInstall=null;if(view==='settings')setView()})}
function installCard(){
 const standalone=window.matchMedia&&matchMedia('(display-mode: standalone)').matches,http=location.protocol.startsWith('http');
 const body=standalone?'<p>✅ النظام يعمل الآن كتطبيق مثبّت.</p>':deferredInstall?'<p style="margin-bottom:10px">ثبّت النظام على جهازك ليفتح مثل أي تطبيق ويعمل بدون إنترنت.</p><button class="btn pr" onclick="installApp()">📲 تثبيت التطبيق</button>':http?'<p>من قائمة المتصفح اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>.</p>':'<p style="color:#64748b">للتثبيت كتطبيق يجب فتح النظام من رابط (https) أو من localhost بدل فتح الملف مباشرة.</p>';
 return `<div class="card"><h3>📲 تثبيت كتطبيق</h3>${body}</div>`;
}
function saveSet(){Object.assign(db.settings,{name:val('s_name').trim()||'الصيدلية',phone:val('s_phone'),address:val('s_address'),currency:val('s_currency')||'ج.س',tax:num(val('s_tax')),footer:val('s_footer'),recoveryCode:val('s_recovery').trim()||'PHARMA-7391'});save();render();toast('تم الحفظ')}
function userForm(id){
 const u=id?db.users.find(x=>x.id===id):{name:'',username:'',password:'',role:'cashier'};
 modal(id?'تعديل مستخدم':'مستخدم جديد',`<label>الاسم</label><input id="un" value="${esc(u.name)}"><label>اسم المستخدم</label><input id="uu" value="${esc(u.username)}"><label>كلمة المرور</label><input id="up" value="${esc(u.password)}"><label>الصلاحية</label><select id="ur"><option value="cashier" ${u.role==='cashier'?'selected':''}>كاشير</option><option value="admin" ${u.role==='admin'?'selected':''}>مدير</option></select>`,()=>{
  const o={name:val('un').trim(),username:val('uu').trim(),password:val('up'),role:val('ur')};
  if(!o.name||!o.username||!o.password)return toast('أكمل البيانات');
  if(db.users.some(x=>x.username===o.username&&x.id!==id))return toast('اسم المستخدم موجود');
  if(id)Object.assign(u,o);else db.users.push({id:uid(),...o});
  save();closeModal();setView();
 });
}
function delUser(id){if(confirm('حذف المستخدم؟')){db.users=db.users.filter(u=>u.id!==id);save();setView()}}
function backup(){db.settings.lastBackup=today();save();download('pharmacy-backup-'+today()+'.json',JSON.stringify(db),'application/json')}
function restore(f){
 if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.products||!d.users||!d.settings)throw 0;if(confirm('سيتم استبدال كل البيانات الحالية. متابعة؟')){db=normalize(d);sortDB();save();user=null;sessionStorage.removeItem('pu');render();toast('تمت الاستعادة')}}catch(e){toast('ملف غير صالح')}};
 r.readAsText(f);
}
function resetAll(){if(confirm('سيتم مسح كل البيانات نهائياً! متأكد؟')&&confirm('تأكيد أخير: مسح كل شيء؟')){db=seed();save();user=null;sessionStorage.removeItem('pu');render()}}

if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
initDB().then(()=>render()).catch(e=>{$('#app').innerHTML='<p style="padding:24px;text-align:center">تعذّر تشغيل قاعدة البيانات: '+esc(e.message)+'</p>'});
