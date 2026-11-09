const KEY = "mobile-zarza-repairs-v1";
const $ = id => document.getElementById(id);

let repairs = load();
let deliveryDayEdited = false;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(repairs));
  render();
}

function digits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

function faNum(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function moneyValue(id) {
  return Number(digits($(id).value).replace(/[^\d]/g, "") || 0);
}

function formatMoney(value) {
  const raw = digits(value).replace(/[^\d]/g, "");
  return raw ? Number(raw).toLocaleString("fa-IR") : "";
}

function bindMoneyInput(id) {
  const input = $(id);

  input.addEventListener("focus", () => {
    input.value = digits(input.value).replace(/[^\d]/g, "");
  });

  input.addEventListener("blur", () => {
    input.value = formatMoney(input.value);
  });
}

const persianFormatter = new Intl.DateTimeFormat(
  "en-US-u-ca-persian-nu-latn",
  {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC"
  }
);

function persianParts(date) {
  const parts = {};
  persianFormatter.formatToParts(date).forEach(part => {
    if (part.type !== "literal") {
      parts[part.type] = Number(part.value);
    }
  });
  return parts;
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function jalaliToISO(value) {
  const match = digits(value).trim().match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
  );

  if (!match) {
    throw new Error("تاریخ را مثل ۱۴۰۵/۰۸/۱۲ وارد کنید");
  }

  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);

  if (jy < 1200 || jy > 1600 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
    throw new Error("تاریخ شمسی معتبر نیست");
  }

  const start = Date.UTC(jy + 621, 2, 19, 12);

  for (let i = 0; i < 370; i++) {
    const date = new Date(start + i * 86400000);
    const parts = persianParts(date);

    if (parts.year === jy && parts.month === jm && parts.day === jd) {
      return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    }
  }

  throw new Error("این تاریخ شمسی وجود ندارد");
}

function isoToJalali(value) {
  if (!value) return "";

  const s = digits(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const date = new Date(Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12
    ));

    const parts = persianParts(date);
    return `${parts.year}/${pad(parts.month)}/${pad(parts.day)}`;
  }

  const j = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (j) return `${j[1]}/${pad(j[2])}/${pad(j[3])}`;

  return s;
}

function jalali(value) {
  return isoToJalali(value) || "—";
}

function todayJalali() {
  const now = new Date();
  const date = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12
  ));

  const parts = persianParts(date);
  return `${parts.year}/${pad(parts.month)}/${pad(parts.day)}`;
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2300);
}

// =====================================
// تنظیمات پیامک موبایل زرزا
// =====================================

const SMS_KEY = "mobile-zarza-sms-v1";

const defaultSmsTemplates = {
  review: "مشتری گرامی {customer}، دستگاه {model} شما در تعمیرات تخصصی زرزا در حال بررسی است. شماره فاکتور: {invoice}",
  repair: "مشتری گرامی {customer}، تعمیر دستگاه {model} شما در زرزا آغاز شده است. شماره فاکتور: {invoice}",
  ready: "مشتری گرامی {customer}، تعمیر دستگاه {model} شما به پایان رسیده و آماده تحویل است. شماره فاکتور: {invoice}"
};

// خواندن متن‌های ذخیره‌شده
function getSmsTemplates() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SMS_KEY) || "{}"
    );

    return {
      ...defaultSmsTemplates,
      ...saved
    };
  } catch {
    return { ...defaultSmsTemplates };
  }
}

// نمایش متن‌ها در تنظیمات
function loadSmsSettings() {
  const templates = getSmsTemplates();

  $("smsReview").value = templates.review;
  $("smsRepair").value = templates.repair;
  $("smsReady").value = templates.ready;
}

// ذخیره متن‌های جدید
function saveSmsTemplates() {
  const templates = {
    review: $("smsReview").value.trim(),
    repair: $("smsRepair").value.trim(),
    ready: $("smsReady").value.trim()
  };

  if (!templates.review || !templates.repair || !templates.ready) {
    alert("لطفاً متن هر سه پیامک را وارد کنید.");
    return;
  }

  localStorage.setItem(
    SMS_KEY,
    JSON.stringify(templates)
  );

  toast("تنظیمات پیامک ذخیره شد");
}

// دکمه ذخیره تنظیمات
$("saveSms").addEventListener("click", saveSmsTemplates);

