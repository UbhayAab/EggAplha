/**
 * PROJECT YOLK ALPHA: ENGINE.JS
 * ==============================
 * All interactive logic: ticker, SKU toggle, P&L simulator,
 * Chart.js configurations, scroll animations.
 * 
 * Python-validated constants are hardcoded below.
 * Run validate.py to cross-check any value.
 */

// ======================================================
// CONSTANTS (Python-validated)
// ======================================================
const CONSTANTS = {
    // Supply Chain
    BARWALA_RATE: 4.75,
    DELHI_RATE: 5.10,
    TRANSPORT_HANDLING: 0.25,
    PACKAGING_PER_EGG: 0.18,
    LANDED_COST: 5.18,
    BREAKAGE_OLD: 0.04,
    BREAKAGE_NEW: 0.015,
    DIRECT_SOURCING_SAVINGS: 0.15,

    // Margins (given in case study)
    MARGIN_WHITE: 0.15,
    MARGIN_PROTEIN: 0.30,
    MARGIN_BROWN: 0.33,

    // Volume Mix
    SHARE_WHITE: 0.70,
    SHARE_PROTEIN: 0.20,
    SHARE_BROWN: 0.10,

    // Operational
    DELIVERY_COST: 30,
    AD_REVENUE_PER_ORDER: 15,
    MONTHLY_ORDERS: 100000,
    AOV: 150,
    DAILY_ORDERS: 100000,
    DAYS_PER_YEAR: 365,

    // P&L Percentages
    COGS_PCT: 0.75,
    WASTAGE_PCT: 0.02,
    LAST_MILE_PCT: 0.15,
    DARK_STORE_PCT: 0.05,
    PAYMENT_TECH_PCT: 0.02,
    AD_REVENUE_PCT: 0.15,
    PLATFORM_FEE_PCT: 0.03,

    // EBITDA Bridge
    BASE_EBITDA: 83.72,
    Q1_IMPACT: 2.5,
    Q2_IMPACT: 5.8,
    Q3_IMPACT: 4.2,
    Q4_IMPACT: 12.0,
    TARGET_EBITDA: 108.22,

    // Seasonal Factors
    SEASONAL: {
        Apr: 0.92, May: 0.88, Jun: 0.85, Jul: 0.90,
        Aug: 0.95, Sep: 1.00, Oct: 1.05, Nov: 1.10,
        Dec: 1.20, Jan: 1.25, Feb: 1.15, Mar: 1.00
    },

    // 1 Crore
    CR: 10000000
};

// Blended Margin (Python validated: 19.80%)
const BLENDED_MARGIN = (CONSTANTS.SHARE_WHITE * CONSTANTS.MARGIN_WHITE) +
    (CONSTANTS.SHARE_PROTEIN * CONSTANTS.MARGIN_PROTEIN) +
    (CONSTANTS.SHARE_BROWN * CONSTANTS.MARGIN_BROWN);

// ======================================================
// SKU DATA
// ======================================================
const SKU_DATA = [
    { name: 'White Eggs (6 Pack)', pack: '6 Pack', price: 50, margin: 0.15, type: 'White', volShare: 0.70, packShare: 0.25 },
    { name: 'White Eggs (10 Pack)', pack: '10 Pack', price: 85, margin: 0.15, type: 'White', volShare: 0.70, packShare: 0.40 },
    { name: 'White Eggs (30 Pack)', pack: '30 Pack', price: 228, margin: 0.15, type: 'White', volShare: 0.70, packShare: 0.35 },
    { name: 'Protein Eggs (6 Pack)', pack: '6 Pack', price: 80, margin: 0.30, type: 'Protein', volShare: 0.20, packShare: 0.25 },
    { name: 'Protein Eggs (10 Pack)', pack: '10 Pack', price: 130, margin: 0.30, type: 'Protein', volShare: 0.20, packShare: 0.40 },
    { name: 'Protein Eggs (30 Pack)', pack: '30 Pack', price: 350, margin: 0.30, type: 'Protein', volShare: 0.20, packShare: 0.35 },
    { name: 'Brown Eggs (6 Pack)', pack: '6 Pack', price: 70, margin: 0.33, type: 'Brown', volShare: 0.10, packShare: 0.25 },
    { name: 'Brown Eggs (10 Pack)', pack: '10 Pack', price: 110, margin: 0.33, type: 'Brown', volShare: 0.10, packShare: 0.40 },
    { name: 'Brown Eggs (30 Pack)', pack: '30 Pack', price: 300, margin: 0.33, type: 'Brown', volShare: 0.10, packShare: 0.35 },
];

