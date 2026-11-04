const KEY="mobile-zarza-repairs-v1";
const $=id=>document.getElementById(id);
let repairs=load();

function load(){
 try{return JSON.parse(localStorage.getItem(KEY)||"[]")}
 catch{return []}
}
function save(){
 localStorage.setItem(KEY,JSON.stringify(repairs));
 render();
}
function digits(s){
 return String(s??"")
 .replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d))
 .replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function faNum(n){
 return Number(n||0).toLocaleString("fa-IR");
}
const persianFormatter=new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn",{
 year:"numeric",month:"numeric",day:"numeric",timeZone:"UTC"
});
function persianParts(date){
 const p={};
 persianFormatter.formatToParts(date).forEach(x=>{
  if(x.type!=="literal")p[x.type]=Number(x.value);
 });
 return p;
}
function pad(n){
 return String(n).padStart(2,"0");
}
function jalaliToISO(value){
 const s=digits(value).trim();
 const match=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
 if(!match)throw new Error("تاریخ را مثل ۱۴۰۵/۰۸/۱۲ وارد کنید");

 const jy=Number(match[1]);
 const jm=Number(match[2]);
 const jd=Number(match[3]);

 if(jy<1200||jy>1600||jm<1||jm>12||jd<1||jd>31){
  throw new Error("تاریخ شمسی معتبر نیست");
 }

 const start=Date.UTC(jy+621,2,19,12);

 for(let i=0;i<370;i++){
  const date=new Date(start+i*86400000);
  const p=persianParts(date);

  if(p.year===jy&&p.month===jm&&p.day===jd){
   return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}`;
  }
 }
 throw new Error("این تاریخ شمسی وجود ندارد");
}
function isoToJalali(value){
 if(!value)return "—";
 const s=digits(value).trim();

 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(iso){
  const date=new Date(Date.UTC(
   Number(iso[1]),Number(iso[2])-1,Number(iso[3]),12
  ));
  const p=persianParts(date);
  return `${p.year}/${pad(p.month)}/${pad(p.day)}`;
 }

 const j=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
 if(j)return `${j[1]}/${pad(j[2])}/${pad(j[3])}`;

 return s;
}
function jalali(value){
 return isoToJalali(value);
}
function todayJalali(){
 const now=new Date();
 const date=new Date(Date.UTC(
  now.getFullYear(),now.getMonth(),now.getDate(),12
 ));
 const p=persianParts(date);
 return `${p.year}/${pad(p.month)}/${pad(p.day)}`;
}
function toast(msg){
 $("toast").textContent=msg;
 $("toast").classList.add("show");
 setTimeout(()=>$("toast").classList.remove("show"),2300);
}
function newInvoice(){
 return "MZ-"+Date.now().toString().slice(-8);
}
function escapeHTML(s){
 return String(s??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c]));
}
function resetForm(){
 HTMLFormElement.prototype.reset.call($("repairForm"));
 $("editId").value="";
 $("formTitle").textContent="ثبت پذیرش جدید";
 $("received").value=todayJalali();
}
function render(){
 $("total").textContent=faNum(repairs.length);
 $("working").textContent=faNum(repairs.filter(x=>x.status==="در حال تعمیر").length);
 $("ready").textContent=faNum(repairs.filter(x=>x.status==="آماده تحویل").length);
 $("delivered").textContent=faNum(repairs.filter(x=>x.status==="تحویل‌شده").length);

 const q=digits($("search").value).trim().toLowerCase();
 const f=$("filter").value;

 const list=repairs.filter(r=>
  (!f||r.status===f)&&
  (!q||[r.customer,r.phone,r.invoice,r.model,r.repairType]
   .some(v=>digits(v).toLowerCase().includes(q)))
 ).sort((a,b)=>b.created-a.created);

 $("records").innerHTML=list.length?list.map(r=>`
 <article class="record">
  <div class="record-head">
   <h3>${escapeHTML(r.customer)} — ${escapeHTML(r.model||"گوشی موبایل")}</h3>
   <span class="status">${escapeHTML(r.status)}</span>
  </div>
  <p>
   فاکتور: <b>${escapeHTML(r.invoice)}</b><br>
   تماس: ${escapeHTML(r.phone)}<br>
   تعمیر: ${escapeHTML(r.repairType)}<br>
   پذیرش: ${jalali(r.received)} | هزینه: ${faNum(r.price)} تومان
  </p>
  <div class="record-actions">
   <button class="primary" data-action="invoice" data-id="${r.id}">فاکتور / چاپ</button>
   <button class="secondary" data-action="edit" data-id="${r.id}">ویرایش</button>
   <button class="secondary" data-action="delete" data-id="${r.id}">حذف</button>
  </div>
 </article>
 `).join(""):'<p class="hint">هنوز موردی ثبت نشده یا نتیجه‌ای پیدا نشد.</p>';
}

document.querySelectorAll(".tab").forEach(b=>{
 b.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
  ["new","list","backup"].forEach(id=>
   $(id).classList.toggle("hidden",id!==b.dataset.tab)
  );
  if(b.dataset.tab==="list")render();
 });
});

$("repairForm").addEventListener("submit",e=>{
 e.preventDefault();

 try{
  const id=$("editId").value;
  const old=repairs.find(x=>x.id===id);

  const received=jalaliToISO($("received").value);
  const deliveredDate=$("deliveredDate").value.trim()
   ?jalaliToISO($("deliveredDate").value)
   :"";

  const r={
   id:id||crypto.randomUUID(),
   invoice:old?.invoice||newInvoice(),
   created:old?.created||Date.now(),
   customer:$("customer").value.trim(),
   phone:$("phone").value.trim(),
   device:$("device").value,
   model:$("model").value.trim(),
   repairType:$("repairType").value.trim(),
   status:$("status").value,
   received,
   deliveredDate,
   price:Number($("price").value||0),
   paid:Number($("paid").value||0),
   notes:$("notes").value.trim()
  };

  if(old)repairs=repairs.map(x=>x.id===id?r:x);
  else repairs.push(r);

  save();
  resetForm();
  toast(old?"اطلاعات ویرایش شد":"تعمیر با شماره فاکتور "+r.invoice+" ثبت شد");

 }catch(error){
  alert(error.message||"لطفاً تاریخ را بررسی کنید");
 }
});

$("reset").addEventListener("click",resetForm);
$("search").addEventListener("input",render);
$("filter").addEventListener("change",render);

$("records").addEventListener("click",e=>{
 const b=e.target.closest("button[data-action]");
 if(!b)return;

 const r=repairs.find(x=>x.id===b.dataset.id);
 if(!r)return;

 if(b.dataset.action==="delete"){
  if(confirm("این مورد حذف شود؟")){
   repairs=repairs.filter(x=>x.id!==r.id);
   save();
   toast("حذف شد");
  }
 }

 if(b.dataset.action==="edit"){
  ["customer","phone","device","model","repairType","status",
   "price","paid","notes"].forEach(k=>$(k).value=r[k]??"");

  $("received").value=isoToJalali(r.received);
  $("deliveredDate").value=r.deliveredDate
   ?isoToJalali(r.deliveredDate)
   :"";

  $("editId").value=r.id;
  $("formTitle").textContent="ویرایش تعمیر";
  document.querySelector('[data-tab="new"]').click();
  window.scrollTo({top:0,behavior:"smooth"});
 }

 if(b.dataset.action==="invoice")showInvoice(r);
});

function showInvoice(r){
 $("invoiceContent").innerHTML=`
 <div class="invoice-title">
  <h2>موبایل زرزا</h2>
  <b>فاکتور پذیرش تعمیرات</b>
 </div>
 ${[
  ["شماره فاکتور",r.invoice],
  ["نام مشتری",r.customer],
  ["شماره تماس",r.phone],
  ["نوع دستگاه",r.device||"گوشی موبایل"],
  ["مدل گوشی",r.model||"—"],
  ["نوع تعمیر",r.repairType],
  ["وضعیت",r.status],
  ["تاریخ پذیرش",jalali(r.received)],
  ["تاریخ تحویل",jalali(r.deliveredDate)],
  ["هزینه",faNum(r.price)+" تومان"],
  ["پرداخت‌شده",faNum(r.paid)+" تومان"],
  ["مانده",faNum(Math.max(0,r.price-r.paid))+" تومان"],
  ["توضیحات",r.notes||"—"]
 ].map(([a,b])=>`
  <div class="invoice-row">
   <span>${a}</span><b>${escapeHTML(b)}</b>
  </div>
 `).join("")}
 <p style="text-align:center;margin-top:24px">از اعتماد شما سپاسگزاریم</p>
 `;
 const actions = document.querySelector("#invoice .actions.no-print");
 let smsButton = document.getElementById("sendCustomerSms");

 if (!smsButton) {
   smsButton = document.createElement("button");
   smsButton.id = "sendCustomerSms";
   smsButton.type = "button";
   smsButton.className = "primary";
   smsButton.textContent = "ارسال پیامک به مشتری";
   actions.insertBefore(smsButton, actions.firstChild);
 }

 smsButton.onclick = () => {
   const phone = digits(r.phone).replace(/[^\d+]/g, "");
   const message =
     `مشتری گرامی، دستگاه شما در موبایل زرزا ثبت شد. کد پیگیری شما: ${r.invoice}. برای پیگیری وضعیت تعمیر، این کد را نزد خود نگه دارید.`;

   window.location.href =
     `sms:${phone}?body=${encodeURIComponent(message)}`;
 };
 $("invoice").showModal();
}

$("closeInvoice").addEventListener("click",()=>$("invoice").close());

$("export").addEventListener("click",()=>{
 const blob=new Blob([
  JSON.stringify({app:"mobile-zarza",version:1,repairs},null,2)
 ],{type:"application/json"});

 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="mobile-zarza-backup.json";
 a.click();
 URL.revokeObjectURL(a.href);
 toast("فایل پشتیبان آماده شد");
});

$("importFile").addEventListener("change",async e=>{
 const file=e.target.files[0];
 if(!file)return;

 try{
  const data=JSON.parse(await file.text());
  const arr=Array.isArray(data)?data:data.repairs;
  if(!Array.isArray(arr))throw Error();

  if(confirm("اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟")){
   repairs=arr;
   save();
   toast("بازیابی انجام شد");
  }
 }catch{
  alert("فایل پشتیبان معتبر نیست");
 }
 e.target.value="";
});

if("serviceWorker" in navigator&&location.protocol.startsWith("http")){
 navigator.serviceWorker.register("./sw.js").catch(()=>{});
}

$("received").value=todayJalali();
render();
