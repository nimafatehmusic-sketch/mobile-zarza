const KEY="mobile-zarza-repairs-v1";
const $=id=>document.getElementById(id);
let repairs=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function save(){localStorage.setItem(KEY,JSON.stringify(repairs));render()}
function digits(s){return String(s??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))}
function faNum(n){return Number(n||0).toLocaleString("fa-IR")}
function jalali(iso){if(!iso)return "—";const d=new Date(iso+"T12:00:00");return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(d)}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300)}
function newInvoice(){return "MZ-"+Date.now().toString().slice(-8)}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function resetForm(){$("repairForm").reset();$("editId").value="";$("formTitle").textContent="ثبت پذیرش جدید";$("received").value=todayISO()}
function render(){
 $("total").textContent=faNum(repairs.length);
 $("working").textContent=faNum(repairs.filter(x=>x.status==="در حال تعمیر").length);
 $("ready").textContent=faNum(repairs.filter(x=>x.status==="آماده تحویل").length);
 $("delivered").textContent=faNum(repairs.filter(x=>x.status==="تحویل‌شده").length);
 const q=digits($("search").value).trim().toLowerCase(),f=$("filter").value;
 const list=repairs.filter(r=>(!f||r.status===f)&&(!q||[r.customer,r.phone,r.invoice,r.model,r.repairType].some(v=>digits(v).toLowerCase().includes(q)))).sort((a,b)=>b.created-a.created);
 $("records").innerHTML=list.length?list.map(r=>`
 <article class="record"><div class="record-head"><h3>${escapeHTML(r.customer)} — ${escapeHTML(r.model||"گوشی موبایل")}</h3><span class="status">${escapeHTML(r.status)}</span></div>
 <p>فاکتور: <b>${escapeHTML(r.invoice)}</b><br>تماس: ${escapeHTML(r.phone)}<br>تعمیر: ${escapeHTML(r.repairType)}<br>پذیرش: ${jalali(r.received)} | هزینه: ${faNum(r.price)} تومان</p>
 <div class="record-actions"><button class="primary" data-action="invoice" data-id="${r.id}">فاکتور / چاپ</button><button class="secondary" data-action="edit" data-id="${r.id}">ویرایش</button><button class="secondary" data-action="delete" data-id="${r.id}">حذف</button></div></article>`).join(""):'<p class="hint">هنوز موردی ثبت نشده یا نتیجه‌ای پیدا نشد.</p>';
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));["new","list","backup"].forEach(id=>$(id).classList.toggle("hidden",id!==b.dataset.tab));if(b.dataset.tab==="list")render()}));
$("repairForm").addEventListener("submit",e=>{
 e.preventDefault();const id=$("editId").value,old=repairs.find(x=>x.id===id);
 const r={id:id||crypto.randomUUID(),invoice:old?.invoice||newInvoice(),created:old?.created||Date.now(),
 customer:$("customer").value.trim(),phone:$("phone").value.trim(),model:$("model").value.trim(),repairType:$("repairType").value.trim(),status:$("status").value,received:$("received").value,deliveredDate:$("deliveredDate").value,price:Number($("price").value||0),paid:Number($("paid").value||0),notes:$("notes").value.trim()};
 if(old)repairs=repairs.map(x=>x.id===id?r:x);else repairs.push(r);
 save();resetForm();toast(old?"اطلاعات ویرایش شد":"تعمیر با شماره فاکتور "+r.invoice+" ثبت شد");
});
$("reset").addEventListener("click",resetForm);
$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
$("records").addEventListener("click",e=>{
 const b=e.target.closest("button[data-action]");if(!b)return;const r=repairs.find(x=>x.id===b.dataset.id);if(!r)return;
 if(b.dataset.action==="delete"){if(confirm("این مورد حذف شود؟")){repairs=repairs.filter(x=>x.id!==r.id);save();toast("حذف شد")}}
 if(b.dataset.action==="edit"){["customer","phone","model","repairType","status","received","deliveredDate","price","paid","notes"].forEach(k=>$(k).value=r[k]??"");$("editId").value=r.id;$("formTitle").textContent="ویرایش تعمیر";document.querySelector('[data-tab="new"]').click();window.scrollTo({top:0,behavior:"smooth"})}
 if(b.dataset.action==="invoice")showInvoice(r);
});
function showInvoice(r){
 $("invoiceContent").innerHTML=`<div class="invoice-title"><h2>موبایل زرزا</h2><b>فاکتور پذیرش تعمیرات</b></div>
 ${[["شماره فاکتور",r.invoice],["نام مشتری",r.customer],["شماره تماس",r.phone],["مدل گوشی",r.model||"—"],["نوع تعمیر",r.repairType],["وضعیت",r.status],["تاریخ پذیرش",jalali(r.received)],["تاریخ تحویل",jalali(r.deliveredDate)],["هزینه",faNum(r.price)+" تومان"],["پرداخت‌شده",faNum(r.paid)+" تومان"],["مانده",faNum(Math.max(0,r.price-r.paid))+" تومان"],["توضیحات",r.notes||"—"]].map(([a,b])=>`<div class="invoice-row"><span>${a}</span><b>${escapeHTML(b)}</b></div>`).join("")}
 <p style="text-align:center;margin-top:24px">از اعتماد شما سپاسگزاریم</p>`;
 $("invoice").showModal();
}
$("closeInvoice").addEventListener("click",()=>$("invoice").close());
$("export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"mobile-zarza",version:1,repairs},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mobile-zarza-backup.json";a.click();URL.revokeObjectURL(a.href);toast("فایل پشتیبان آماده شد")});
$("importFile").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const arr=Array.isArray(data)?data:data.repairs;if(!Array.isArray(arr))throw Error();if(confirm("اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟")){repairs=arr;save();toast("بازیابی انجام شد")}}catch{alert("فایل پشتیبان معتبر نیست")}e.target.value=""});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
$("received").value=todayISO();render();
