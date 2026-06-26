
/* ─── DATA ───────────────────────────────────────────────────────────── */
const CURRENCIES = [
  {code:"USD",name:"US Dollar",flag:"🇺🇸"},
  {code:"EUR",name:"Euro",flag:"🇪🇺"},
  {code:"GBP",name:"British Pound",flag:"🇬🇧"},
  {code:"JPY",name:"Japanese Yen",flag:"🇯🇵"},
  {code:"CAD",name:"Canadian Dollar",flag:"🇨🇦"},
  {code:"AUD",name:"Australian Dollar",flag:"🇦🇺"},
  {code:"CHF",name:"Swiss Franc",flag:"🇨🇭"},
  {code:"CNY",name:"Chinese Yuan",flag:"🇨🇳"},
  {code:"INR",name:"Indian Rupee",flag:"🇮🇳"},
  {code:"SGD",name:"Singapore Dollar",flag:"🇸🇬"},
  {code:"HKD",name:"Hong Kong Dollar",flag:"🇭🇰"},
  {code:"MXN",name:"Mexican Peso",flag:"🇲🇽"},
  {code:"BRL",name:"Brazilian Real",flag:"🇧🇷"},
  {code:"KRW",name:"South Korean Won",flag:"🇰🇷"},
  {code:"SEK",name:"Swedish Krona",flag:"🇸🇪"},
  {code:"NOK",name:"Norwegian Krone",flag:"🇳🇴"},
  {code:"DKK",name:"Danish Krone",flag:"🇩🇰"},
  {code:"NZD",name:"New Zealand Dollar",flag:"🇳🇿"},
  {code:"ZAR",name:"South African Rand",flag:"🇿🇦"},
  {code:"AED",name:"UAE Dirham",flag:"🇦🇪"},
  {code:"SAR",name:"Saudi Riyal",flag:"🇸🇦"},
  {code:"TRY",name:"Turkish Lira",flag:"🇹🇷"},
  {code:"THB",name:"Thai Baht",flag:"🇹🇭"},
  {code:"IDR",name:"Indonesian Rupiah",flag:"🇮🇩"},
  {code:"MYR",name:"Malaysian Ringgit",flag:"🇲🇾"},
  {code:"PHP",name:"Philippine Peso",flag:"🇵🇭"},
  {code:"PKR",name:"Pakistani Rupee",flag:"🇵🇰"},
  {code:"EGP",name:"Egyptian Pound",flag:"🇪🇬"},
  {code:"PLN",name:"Polish Zloty",flag:"🇵🇱"},
  {code:"CZK",name:"Czech Koruna",flag:"🇨🇿"},
];

/* Baseline mid-market rates (USD base, June 2025) */
const BASE_RATES = {
  USD:1, EUR:0.9182, GBP:0.7864, JPY:157.24, CAD:1.3645, AUD:1.5321,
  CHF:0.8891, CNY:7.2451, INR:83.47, SGD:1.3412, HKD:7.8231, MXN:17.15,
  BRL:4.975, KRW:1342.5, SEK:10.45, NOK:10.62, DKK:6.885, NZD:1.6421,
  ZAR:18.67, AED:3.6725, SAR:3.75, TRY:32.44, THB:35.12, IDR:15782,
  MYR:4.712, PHP:56.31, PKR:278.5, EGP:30.9, PLN:3.958, CZK:23.12
};

/* ─── STATE ──────────────────────────────────────────────────────────── */
let rates = {};
let fromCurrency = "USD";
let toCurrency   = "EUR";
let currentPeriod = 7;
let sparkChart   = null;

/* ─── UTILS ──────────────────────────────────────────────────────────── */
function noise(base, pct = 0.005) {
  return base * (1 + (Math.random() - 0.5) * pct);
}

function initRates() {
  Object.keys(BASE_RATES).forEach(k => { rates[k] = noise(BASE_RATES[k], 0.007); });
}

function getRate(from, to) {
  return rates[to] / rates[from];
}

function getCur(code) {
  return CURRENCIES.find(c => c.code === code);
}

function formatAmount(n, code) {
  if (["JPY","KRW","IDR"].includes(code))
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 100000)
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatRate(r, code) {
  if (["JPY","KRW","IDR"].includes(code)) return r.toFixed(3);
  return r.toFixed(6);
}