// بازگرداندن متن‌های پیش‌فرض
$("resetSms").addEventListener("click", () => {
  if (!confirm("متن هر سه پیامک به حالت پیش‌فرض برگردد؟")) {
    return;
  }

  localStorage.removeItem(SMS_KEY);
  loadSmsSettings();

  toast("متن‌های پیش‌فرض بازگردانده شدند");
});

// آماده‌سازی پیامک متناسب با وضعیت تعمیر
function prepareStatusSms(record) {
  const templates = getSmsTemplates();

  const templateByStatus = {
    "در انتظار بررسی": templates.review,
    "در حال تعمیر": templates.repair,
    "آماده تحویل": templates.ready
  };

  const template = templateByStatus[record.status];

  // برای وضعیت تحویل‌شده پیامک آماده نمی‌کنیم
  if (!template) return;

  const phone = digits(record.phone).replace(/[^\d+]/g, "");

  if (!phone) {
    alert("شماره تماس مشتری معتبر نیست.");
    return;
  }

  const values = {
    customer: record.customer || "",
    invoice: record.invoice || "",
    model: record.model || record.device || "",
    status: record.status || "",
    phone: record.phone || ""
  };

  const message = template.replace(
    /\{(customer|invoice|model|status|phone)\}/g,
    (_, key) => values[key]
  );

  if (
    confirm(
      "وضعیت تعمیر تغییر کرده است. پیامک برای مشتری آماده شود؟"
    )
  ) {
    window.location.href =
      `sms:${phone}?body=${encodeURIComponent(message)}`;
  }
}

function newInvoice() {
  return "MZ-" + Date.now().toString().slice(-8);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// نوع دستگاه انتخاب‌شده
function selectedDevice() {
  const radio = document.querySelector(
    'input[name="deviceChoice"]:checked'
  );

  return radio ? radio.value : "گوشی موبایل";
}

// هماهنگ‌سازی نوع دستگاه
function syncDevice() {
  $("device").value = selectedDevice();
}

document.querySelectorAll('input[name="deviceChoice"]').forEach(radio => {
  radio.addEventListener("change", syncDevice);
});

// دریافت تعمیرات انتخاب‌شده
function selectedRepairTypes() {
  return Array.from(
    document.querySelectorAll(".repair-option:checked")
  ).map(input => input.value);
}

// ترکیب خدمات انتخابی و خدمات دلخواه
function getRepairDescription() {
  const selected = selectedRepairTypes();
  const custom = $("repairTypeCustom").value.trim();

  if (custom) selected.push(custom);

  return selected.join("، ");
}

// بازگرداندن تعمیرات قبلی هنگام ویرایش
function restoreRepairTypes(value) {
  document.querySelectorAll(".repair-option").forEach(input => {
    input.checked = false;
  });

  $("repairTypeCustom").value = "";

  const parts = String(value || "")
    .split(/[،,]/)
    .map(x => x.trim())
    .filter(Boolean);

  const remaining = [];

  parts.forEach(part => {
    const checkbox = Array.from(
      document.querySelectorAll(".repair-option")
    ).find(input => input.value === part);

    if (checkbox) {
      checkbox.checked = true;
    } else {
      remaining.push(part);
    }
  });

  $("repairTypeCustom").value = remaining.join("، ");
}

function resetForm() {
  HTMLFormElement.prototype.reset.call($("repairForm"));

  $("editId").value = "";
  $("formTitle").textContent = "ثبت پذیرش جدید";

  document.querySelectorAll('input[name="deviceChoice"]').forEach(radio => {
    radio.checked = radio.value === "گوشی موبایل";
  });

  $("device").value = "گوشی موبایل";

  document.querySelectorAll(".repair-option").forEach(input => {
    input.checked = false;
  });

  $("repairTypeCustom").value = "";

  $("received").value = todayJalali();
  $("deliveredDate").value = $("received").value;

  deliveryDayEdited = false;
}

// تغییر خودکار تاریخ تحویل
$("received").addEventListener("input", () => {
  if (!deliveryDayEdited) {
    $("deliveredDate").value = $("received").value;
  }
});

$("deliveredDate").addEventListener("focus", () => {
  if (!$("deliveredDate").value.trim()) {
    $("deliveredDate").value = $("received").value;
  }

  const end = $("deliveredDate").value.length;
  $("deliveredDate").setSelectionRange(
    Math.max(0, end - 2),
    end
  );
});

$("deliveredDate").addEventListener("input", () => {
  deliveryDayEdited = true;
});

$("deliveredDate").addEventListener("blur", () => {
  const received = digits($("received").value).match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
  );

  if (!received) return;

  const value = digits($("deliveredDate").value);
  const day = value.slice(value.lastIndexOf("/") + 1)
    .replace(/[^\d]/g, "");

  $("deliveredDate").value =
    `${received[1]}/${pad(Number(received[2]))}/${pad(Number(day || received[3]))}`;
});