// ======================================================
// COMPETITIVE DATA
// ======================================================
const COMP_DATA = [
    { sku: 'Commodity White (30 Pack)', blinkit: 228, zepto: 230, swiggy: 232, analysis: 'Algorithmic matching keeps variance under 2%' },
    { sku: 'Premium White (6 Pack)', blinkit: 75, zepto: 69, swiggy: 76, analysis: 'Zepto undercuts via private label "Relish"' },
    { sku: 'Brown/Free Range (6 Pack)', blinkit: 143, zepto: 127, swiggy: 127, analysis: 'Blinkit commands premium on niche SKUs' },
];

// ======================================================
// UTILITY FUNCTIONS
// ======================================================
function formatCr(val) {
    const cr = val / CONSTANTS.CR;
    if (Math.abs(cr) >= 1) return '\u20B9' + cr.toFixed(2) + ' Cr';
    const lakh = val / 100000;
    return '\u20B9' + lakh.toFixed(2) + ' L';
}

function formatInr(val) {
    return '\u20B9' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatNum(val) {
    return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatPct(val) {
    return (val * 100).toFixed(1) + '%';
}

// ======================================================
// 1. TICKER TAPE
// ======================================================
function buildTicker() {
    const items = [
        { label: 'NECC Barwala Rate', value: '\u20B9475/100', cls: '' },
        { label: 'Delhi Wholesale', value: '\u20B9510/100', cls: '' },
        { label: 'Landed Cost', value: '\u20B95.18/egg', cls: '' },
        { label: 'Arbitrage Spread', value: '+\u20B90.15/egg', cls: '' },
        { label: 'Breakage (Old)', value: '4.0%', cls: 'red' },
        { label: 'Breakage (New)', value: '1.5%', cls: '' },
        { label: 'Dark Stores', value: '2,027', cls: '' },
        { label: 'Market Share', value: '45%', cls: '' },
        { label: 'Category GMV', value: '\u20B9547.5 Cr', cls: '' },
        { label: 'Ad Fill Rate', value: '15%', cls: '' },
        { label: 'Net EBITDA', value: '\u20B9108.22 Cr', cls: '' },
        { label: 'Blended Margin', value: '19.8%', cls: '' },
        { label: 'AOV', value: '\u20B9150', cls: '' },
        { label: 'Winter Spike', value: '+25%', cls: 'red' },
        { label: 'Delivery Cost', value: '\u20B930/order', cls: 'amber' },
        { label: 'Daily Orders', value: '100K', cls: '' },
    ];
    const ticker = document.getElementById('ticker');
    const allItems = [...items, ...items];
    ticker.innerHTML = allItems.map(it =>
        `<span class="ticker-item">
            <span class="dot"></span>
            <span class="label">${it.label}</span>
            <span class="value ${it.cls}">${it.value}</span>
        </span>`
    ).join('');
}

// ======================================================
// 2. SKU MATRIX (VIEW REALITY TOGGLE)
// ======================================================
function renderSKUTable(reality) {
    const body = document.getElementById('skuBody');
    const marginHeader = document.getElementById('marginHeader');
    const profitHeader = document.getElementById('profitHeader');
    const toggleStatus = document.getElementById('toggleStatus');

    if (reality) {
        marginHeader.textContent = 'TRUE NET MARGIN';
        profitHeader.textContent = 'NET PROFIT/ORDER';
        toggleStatus.textContent = 'TRUE NET MARGIN VIEW';
        toggleStatus.className = 'toggle-status on';
    } else {
        marginHeader.textContent = 'MARGIN %';
        profitHeader.textContent = 'GROSS PROFIT/ORDER';
        toggleStatus.textContent = 'GROSS MARGIN VIEW';
        toggleStatus.className = 'toggle-status off';
    }

    let totalGross = 0, totalNet = 0, totalRevenue = 0;

    body.innerHTML = SKU_DATA.map(sku => {
        const orders = Math.round(CONSTANTS.MONTHLY_ORDERS * sku.volShare * sku.packShare);
        const grossProfit = sku.price * sku.margin;
        let displayMargin, displayProfit;

        if (reality) {
            displayProfit = grossProfit - CONSTANTS.DELIVERY_COST + CONSTANTS.AD_REVENUE_PER_ORDER;
            displayMargin = displayProfit / sku.price;
        } else {
            displayProfit = grossProfit;
            displayMargin = sku.margin;
        }

        const contribution = displayProfit * orders;
        const revenue = sku.price * orders;
        totalGross += grossProfit * orders;
        totalNet += (grossProfit - CONSTANTS.DELIVERY_COST + CONSTANTS.AD_REVENUE_PER_ORDER) * orders;
        totalRevenue += revenue;

        const isNeg = displayMargin < 0;
        const cls = isNeg ? 'margin-negative' : 'margin-positive';
        const barColor = isNeg ? 'var(--loss-red)' : 'var(--profit-green)';
        const barH = Math.min(Math.abs(displayMargin) * 100, 40);

        return `<tr>
            <td class="sku-name">${sku.name}</td>
            <td>${sku.pack}</td>
            <td class="right">\u20B9${sku.price}</td>
            <td class="right margin-cell">
                <span class="margin-bar" style="height:${barH}px;background:${barColor}"></span>
                <span class="${cls}">${(displayMargin * 100).toFixed(1)}%</span>
            </td>
            <td class="right ${cls}">\u20B9${displayProfit.toFixed(2)}</td>
            <td class="right">${formatNum(orders)}</td>
            <td class="right ${isNeg ? 'margin-negative' : ''}">\u20B9${formatNum(Math.round(contribution))}</td>
        </tr>`;
    }).join('');

    // Update summary
    const summaryEl = document.getElementById('skuSummary');
    if (summaryEl) {
        const blendedGross = (totalGross / totalRevenue * 100).toFixed(2);
        const blendedNet = (totalNet / totalRevenue * 100).toFixed(2);
        if (reality) {
            summaryEl.innerHTML = `Blended Net Margin (post delivery + ads): <span class="${totalNet > 0 ? 'text-green' : 'text-red'}">${blendedNet}%</span> | Monthly Net: <span class="${totalNet > 0 ? 'text-green' : 'text-red'}">\u20B9${formatNum(Math.round(totalNet))}</span>`;
        } else {
            summaryEl.innerHTML = `Blended Gross Margin: <span class="text-green">${blendedGross}%</span> | Monthly Gross Profit: <span class="text-green">\u20B9${formatNum(Math.round(totalGross))}</span>`;
        }
    }
}

// ======================================================
// 3. EBITDA BRIDGE CHART (Chart.js Waterfall)
// ======================================================
function buildEBITDAChart() {
    const ctx = document.getElementById('ebitdaChart');
    if (!ctx) return;

    const labels = ['Current\nProfit', 'Q1: Supply\nFix', 'Q2: Mix\nShift', 'Q3: Winter\nHedge', 'Q4: Ad\nEngine', 'Target\nEBITDA'];
    const C = CONSTANTS;
    const hidden = [0, C.BASE_EBITDA, C.BASE_EBITDA + C.Q1_IMPACT, C.BASE_EBITDA + C.Q1_IMPACT + C.Q2_IMPACT, C.BASE_EBITDA + C.Q1_IMPACT + C.Q2_IMPACT + C.Q3_IMPACT, 0];
    const visible = [C.BASE_EBITDA, C.Q1_IMPACT, C.Q2_IMPACT, C.Q3_IMPACT, C.Q4_IMPACT, C.TARGET_EBITDA];
    const colors = ['#3B82F6', '#10B981', '#10B981', '#F59E0B', '#8B5CF6', '#10B981'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Base', data: hidden, backgroundColor: 'transparent', borderColor: 'transparent', borderSkipped: false, barPercentage: 0.5 },
                { label: 'Value', data: visible, backgroundColor: colors.map(c => c + '33'), borderColor: colors, borderWidth: 2, borderRadius: 6, borderSkipped: false, barPercentage: 0.5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => ctx.datasetIndex === 0 ? null : '\u20B9' + ctx.raw.toFixed(2) + ' Cr' },
                    backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#F1F5F9',
                    borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, cornerRadius: 8, padding: 12
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: '#94A3B8', font: { family: "'JetBrains Mono'", size: 10, weight: 600 }, maxRotation: 0 } },
                y: { stacked: true, grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748B', font: { family: "'JetBrains Mono'", size: 10 }, callback: v => '\u20B9' + v + ' Cr' } }
            }
        }
    });
}