/* ─── CONVERSION ─────────────────────────────────────────────────────── */
function convert() {
  const amt   = parseFloat(document.getElementById("amountInput").value) || 0;
  const rate  = getRate(fromCurrency, toCurrency);
  const result = amt * rate;

  const hi = rate * 1.0032;
  const lo = rate * 0.9968;

  document.getElementById("resultAmount").textContent = formatAmount(result, toCurrency) + " " + toCurrency;
  document.getElementById("resultRateLabel").textContent =
    `1 ${fromCurrency} = ${formatRate(rate, toCurrency)} ${toCurrency}`;
  document.getElementById("fromRateLabel").textContent =
    getCur(fromCurrency).name;

  document.getElementById("statMid").textContent    = formatRate(rate, toCurrency);
  document.getElementById("statMidSub").textContent = `1 ${fromCurrency} → ${toCurrency}`;
  document.getElementById("statHigh").textContent   = formatRate(hi, toCurrency);
  document.getElementById("statHighSub").textContent = "+0.32% vs yesterday";
  document.getElementById("statLow").textContent    = formatRate(lo, toCurrency);
  document.getElementById("statLowSub").textContent = "−0.32% vs yesterday";

  const periodLabel = currentPeriod === 7 ? "7-day" : currentPeriod === 30 ? "30-day" : "90-day";
  document.getElementById("chartTitle").textContent =
    `${fromCurrency} / ${toCurrency} — ${periodLabel} trend`;

  updateChart(rate);
  updateMultiConvert(amt);
  document.getElementById("multiBaseLabel").textContent =
    amt.toLocaleString() + " " + fromCurrency;
}

/* ─── CHART ──────────────────────────────────────────────────────────── */
function generateHistory(rate, days) {
  const pts = [];
  let v = rate * (1 + (Math.random() - 0.5) * 0.025);
  for (let i = days; i >= 0; i--) {
    v *= (1 + (Math.random() - 0.5) * 0.009);
    pts.push(parseFloat(v.toFixed(6)));
  }
  pts[pts.length - 1] = rate;
  return pts;
}

function updateChart(rate) {
  const data   = generateHistory(rate, currentPeriod);
  const trend  = data[data.length - 1] >= data[0] ? "#22c87a" : "#f05a5a";
  const trendA = trend + "20";
  const labels = data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (currentPeriod - i));
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });

  const ctx = document.getElementById("sparkChart").getContext("2d");
  if (sparkChart) sparkChart.destroy();

  sparkChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: trend,
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: trend,
        fill: true,
        backgroundColor: trendA,
        tension: 0.42,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e2333",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: "#8b90a8",
          bodyColor: "#f0f2f8",
          padding: 10,
          callbacks: {
            label: ctx => ` ${formatRate(ctx.parsed.y, toCurrency)} ${toCurrency}`
          }
        }
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: true,
          position: "right",
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            color: "#565c78",
            maxTicksLimit: 4,
            callback: v => formatRate(v, toCurrency),
          }
        }
      }
    }
  });
}

/* ─── MULTI CONVERT ──────────────────────────────────────────────────── */
const MULTI_TARGETS = ["USD","EUR","GBP","JPY","CAD","AUD","CHF","CNY","INR","SGD"];

