const displayEl = document.getElementById("display-text");
const clearBtn = document.getElementById("clear-btn");
const buttonsEl = document.querySelector(".buttons");

// وضعیت ماشین حساب
let currentValue = "0";     // عدد در حال نمایش/ورود
let previousValue = null;   // عدد قبلی
let operator = null;        // عملگر انتخاب‌شده
let waitingForNew = false;  // آیا منتظر ورود عدد جدید هستیم؟

/* ---------- نمایش ---------- */

function formatNumber(str) {
  if (str === "Error") return str;

  let [intPart, decPart] = str.split(".");
  const negative = intPart.startsWith("-");
  if (negative) intPart = intPart.slice(1);

  // جداکننده هزارگان
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let result = (negative ? "-" : "") + intPart;
  if (decPart !== undefined) result += "." + decPart;
  return result;
}

function updateDisplay() {
  const text = formatNumber(currentValue);
  displayEl.textContent = text;

  // کوچک‌کردن فونت برای اعداد طولانی
  const len = text.length;
  let size = 80;
  if (len > 6) size = 64;
  if (len > 8) size = 48;
  if (len > 11) size = 36;
  displayEl.style.fontSize = size + "px";

  // تغییر AC به C
  clearBtn.textContent = (currentValue !== "0" || previousValue !== null) ? "C" : "AC";
}

function highlightOperator(op) {
  document.querySelectorAll(".btn.orange[data-action='operator']").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.value === op);
  });
}

/* ---------- عملیات ---------- */

function inputNumber(num) {
  if (currentValue === "Error") currentValue = "0";

  if (waitingForNew) {
    currentValue = num;
    waitingForNew = false;
    highlightOperator(null);
  } else {
    if (currentValue.replace(/[-.]/g, "").length >= 9) return; // حداکثر ۹ رقم
    currentValue = currentValue === "0" ? num : currentValue + num;
  }
}

function inputDecimal() {
  if (waitingForNew) {
    currentValue = "0.";
    waitingForNew = false;
    highlightOperator(null);
    return;
  }
  if (!currentValue.includes(".")) currentValue += ".";
}

function calculate(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  let result;

  switch (op) {
    case "+": result = a + b; break;
    case "-": result = a - b; break;
    case "*": result = a * b; break;
    case "/":
      if (b === 0) return "Error";
      result = a / b;
      break;
    default: return String(b);
  }

  // جلوگیری از خطای اعشاری (مثل 0.1+0.2)
  result = parseFloat(result.toPrecision(12));
  return String(result);
}

function inputOperator(op) {
  if (currentValue === "Error") return;

  // اگر قبلاً عملگری بوده و عدد جدید وارد شده، اول محاسبه کن
  if (operator && !waitingForNew) {
    currentValue = calculate(previousValue, currentValue, operator);
  }

  previousValue = currentValue;
  operator = op;
  waitingForNew = true;
  highlightOperator(op);
}

function equals() {
  if (operator === null || waitingForNew) return;

  currentValue = calculate(previousValue, currentValue, operator);
  previousValue = null;
  operator = null;
  waitingForNew = true;
  highlightOperator(null);
}

function toggleSign() {
  if (currentValue === "Error" || currentValue === "0") return;
  currentValue = currentValue.startsWith("-")
    ? currentValue.slice(1)
    : "-" + currentValue;
}

function percent() {
  if (currentValue === "Error") return;
  currentValue = String(parseFloat((parseFloat(currentValue) / 100).toPrecision(12)));
}

function clear() {
  currentValue = "0";
  previousValue = null;
  operator = null;
  waitingForNew = false;
  highlightOperator(null);
}

/* ---------- رویدادها ---------- */

buttonsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case "number":   inputNumber(value); break;
    case "decimal":  inputDecimal(); break;
    case "operator": inputOperator(value); break;
    case "equals":   equals(); break;
    case "sign":     toggleSign(); break;
    case "percent":  percent(); break;
    case "clear":    clear(); break;
  }

  updateDisplay();
});

// پشتیبانی از کیبورد
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (/^[0-9]$/.test(key)) inputNumber(key);
  else if (key === ".") inputDecimal();
  else if (["+", "-", "*", "/"].includes(key)) inputOperator(key);
  else if (key === "Enter" || key === "=") { e.preventDefault(); equals(); }
  else if (key === "Backspace") {
    if (!waitingForNew && currentValue !== "Error") {
      currentValue = currentValue.length > 1 && !(currentValue.length === 2 && currentValue.startsWith("-"))
        ? currentValue.slice(0, -1)
        : "0";
    }
  }
  else if (key === "Escape") clear();
  else if (key === "%") percent();
  else return;

  updateDisplay();
});

updateDisplay();