// ======================================================
// 4. SEASONAL PRICE CHART
// ======================================================
function buildSeasonalChart() {
    const ctx = document.getElementById('seasonalChart');
    if (!ctx) return;

    const months = Object.keys(CONSTANTS.SEASONAL);
    const factors = Object.values(CONSTANTS.SEASONAL);
    const prices = factors.map(f => (CONSTANTS.BARWALA_RATE * f).toFixed(2));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Barwala Rate (\u20B9/egg)',
                data: prices,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: prices.map((p, i) => factors[i] > 1.1 ? '#EF4444' : '#10B981'),
                pointBorderColor: prices.map((p, i) => factors[i] > 1.1 ? '#EF4444' : '#10B981'),
                pointRadius: prices.map((p, i) => factors[i] > 1.1 ? 6 : 4),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => '\u20B9' + ctx.raw + '/egg (' + (factors[ctx.dataIndex] > 1 ? '+' : '') + ((factors[ctx.dataIndex] - 1) * 100).toFixed(0) + '% vs base)' },
                    backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#F1F5F9',
                    borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, cornerRadius: 8, padding: 12
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: "'JetBrains Mono'", size: 10 } } },
                y: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748B', font: { family: "'JetBrains Mono'", size: 10 }, callback: v => '\u20B9' + v } }
            }
        }
    });
}