// فرمت هزینه‌ها
bindMoneyInput("price");
bindMoneyInput("paid");

// تغییر تب‌ها
document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    ["new", "list", "backup"].forEach(id => {
      $(id).classList.toggle("hidden", id !== button.dataset.tab);
    });

    if (button.dataset.tab === "list") render();
  });
});

// ذخیره تعمیر جدید یا ویرایش
$("repairForm").addEventListener("submit", event => {
  event.preventDefault();

  try {
    const id = $("editId").value;
    const old = repairs.find(item => item.id === id);

    const repairType = getRepairDescription();

    if (!repairType) {
      alert("لطفاً حداقل یک نوع تعمیر را انتخاب کنید یا خدمات دلخواه را بنویسید.");
      return;
    }

    const received = jalaliToISO($("received").value);

    const deliveredDate = $("deliveredDate").value.trim()
      ? jalaliToISO($("deliveredDate").value)
      : "";

    const device = selectedDevice();

    const record = {
      id: id || (
        crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2)
      ),
      invoice: old?.invoice || newInvoice(),
      created: old?.created || Date.now(),
      customer: $("customer").value.trim(),
      phone: $("phone").value.trim(),
      device,
      model: $("model").value.trim(),
      repairType,
      status: $("status").value,
      received,
      deliveredDate,
      price: moneyValue("price"),
      paid: moneyValue("paid"),
      notes: $("notes").value.trim()
    };

    if (old) {
      repairs = repairs.map(item => item.id === id ? record : item);
    } else {
      repairs.push(record);
    }

    save();
    resetForm();

    toast(old
      ? "اطلاعات ویرایش شد"
      : "تعمیر با شماره فاکتور " + record.invoice + " ثبت شد"
    );

  } catch (error) {
    alert(error.message || "لطفاً اطلاعات را بررسی کنید");
  }
});

$("reset").addEventListener("click", resetForm);

// نمایش فهرست تعمیرات
function render() {
  $("total").textContent = faNum(repairs.length);

  $("working").textContent = faNum(
    repairs.filter(item => item.status === "در حال تعمیر").length
  );

  $("ready").textContent = faNum(
    repairs.filter(item => item.status === "آماده تحویل").length
  );

  $("delivered").textContent = faNum(
    repairs.filter(item => item.status === "تحویل‌شده").length
  );

  const query = digits($("search").value).trim().toLowerCase();
  const filter = $("filter").value;

  const list = repairs.filter(record => {
    const matchesStatus = !filter || record.status === filter;

    const searchable = [
      record.customer,
      record.phone,
      record.invoice,
      record.model,
      record.repairType,
      record.device
    ];

    const matchesSearch = !query || searchable.some(value =>
      digits(value).toLowerCase().includes(query)
    );

    return matchesStatus && matchesSearch;
  }).sort((a, b) => b.created - a.created);

  $("records").innerHTML = list.length
    ? list.map(record => `
      <article class="record">
        <div class="record-head">
          <h3>${escapeHTML(record.customer)} — ${escapeHTML(record.model || "بدون مدل")}</h3>
          <span class="status">${escapeHTML(record.status)}</span>
        </div>

        <p>
          فاکتور: <b>${escapeHTML(record.invoice)}</b><br>
          نوع دستگاه: ${escapeHTML(record.device || "گوشی موبایل")}<br>
          تماس: ${escapeHTML(record.phone)}<br>
          تعمیر: ${escapeHTML(record.repairType || "—")}<br>
          پذیرش: ${jalali(record.received)}<br>
          تحویل: ${jalali(record.deliveredDate)}<br>
          هزینه: ${faNum(record.price)} تومان<br>
          پرداخت‌شده: ${faNum(record.paid)} تومان
        </p>

        <div class="record-actions">
          <button class="primary" data-action="invoice" data-id="${escapeHTML(record.id)}">فاکتور / چاپ</button>
          <button class="secondary" data-action="edit" data-id="${escapeHTML(record.id)}">ویرایش</button>
          <button class="secondary" data-action="delete" data-id="${escapeHTML(record.id)}">حذف</button>
        </div>
      </article>
    `).join("")
    : '<p class="hint">هنوز موردی ثبت نشده یا نتیجه‌ای پیدا نشد.</p>';
}