function updateMultiConvert(amt) {
  const targets = MULTI_TARGETS.filter(c => c !== fromCurrency).slice(0, 8);
  const html = targets.map(code => {
    const cur    = getCur(code);
    const rate   = getRate(fromCurrency, code);
    const result = formatAmount(amt * rate, code);
    const chg    = (Math.random() - 0.46) * 0.9;
    const chgStr = (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%";
    const cls    = chg >= 0 ? "chg-up" : "chg-dn";
    return `
      <div class="multi-row">
        <span class="multi-flag" aria-hidden="true">${cur.flag}</span>
        <div class="multi-info">
          <div class="multi-name">${cur.name}</div>
          <div class="multi-code">${code}</div>
        </div>
        <div class="multi-right">
          <div class="multi-amount">${result}</div>
          <div class="multi-rate">1 ${fromCurrency} = ${formatRate(rate,code)}</div>
        </div>
        <span class="chg-badge ${cls}" aria-label="${chgStr} change">${chgStr}</span>
      </div>`;
  }).join("");
  document.getElementById("multiRows").innerHTML = html;
}

/* ─── TICKER ─────────────────────────────────────────────────────────── */
const TICKER_PAIRS = [
  ["USD","EUR"],["GBP","USD"],["USD","JPY"],["AUD","USD"],["USD","CAD"],
  ["EUR","GBP"],["USD","CHF"],["USD","CNY"],["EUR","JPY"],["GBP","JPY"],
  ["USD","SGD"],["USD","INR"]
];

function buildTicker() {
  const items = TICKER_PAIRS.map(([a,b]) => {
    const r   = getRate(a, b);
    const chg = (Math.random() - 0.45) * 0.7;
    const chgStr = (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%";
    const cls = chg >= 0 ? "up" : "dn";
    const fa  = getCur(a), fb = getCur(b);
    return `<div class="ticker-item">
      <span>${fa.flag}${fb.flag}</span>
      <span class="ticker-pair">${a}/${b}</span>
      <span class="ticker-rate">${formatRate(r, b)}</span>
      <span class="${cls}">${chgStr}</span>
    </div>`;
  });
  const doubled = [...items, ...items].join("");
  document.getElementById("tickerTrack").innerHTML = doubled;
}

/* ─── DROPDOWNS ──────────────────────────────────────────────────────── */
function buildList(listId, side) {
  const selected = side === "from" ? fromCurrency : toCurrency;
  document.getElementById(listId).innerHTML = CURRENCIES.map(c => `
    <div class="dropdown-opt ${c.code === selected ? 'selected' : ''}"
         role="option"
         aria-selected="${c.code === selected}"
         onclick="selectCurrency('${side}','${c.code}')">
      <span style="font-size:18px" aria-hidden="true">${c.flag}</span>
      <span>${c.name}</span>
      <span class="opt-code">${c.code}</span>
    </div>`).join("");
}

function toggleDropdown(side) {
  const dropId = side + "Dropdown";
  const btnId  = side + "Btn";
  const isHidden = document.getElementById(dropId).classList.contains("hidden");

  // Close all dropdowns first
  ["from","to"].forEach(s => {
    document.getElementById(s + "Dropdown").classList.add("hidden");
    document.getElementById(s + "Btn").setAttribute("aria-expanded","false");
  });

  if (isHidden) {
    buildList(side + "List", side);
    document.getElementById(dropId).classList.remove("hidden");
    document.getElementById(btnId).setAttribute("aria-expanded","true");
    setTimeout(() => document.getElementById(side + "Search").focus(), 50);
  }
}

function filterList(side) {
  const q    = document.getElementById(side + "Search").value.toLowerCase();
  const opts = document.querySelectorAll(`#${side}List .dropdown-opt`);
  opts.forEach(o => {
    o.style.display = o.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function selectCurrency(side, code) {
  if (side === "from") {
    fromCurrency = code;
    const cur = getCur(code);
    document.getElementById("fromFlag").textContent = cur.flag;
    document.getElementById("fromCode").textContent = cur.code;
    document.getElementById("fromName").textContent = cur.name;
    document.getElementById("fromDropdown").classList.add("hidden");
    document.getElementById("fromBtn").setAttribute("aria-expanded","false");
  } else {
    toCurrency = code;
    const cur = getCur(code);
    document.getElementById("toFlag").textContent = cur.flag;
    document.getElementById("toCode").textContent = cur.code;
    document.getElementById("toName").textContent = cur.name;
    document.getElementById("toDropdown").classList.add("hidden");
    document.getElementById("toBtn").setAttribute("aria-expanded","false");
  }
  convert();
}

function swapCurrencies() {
  const tmp = fromCurrency;
  fromCurrency = toCurrency;
  toCurrency   = tmp;

  const fa = getCur(fromCurrency), fb = getCur(toCurrency);
  document.getElementById("fromFlag").textContent = fa.flag;
  document.getElementById("fromCode").textContent = fa.code;
  document.getElementById("fromName").textContent = fa.name;
  document.getElementById("toFlag").textContent   = fb.flag;
  document.getElementById("toCode").textContent   = fb.code;
  document.getElementById("toName").textContent   = fb.name;
  convert();
}

function setPeriod(days, btn) {
  currentPeriod = days;
  document.querySelectorAll(".period-btn").forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed","false");
  });
  btn.classList.add("active");
  btn.setAttribute("aria-pressed","true");
  convert();
}

/* ─── CLOSE DROPDOWNS ON OUTSIDE CLICK ──────────────────────────────── */
document.addEventListener("click", e => {
  if (!e.target.closest(".currency-select-wrap")) {
    ["from","to"].forEach(s => {
      document.getElementById(s + "Dropdown").classList.add("hidden");
      document.getElementById(s + "Btn").setAttribute("aria-expanded","false");
    });
  }
});

/* ─── KEYBOARD NAV ───────────────────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    ["from","to"].forEach(s => {
      document.getElementById(s + "Dropdown").classList.add("hidden");
      document.getElementById(s + "Btn").setAttribute("aria-expanded","false");
    });
  }
});

/* ─── INIT ───────────────────────────────────────────────────────────── */
initRates();
buildTicker();
convert();

/* Auto-refresh every 12 seconds */
setInterval(() => {
  initRates();
  convert();
  buildTicker();
}, 12000);