// ======================================================
// 5. P&L SIMULATOR
// ======================================================
function calculateEBITDA(dailyOrders, adRate, wastageRate) {
    const totalRevenue = dailyOrders * CONSTANTS.AOV * CONSTANTS.DAYS_PER_YEAR;
    const grossProfit = totalRevenue * BLENDED_MARGIN;
    const adIncome = totalRevenue * (adRate / 100);
    const wastageLoss = totalRevenue * (wastageRate / 100);
    const logisticsCost = dailyOrders * CONSTANTS.DELIVERY_COST * CONSTANTS.DAYS_PER_YEAR;
    return {
        totalRevenue, grossProfit, adIncome, wastageLoss, logisticsCost,
        ebitda: grossProfit + adIncome - wastageLoss - logisticsCost
    };
}

function updateSimulator() {
    const dailyOrders = parseInt(document.getElementById('ordersSlider').value);
    const adRate = parseFloat(document.getElementById('adSlider').value);
    const wastageRate = parseFloat(document.getElementById('wastageSlider').value);

    document.getElementById('ordersVal').textContent = formatNum(dailyOrders);
    document.getElementById('adVal').textContent = adRate + '%';
    document.getElementById('wastageVal').textContent = wastageRate + '%';

    const r = calculateEBITDA(dailyOrders, adRate, wastageRate);

    document.getElementById('outGMV').textContent = formatCr(r.totalRevenue);
    document.getElementById('outGrossProfit').textContent = formatCr(r.grossProfit);
    document.getElementById('outAdRev').textContent = formatCr(r.adIncome);
    document.getElementById('outWaste').textContent = formatCr(r.wastageLoss);
    document.getElementById('outLogistics').textContent = formatCr(r.logisticsCost);
    document.getElementById('outEBITDA').textContent = formatCr(r.ebitda);

    const card = document.getElementById('ebitdaCard');
    card.className = r.ebitda >= 0 ? 'output-card full-width ebitda-positive' : 'output-card full-width ebitda-negative';

    // Update margin %
    const ebitdaMargin = (r.ebitda / r.totalRevenue * 100).toFixed(1);
    document.getElementById('ebitdaMarginPct').textContent = ebitdaMargin + '% of GMV';
}

// ======================================================
// 6. SCROLL OBSERVER (Fade-ins)
// ======================================================
function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ======================================================
// INIT
// ======================================================
document.addEventListener('DOMContentLoaded', function () {
    // Ticker
    buildTicker();

    // SKU Table
    renderSKUTable(false);
    document.getElementById('realityToggle').addEventListener('change', function () {
        renderSKUTable(this.checked);
    });

    // Charts
    buildEBITDAChart();
    buildSeasonalChart();

    // Simulator
    ['ordersSlider', 'adSlider', 'wastageSlider'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateSimulator);
    });
    updateSimulator();

    // Scroll animations
    initScrollObserver();
});