$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

// عملیات ویرایش، حذف و فاکتور
$("records").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const record = repairs.find(item => item.id === button.dataset.id);
  if (!record) return;

  if (button.dataset.action === "delete") {
    if (confirm("این مورد حذف شود؟")) {
      repairs = repairs.filter(item => item.id !== record.id);
      save();
      toast("حذف شد");
    }
  }

  if (button.dataset.action === "edit") {
    $("customer").value = record.customer || "";
    $("phone").value = record.phone || "";
    $("model").value = record.model || "";
    $("status").value = record.status || "در انتظار بررسی";
    $("notes").value = record.notes || "";

    document.querySelectorAll('input[name="deviceChoice"]').forEach(radio => {
      radio.checked = radio.value === (record.device || "گوشی موبایل");
    });

    $("device").value = record.device || "گوشی موبایل";

    restoreRepairTypes(record.repairType || "");

    $("price").value = formatMoney(record.price);
    $("paid").value = formatMoney(record.paid);

    $("received").value = isoToJalali(record.received);

    $("deliveredDate").value = record.deliveredDate
      ? isoToJalali(record.deliveredDate)
      : $("received").value;

    deliveryDayEdited = Boolean(record.deliveredDate);

    $("editId").value = record.id;
    $("formTitle").textContent = "ویرایش تعمیر";

    document.querySelector('[data-tab="new"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (button.dataset.action === "invoice") {
    showInvoice(record);
  }
});

// نمایش فاکتور
function showInvoice(record) {
  $("invoiceContent").innerHTML = `
    <div class="invoice-title">
      <h2>موبایل زرزا</h2>
      <b>فاکتور پذیرش تعمیرات</b>
    </div>

    ${[
      ["شماره فاکتور", record.invoice],
      ["نام مشتری", record.customer],
      ["شماره تماس", record.phone],
      ["نوع دستگاه", record.device || "گوشی موبایل"],
      ["برند و مدل", record.model || "—"],
      ["نوع تعمیر و خدمات", record.repairType || "—"],
      ["وضعیت", record.status],
      ["تاریخ پذیرش", jalali(record.received)],
      ["تاریخ تحویل", jalali(record.deliveredDate)],
      ["هزینه", faNum(record.price) + " تومان"],
      ["پرداخت‌شده", faNum(record.paid) + " تومان"],
      ["مانده", faNum(Math.max(0, record.price - record.paid)) + " تومان"],
      ["توضیحات", record.notes || "—"]
    ].map(([title, value]) => `
      <div class="invoice-row">
        <span>${escapeHTML(title)}</span>
        <b>${escapeHTML(value)}</b>
      </div>
    `).join("")}

    <p style="text-align:center;margin-top:24px">
  از اعتماد شما سپاسگزاریم
</p>

<p style="text-align:center;margin-top:12px;font-weight:bold;font-size:16px">
  مهندس زرزا
</p>
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
    const phone = digits(record.phone).replace(/[^\d+]/g, "");

    const message =
      `مشتری گرامی، دستگاه شما در موبایل زرزا ثبت شد. کد پیگیری شما: ${record.invoice}. این کد را برای پیگیری نزد خود نگه دارید.`;

    window.location.href =
      `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  $("invoice").showModal();
}

$("closeInvoice").addEventListener("click", () => {
  $("invoice").close();
});

// پشتیبان‌گیری
$("export").addEventListener("click", () => {
  const blob = new Blob([
    JSON.stringify({
      app: "mobile-zarza",
      version: 1,
      repairs
    }, null, 2)
  ], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "mobile-zarza-backup.json";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("فایل پشتیبان آماده شد");
});

// بازیابی پشتیبان
$("importFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const imported = Array.isArray(data) ? data : data.repairs;

    if (!Array.isArray(imported)) {
      throw new Error("فایل نامعتبر است");
    }

    if (confirm("اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟")) {
      repairs = imported;
      save();
      toast("بازیابی انجام شد");
    }
  } catch {
    alert("فایل پشتیبان معتبر نیست");
  }

  event.target.value = "";
});

// فعال‌سازی حالت آفلاین
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

// شروع برنامه
$("received").value = todayJalali();
$("deliveredDate").value = $("received").value;
$("device").value = selectedDevice();

render();
