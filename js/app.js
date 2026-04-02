/**
 * PPA Presentation — Interactive Charts & Controls
 */

const fmt = (n) => {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
};
const pct = (n) => n.toFixed(0) + '%';

function getDiscountTier(annual) {
  if (annual >= 5000000) return { rate: 0.18, label: 'Strategic', tier: 'Strategic Value' };
  if (annual >= 3000000) return { rate: 0.15, label: 'Premium', tier: 'Premium Value' };
  if (annual >= 2000000) return { rate: 0.12, label: 'Enhanced', tier: 'Enhanced Value' };
  if (annual >= 1500000) return { rate: 0.10, label: 'Advanced', tier: 'Advanced Value' };
  if (annual >= 1000000) return { rate: 0.08, label: 'Growth', tier: 'Growth Value' };
  if (annual >= 500000)  return { rate: 0.06, label: 'Standard', tier: 'Standard Value' };
  return { rate: 0.04, label: 'Foundation', tier: 'Foundation Value' };
}

Chart.defaults.color = '#8892b0';
Chart.defaults.borderColor = '#2d3561';
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
Chart.defaults.font.size = 11;

// ── Nav ──
function initNav() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('section.section').forEach(s => {
      if (s.getBoundingClientRect().top <= 120) current = s.id;
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  });
}

// ══════════════════════════════════════════
// SECTION 1: Growth Journey Chart
// ══════════════════════════════════════════
let growthChart, costPerUnitChart;
function initGrowthJourney() {
  const ctx = document.getElementById('growthJourneyChart').getContext('2d');
  growthChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + fmt(c.raw) } }
      },
      scales: {
        y: { ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });

  const ctx2 = document.getElementById('costPerUnitChart').getContext('2d');
  costPerUnitChart = new Chart(ctx2, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => c.dataset.label + ': $' + c.raw.toFixed(2) } }
      },
      scales: {
        y: { ticks: { callback: (v) => '$' + v.toFixed(2) }, grid: { color: 'rgba(45,53,97,0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });

  updateGrowthJourney();
}

function updateGrowthJourney() {
  const spend = +document.getElementById('overviewSpend').value;
  const growth = +document.getElementById('overviewGrowth').value / 100;
  const units = +document.getElementById('overviewUnits').value;
  document.getElementById('overviewSpendVal').textContent = fmt(spend);
  document.getElementById('overviewGrowthVal').textContent = pct(growth * 100);
  document.getElementById('overviewUnitsVal').textContent = units >= 1000 ? (units / 1000).toFixed(0) + 'K' : units;

  const years = 5, labels = [];
  const organic = [], accelerated = [];
  const cpuOrganic = [], cpuPPA = [];

  // Business units grow faster than spend (the whole point of cloud scale)
  const unitGrowthRate = growth + 0.15; // units grow faster than spend

  let o = spend, a = spend, u = units;
  for (let i = 0; i <= years; i++) {
    labels.push(i === 0 ? 'Today' : 'Year ' + i);
    organic.push(o);
    accelerated.push(a);

    // Cost per unit: total effective cost / business units
    const tier = getDiscountTier(a);
    const organicCPU = o / u;
    const ppaCPU = (a * (1 - tier.rate)) / u; // PPA effective cost / units
    cpuOrganic.push(organicCPU);
    cpuPPA.push(ppaCPU);

    o *= (1 + growth);
    a *= (1 + growth + (tier.rate * 0.3));
    u *= (1 + unitGrowthRate);
  }

  // Total spend chart
  growthChart.data.labels = labels;
  growthChart.data.datasets = [
    { label: 'Organic (No PPA)', data: organic, borderColor: '#8892b0', backgroundColor: 'rgba(136,146,176,0.1)', borderDash: [6, 4], fill: true, tension: 0.3, pointRadius: 4 },
    { label: 'PPA-Accelerated', data: accelerated, borderColor: '#ff9900', backgroundColor: 'rgba(255,153,0,0.1)', fill: true, tension: 0.3, pointRadius: 4, borderWidth: 3 }
  ];
  growthChart.update();

  // Cost per unit chart
  costPerUnitChart.data.labels = labels;
  costPerUnitChart.data.datasets = [
    { label: 'Cost/Unit (No PPA)', data: cpuOrganic, borderColor: '#8892b0', backgroundColor: 'rgba(136,146,176,0.1)', borderDash: [6, 4], fill: true, tension: 0.3, pointRadius: 4 },
    { label: 'Cost/Unit (With PPA)', data: cpuPPA, borderColor: '#64ffda', backgroundColor: 'rgba(100,255,218,0.1)', fill: true, tension: 0.3, pointRadius: 4, borderWidth: 3 }
  ];
  costPerUnitChart.update();

  // KPI cards
  const todayCPU = cpuOrganic[0];
  const y5Organic = cpuOrganic[years];
  const y5PPA = cpuPPA[years];
  const reduction = ((todayCPU - y5PPA) / todayCPU) * 100;

  document.getElementById('cpuToday').textContent = '$' + todayCPU.toFixed(2);
  document.getElementById('cpuOrganic').textContent = '$' + y5Organic.toFixed(2);
  document.getElementById('cpuPPA').textContent = '$' + y5PPA.toFixed(2);
  document.getElementById('cpuReduction').textContent = '-' + reduction.toFixed(0) + '%';

  document.getElementById('growthInsight').innerHTML =
    `📊 While total cloud investment grows as your business scales, your <strong style="color:#64ffda">cost per business unit drops ${reduction.toFixed(0)}%</strong> over ${years} years with a PPA — from <strong>$${todayCPU.toFixed(2)}</strong> today to <strong style="color:#64ffda">$${y5PPA.toFixed(2)}</strong>. ` +
    `Without a PPA, unit cost only reaches <strong style="color:#8892b0">$${y5Organic.toFixed(2)}</strong>. You're not spending more — you're <strong style="color:#ff9900">getting more for every dollar</strong>.`;
}

// ══════════════════════════════════════════
// SECTION 2: Enterprise Support ROI
// ══════════════════════════════════════════
let esROIChart;
let esManualOverride = false;

function initESROI() {
  const ctx = document.getElementById('esROIChart').getContext('2d');
  esROIChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: ['Enterprise Support Cost', 'Downtime Savings', 'Optimization Savings', 'Net Value'], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => fmt(Math.abs(c.raw)) } }
      },
      scales: {
        y: { ticks: { callback: (v) => fmt(Math.abs(v)) }, grid: { color: 'rgba(45,53,97,0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Manual cost input handling
  const manualInput = document.getElementById('esManualCost');
  manualInput.addEventListener('input', () => {
    const val = parseSpendInput(manualInput.value);
    if (val > 0) {
      esManualOverride = true;
    }
    updateESROI();
  });
  manualInput.addEventListener('blur', () => {
    const val = parseSpendInput(manualInput.value);
    if (val > 0) {
      manualInput.value = formatSpendInput(val);
    }
  });
  document.getElementById('esResetBtn').addEventListener('click', () => {
    esManualOverride = false;
    document.getElementById('esManualCost').value = '';
    updateESROI();
  });

  updateESROI();
}

function getEnterpriseSupportCost(annualSpend) {
  // Tiered pricing model (simplified)
  if (annualSpend >= 10000000) return annualSpend * 0.03;
  if (annualSpend >= 5000000) return annualSpend * 0.05;
  if (annualSpend >= 1000000) return annualSpend * 0.07;
  return Math.max(annualSpend * 0.10, 15000);
}

function updateESROI() {
  const annual = +document.getElementById('esAnnualSpend').value;
  const downtimeHrs = +document.getElementById('esDowntimeHours').value;
  const downtimeCostPerHr = +document.getElementById('esDowntimeCost').value;
  document.getElementById('esAnnualSpendVal').textContent = fmt(annual);
  document.getElementById('esDowntimeHoursVal').textContent = downtimeHrs + ' hrs';
  document.getElementById('esDowntimeCostVal').textContent = fmt(downtimeCostPerHr);

  // Determine ES cost: manual override or estimated
  let esCost;
  const manualVal = parseSpendInput(document.getElementById('esManualCost').value);
  if (esManualOverride && manualVal > 0) {
    esCost = manualVal * 12; // monthly input → annual
    document.getElementById('esCostSub').textContent = 'Manual input: ' + fmt(manualVal) + '/mo';
  } else {
    esCost = getEnterpriseSupportCost(annual);
    document.getElementById('esCostSub').textContent = 'Estimated from tiered pricing';
    // Show the estimated monthly in the placeholder
    document.getElementById('esManualCost').placeholder = formatSpendInput(Math.round(esCost / 12));
  }

  const downtimeSavings = downtimeHrs * downtimeCostPerHr;
  const optSavings = annual * 0.05; // ~5% from Trusted Advisor + TAM guidance
  const netROI = downtimeSavings + optSavings - esCost;
  const roiPercent = esCost > 0 ? Math.round(((downtimeSavings + optSavings) / esCost) * 100) : 0;

  document.getElementById('esCost').textContent = fmt(esCost) + '/yr';
  document.getElementById('esDowntimeSavings').textContent = fmt(downtimeSavings) + '/yr';
  document.getElementById('esOptSavings').textContent = fmt(optSavings) + '/yr';
  document.getElementById('esNetROI').textContent = (netROI >= 0 ? '+' : '') + fmt(netROI) + '/yr';
  document.getElementById('esNetROI').style.color = netROI >= 0 ? '#64ffda' : '#ff6b6b';
  document.getElementById('esROIPercent').textContent = roiPercent + '% return';

  esROIChart.data.datasets = [{
    data: [-esCost, downtimeSavings, optSavings, netROI],
    backgroundColor: [
      'rgba(255,107,107,0.6)',
      'rgba(100,255,218,0.6)',
      'rgba(255,153,0,0.6)',
      netROI >= 0 ? 'rgba(100,255,218,0.8)' : 'rgba(255,107,107,0.8)'
    ],
    borderColor: [
      '#ff6b6b',
      '#64ffda',
      '#ff9900',
      netROI >= 0 ? '#64ffda' : '#ff6b6b'
    ],
    borderWidth: 2
  }];
  esROIChart.update();

  const insight = document.getElementById('esInsight');
  if (netROI >= 0) {
    insight.innerHTML = `🛡️ At <strong style="color:#ff9900">${fmt(annual)}/yr</strong> in AWS spend, Enterprise Support costs <strong style="color:#ff6b6b">${fmt(esCost)}/yr</strong> but delivers <strong style="color:#64ffda">${fmt(downtimeSavings + optSavings)}/yr</strong> in value — a <strong style="color:#64ffda">${roiPercent}% return</strong>. The support investment more than pays for itself before you even factor in PPA eligibility.`;
  } else {
    insight.innerHTML = `🛡️ At <strong style="color:#ff9900">${fmt(annual)}/yr</strong>, the direct ROI is tighter, but Enterprise Support unlocks PPA eligibility — where the real savings multiply. Factor in PPA value tiers and the combined return is substantial.`;
  }
}

// ══════════════════════════════════════════
// GLOBAL SPEND SYNC
// ══════════════════════════════════════════
function syncSpendFromOverview() {
  const spend = +document.getElementById('overviewSpend').value;

  // List of all spend sliders to sync (with their min/max constraints)
  const targets = [
    { id: 'esAnnualSpend', valId: 'esAnnualSpendVal' },
    { id: 'qualSpend', valId: 'qualSpendVal' },
    { id: 'stackSpend', valId: 'stackSpendVal' },
    { id: 'dpSpend', valId: 'dpSpendVal' },
    { id: 'dealSpend', valId: 'dealSpendVal' },
    { id: 'growthBase', valId: 'growthBaseVal' },
    { id: 'calcSpend', valId: 'calcSpendVal' },
    { id: 'plannerBaseline', valId: 'plannerBaselineVal' }
  ];

  targets.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      const min = +el.min, max = +el.max;
      const clamped = Math.max(min, Math.min(max, spend));
      el.value = clamped;
      document.getElementById(t.valId).textContent = fmt(clamped);
    }
  });

  // Trigger all section updates
  updateESROI();
  updateQualification();
  updateOptimizationStack();
  updateDemandPlanning();
  updateDealScenarios();
  updateGrowthClause();
  updateCalculator();
  updatePlanner();
}

// ══════════════════════════════════════════
// SECTION 2: Eligibility Toggles
// ══════════════════════════════════════════
function initEligibility() {
  const checklist = document.getElementById('eligibilityChecklist');
  checklist.addEventListener('click', (e) => {
    const toggle = e.target.closest('.elig-toggle');
    if (!toggle) return;
    const pressed = toggle.getAttribute('aria-pressed') === 'true';
    toggle.setAttribute('aria-pressed', !pressed);
    const item = toggle.closest('.eligibility-item');
    item.classList.toggle('met', !pressed);
    const badge = item.querySelector('.elig-status-badge');
    badge.textContent = !pressed ? '✓ In Place' : 'Not Yet';
    updateEligibilityReadiness();
  });
  updateEligibilityReadiness();
}

function updateEligibilityReadiness() {
  const items = document.querySelectorAll('#eligibilityChecklist .eligibility-item');
  const total = items.length;
  let met = 0;
  items.forEach(item => { if (item.classList.contains('met')) met++; });

  const fill = document.getElementById('eligFill');
  const pctVal = (met / total) * 100;
  fill.style.width = pctVal + '%';

  if (met === 0) fill.style.background = '#5a6380';
  else if (met < total) fill.style.background = 'linear-gradient(to right, #ff9900, #ffb84d)';
  else fill.style.background = 'linear-gradient(to right, #64ffda, #00c9a7)';

  document.getElementById('eligCount').textContent = met;
  const readiness = document.getElementById('eligReadiness');
  const verdict = document.getElementById('eligVerdict');

  readiness.classList.toggle('all-met', met === total);

  if (met === 0) {
    verdict.textContent = 'Toggle each criteria your organization already has in place';
  } else if (met < total) {
    const remaining = total - met;
    verdict.textContent = remaining + ' more criteria needed — you\'re making progress';
  } else {
    verdict.textContent = '🎉 All criteria met — you\'re eligible for a Private Pricing Agreement';
  }
}

// ══════════════════════════════════════════
// SECTION 3: Qualification Gauge
// ══════════════════════════════════════════
function updateQualification() {
  const spend = +document.getElementById('qualSpend').value;
  const growth = +document.getElementById('qualGrowth').value;
  document.getElementById('qualSpendVal').textContent = fmt(spend);
  document.getElementById('qualGrowthVal').textContent = pct(growth);

  // Scoring: $500K+ with any positive growth is PPA-eligible
  // Spend score: 0-50 points. $500K = 40pts, $1M = 50pts, scales down below $500K
  let spendScore;
  if (spend >= 1000000) spendScore = 50;
  else if (spend >= 500000) spendScore = 40 + ((spend - 500000) / 500000) * 10;
  else if (spend >= 300000) spendScore = 20 + ((spend - 300000) / 200000) * 20;
  else spendScore = Math.max(0, (spend / 300000) * 20);

  // Growth score: 0-50 points. Any positive growth (>0%) is the key signal
  // 1-5% = 30pts, 5-10% = 40pts, 10%+ = 45-50pts, 0% = 10pts (flat but spending)
  let growthScore;
  if (growth >= 10) growthScore = 45 + Math.min((growth - 10) / 20, 1) * 5;
  else if (growth >= 5) growthScore = 35 + ((growth - 5) / 5) * 10;
  else if (growth >= 1) growthScore = 25 + ((growth - 1) / 4) * 10;
  else growthScore = growth > 0 ? 20 : 10;

  let total = Math.round(spendScore + growthScore);
  total = Math.min(total, 100);

  const fill = document.getElementById('qualFill');
  fill.style.width = total + '%';
  if (total < 30) fill.style.background = '#ff4444';
  else if (total < 55) fill.style.background = 'linear-gradient(to right, #ff4444, #ff9900)';
  else if (total < 80) fill.style.background = 'linear-gradient(to right, #ff9900, #64ffda)';
  else fill.style.background = 'linear-gradient(to right, #64ffda, #00c9a7)';

  const verdict = document.getElementById('qualVerdict');
  if (spend < 300000) {
    verdict.innerHTML = '🔴 <strong>Building toward PPA.</strong> At ' + fmt(spend) + ', focus on growing cloud adoption toward the $500K threshold. A clear migration or expansion plan can help bridge the gap.';
  } else if (spend < 500000 && growth <= 0) {
    verdict.innerHTML = '🟡 <strong>Approaching PPA territory.</strong> ' + fmt(spend) + ' is close, but flat or declining growth makes it harder to structure a commitment. Identify workloads or migrations that drive consistent growth.';
  } else if (spend < 500000 && growth > 0) {
    verdict.innerHTML = '🟡 <strong>Near-term PPA candidate.</strong> At ' + fmt(spend) + ' with ' + pct(growth) + ' growth, you\'re approaching the threshold. With a clear growth trajectory, a PPA conversation is worth starting now.';
  } else if (spend >= 500000 && growth <= 0) {
    verdict.innerHTML = '🟠 <strong>Eligible with caveats.</strong> ' + fmt(spend) + ' meets the spend threshold, but flat growth makes commitment sizing difficult. Even modest growth from new workloads or migrations would strengthen the case significantly.';
  } else if (spend >= 500000 && growth > 0 && growth < 5) {
    verdict.innerHTML = '🟢 <strong>PPA ready.</strong> ' + fmt(spend) + ' with ' + pct(growth) + ' growth qualifies for a PPA. Consistent positive growth is the key signal — consider a 1-3 year term to start capturing value.';
  } else if (spend >= 500000 && growth >= 5 && growth < 15) {
    verdict.innerHTML = '🟢 <strong>Strong PPA candidate.</strong> ' + fmt(spend) + ' with ' + pct(growth) + ' growth is a solid profile. This growth trajectory supports a 3-year term and positions you well for enhanced value tiers.';
  } else {
    verdict.innerHTML = '🌟 <strong>Ideal PPA candidate.</strong> ' + fmt(spend) + ' with ' + pct(growth) + ' growth — this is a strong profile for a 3-5 year commitment with access to premium value tiers. Engage now.';
  }
}

// ══════════════════════════════════════════
// SECTION 3: Optimization Stack
// ══════════════════════════════════════════
let optChart;
const layers = { rightsizing: { on: true, pct: 0.17 }, 'ri-sp': { on: true, pct: 0.25 }, waste: { on: true, pct: 0.07 }, ppa: { on: true, pct: 0.10 } };

function initOptimizationStack() {
  const ctx = document.getElementById('optimizationChart').getContext('2d');
  optChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: ['Cost Breakdown'], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12 } }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + fmt(c.raw) } } },
      scales: { x: { stacked: true, ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } }, y: { stacked: true, display: false } }
    }
  });
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      layers[btn.dataset.layer].on = !layers[btn.dataset.layer].on;
      btn.classList.toggle('active');
      updateOptimizationStack();
    });
  });
  updateOptimizationStack();
}

function updateOptimizationStack() {
  const baseline = +document.getElementById('stackSpend').value;
  document.getElementById('stackSpendVal').textContent = fmt(baseline);
  document.getElementById('stackBaseline').textContent = fmt(baseline);
  let remaining = baseline;
  const datasets = [];
  const items = [
    { key: 'rightsizing', label: 'Rightsizing Savings', color: '#64ffda' },
    { key: 'ri-sp', label: 'RI & Savings Plans', color: '#ff9900' },
    { key: 'waste', label: 'Waste Elimination', color: '#00c9a7' },
    { key: 'ppa', label: 'PPA Value', color: '#b8a9ff' }
  ];
  let totalSavings = 0;
  items.forEach(item => {
    const saving = layers[item.key].on ? remaining * layers[item.key].pct : 0;
    totalSavings += saving;
    remaining -= saving;
    datasets.push({ label: item.label, data: [saving], backgroundColor: item.color + '99', borderColor: item.color, borderWidth: 1 });
  });
  datasets.push({ label: 'Optimized Spend', data: [remaining], backgroundColor: '#1a1f3d', borderColor: '#2d3561', borderWidth: 1 });
  optChart.data.datasets = datasets;
  optChart.update();
  document.getElementById('stackSavings').textContent = fmt(totalSavings);
  document.getElementById('stackRate').textContent = pct((remaining / baseline) * 100);
  document.getElementById('stackOptimized').textContent = fmt(remaining);
}

// ══════════════════════════════════════════
// SECTION 4: Demand Planning
// ══════════════════════════════════════════
let demandChart;
function initDemandPlanning() {
  const ctx = document.getElementById('demandChart').getContext('2d');
  demandChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + fmt(c.raw) } } },
      scales: {
        y: { stacked: true, ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } },
        x: { stacked: true, grid: { display: false } }
      }
    }
  });
  updateDemandPlanning();
}

function updateDemandPlanning() {
  const spend = +document.getElementById('dpSpend').value;
  const growth = +document.getElementById('dpGrowth').value / 100;
  const term = +document.getElementById('dpTerm').value;
  const mktplaceInput = parseSpendInput(document.getElementById('dpMktplaceAmount').value);
  document.getElementById('dpSpendVal').textContent = fmt(spend);
  document.getElementById('dpGrowthVal').textContent = pct(growth * 100);
  document.getElementById('dpTermVal').textContent = term + ' yr';

  const labels = [];
  const projectedData = [], mktplaceData = [], remainingData = [];
  let totalCommit = 0, totalSavings = 0, totalMktplace = 0, s = spend;

  // Year 1 values for the breakdown display
  const y1Cap = s * 0.25;
  const y1Eligible = Math.min(mktplaceInput, y1Cap);

  // Cap info
  if (mktplaceInput > y1Cap) {
    document.getElementById('dpCapInfo').innerHTML =
      '<span class="mktplace-cap-label">25% cap applied:</span>' +
      '<span class="mktplace-cap-value">' + fmt(y1Eligible) + ' eligible</span>' +
      '<span class="mktplace-cap-label" style="margin-left:6px;color:#ff6b6b">(exceeds cap by ' + fmt(mktplaceInput - y1Cap) + ')</span>';
  } else {
    document.getElementById('dpCapInfo').innerHTML =
      '<span class="mktplace-cap-label">Within 25% cap:</span>' +
      '<span class="mktplace-cap-value">' + fmt(y1Eligible) + ' eligible</span>';
  }

  for (let i = 1; i <= term; i++) {
    labels.push('Year ' + i);
    const yearCap = s * 0.25;
    const yearMktplace = Math.min(mktplaceInput, yearCap);
    const yearRemaining = s - yearMktplace;

    projectedData.push(s);
    mktplaceData.push(yearMktplace);
    remainingData.push(yearRemaining);

    const tier = getDiscountTier(s);
    totalCommit += s;
    totalSavings += s * tier.rate;
    totalMktplace += yearMktplace;
    s *= (1 + growth);
  }

  const avgTier = getDiscountTier(spend);
  demandChart.data.labels = labels;
  demandChart.data.datasets = [
    {
      label: 'Direct AWS Usage Needed',
      data: remainingData,
      backgroundColor: 'rgba(255,153,0,0.35)',
      borderColor: '#ff9900',
      borderWidth: 2
    },
    {
      label: 'Marketplace Drawdown',
      data: mktplaceData,
      backgroundColor: 'rgba(184,169,255,0.4)',
      borderColor: '#b8a9ff',
      borderWidth: 2
    },
    {
      label: 'Total Commitment',
      data: projectedData,
      type: 'line',
      backgroundColor: 'transparent',
      borderColor: '#fff',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      fill: false,
      tension: 0.3
    }
  ];
  demandChart.options.scales.x = { stacked: true, grid: { display: false } };
  demandChart.options.scales.y = { stacked: true, ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } };
  demandChart.update();

  // Breakdown cards (Year 1 view)
  document.getElementById('dpTotalCommitment').textContent = fmt(spend);
  document.getElementById('dpMktplaceDrawdown').textContent = fmt(y1Eligible);
  document.getElementById('dpRemainingUsage').textContent = fmt(spend - y1Eligible);

  // Metrics
  document.getElementById('dpDiscount').textContent = avgTier.label;
  document.getElementById('dpTier').textContent = avgTier.tier;
  document.getElementById('dpCommitment').textContent = fmt(totalCommit);
  document.getElementById('dpSavings').textContent = fmt(totalSavings);
  document.getElementById('dpMktplaceTotal').textContent = fmt(totalMktplace);

  const mktplacePct = totalCommit > 0 ? Math.round((totalMktplace / totalCommit) * 100) : 0;
  document.getElementById('dpMktplaceSub').textContent = mktplacePct + '% of total commitment';

  // Insight
  const insight = document.getElementById('dpInsight');
  if (mktplaceInput > 0) {
    const excessMsg = mktplaceInput > y1Cap
      ? ` Note: your ISV spend of <strong style="color:#ff6b6b">${fmt(mktplaceInput)}</strong> exceeds the 25% cap — only <strong style="color:#b8a9ff">${fmt(y1Eligible)}</strong> counts toward your commitment in Year 1.`
      : '';
    insight.innerHTML =
      `🏪 By routing <strong style="color:#b8a9ff">${fmt(y1Eligible)}/yr</strong> of ISV spend through Marketplace, your direct AWS usage requirement drops to <strong style="color:#64ffda">${fmt(spend - y1Eligible)}/yr</strong> in Year 1. ` +
      `Over the full <strong>${term}-year</strong> term, Marketplace covers <strong style="color:#b8a9ff">${fmt(totalMktplace)}</strong> of your <strong>${fmt(totalCommit)}</strong> total commitment.${excessMsg}`;
  } else {
    insight.innerHTML =
      `🏪 No Marketplace ISV spend entered. If your organization uses third-party software (monitoring, security, databases, etc.), routing those purchases through AWS Marketplace can count toward up to 25% of your PPA commitment — reducing the direct AWS usage you need.`;
  }
}

// ══════════════════════════════════════════
// SECTION 5: Deal Scenarios & Growth Clause
// ══════════════════════════════════════════
function updateDealScenarios() {
  const spend = +document.getElementById('dealSpend').value;
  document.getElementById('dealSpendVal').textContent = fmt(spend);
  const c1 = getDiscountTier(spend);
  document.getElementById('sc1Discount').textContent = 'Standard';
  document.getElementById('sc1Savings').textContent = fmt(spend * c1.rate * 0.7);
  let total3 = 0, s3 = spend;
  for (let i = 0; i < 3; i++) { total3 += s3 * getDiscountTier(s3).rate; s3 *= 1.10; }
  document.getElementById('sc2Discount').textContent = 'Enhanced';
  document.getElementById('sc2Savings').textContent = fmt(total3 * 1.2);
  let total5 = 0, s5 = spend;
  for (let i = 0; i < 5; i++) { total5 += s5 * getDiscountTier(s5).rate; s5 *= 1.15; }
  document.getElementById('sc3Discount').textContent = 'Premium';
  document.getElementById('sc3Savings').textContent = fmt(total5 * 1.5);
}

let staticChart, dynamicChart;
function initGrowthClause() {
  const opts = () => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmt(c.raw) } } },
    scales: { y: { ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } }, x: { grid: { display: false } } }
  });
  staticChart = new Chart(document.getElementById('staticGrowthChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [] }, options: opts() });
  dynamicChart = new Chart(document.getElementById('dynamicGrowthChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [] }, options: opts() });
  updateGrowthClause();
}

function updateGrowthClause() {
  const clause = +document.getElementById('growthClause').value / 100;
  const base = +document.getElementById('growthBase').value;
  document.getElementById('growthClauseVal').textContent = pct(clause * 100);
  document.getElementById('growthBaseVal').textContent = fmt(base);
  const labels = [], staticData = [], dynamicData = [];
  let d = base;
  for (let i = 1; i <= 5; i++) {
    labels.push('Year ' + i);
    staticData.push(base);
    dynamicData.push(d);
    d *= (1 + clause);
  }
  staticChart.data.labels = labels;
  staticChart.data.datasets = [{ label: 'Flat Commitment', data: staticData, backgroundColor: '#8892b066', borderColor: '#8892b0', borderWidth: 2 }];
  staticChart.update();
  dynamicChart.data.labels = labels;
  dynamicChart.data.datasets = [{ label: 'Growing Commitment', data: dynamicData, backgroundColor: '#ff990066', borderColor: '#ff9900', borderWidth: 2 }];
  dynamicChart.update();

  const staticTier = getDiscountTier(base);
  const finalTier = getDiscountTier(d / (1 + clause));
  const totalStaticSavings = base * 5 * staticTier.rate;
  let totalDynSavings = 0, dd = base;
  for (let i = 0; i < 5; i++) { totalDynSavings += dd * getDiscountTier(dd).rate; dd *= (1 + clause); }
  document.getElementById('growthClauseInsight').innerHTML =
    `🔄 <strong>Static approach:</strong> ${staticTier.label} value locked for 5 years = ${fmt(totalStaticSavings)} total value. ` +
    `<strong style="color:#ff9900">Growth approach:</strong> Starting at ${staticTier.label}, progressing to ${finalTier.label} by Year 5 = ${fmt(totalDynSavings)} total value. ` +
    `The growth clause generates <strong style="color:#64ffda">${fmt(totalDynSavings - totalStaticSavings)} more</strong> in value while funding expansion.`;
}

// ══════════════════════════════════════════
// SECTION 6: Risk Balance
// ══════════════════════════════════════════
function updateRiskBalance() {
  const level = +document.getElementById('riskLevel').value;
  document.getElementById('riskLevelVal').textContent = pct(level);
  const position = ((level - 50) / 70) * 100;
  document.getElementById('riskIndicator').style.left = Math.max(0, Math.min(98, position)) + '%';
  const insight = document.getElementById('riskInsight');
  if (level < 70) insight.innerHTML = '🟢 <strong>Conservative.</strong> Low true-up risk, but leaving value on the table. Consider committing closer to 80-90%.';
  else if (level < 85) insight.innerHTML = '🟡 <strong>Moderate.</strong> Good balance of safety and value with a comfortable buffer for demand fluctuations.';
  else if (level <= 95) insight.innerHTML = '🌟 <strong style="color:#64ffda">Sweet spot.</strong> ' + pct(level) + ' of projected spend maximizes value capture with a reasonable safety margin.';
  else if (level <= 105) insight.innerHTML = '🟠 <strong>Aggressive.</strong> Near or at projected spend. Higher value tier, but limited margin for error. Ensure forecasting is robust.';
  else insight.innerHTML = '🔴 <strong>Over-commitment risk.</strong> Above projected spend creates significant true-up exposure. Consider reducing unless migration plans are firm.';
}

// ══════════════════════════════════════════
// SECTION 7: Calculator & Reinvestment
// ══════════════════════════════════════════
let calcChart, reinvestChart;
function initCalculator() {
  calcChart = new Chart(document.getElementById('calcChart').getContext('2d'), {
    type: 'bar', data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + fmt(c.raw) } } },
      scales: { y: { ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } }, x: { grid: { display: false } } }
    }
  });
  updateCalculator();
}

function updateCalculator() {
  const spend = +document.getElementById('calcSpend').value;
  const growth = +document.getElementById('calcGrowth').value / 100;
  const term = +document.getElementById('calcTerm').value;
  const optPct = +document.getElementById('calcOptimization').value / 100;
  document.getElementById('calcSpendVal').textContent = fmt(spend);
  document.getElementById('calcGrowthVal').textContent = pct(growth * 100);
  document.getElementById('calcTermVal').textContent = term + ' yr';
  document.getElementById('calcOptimizationVal').textContent = pct(optPct * 100);

  const labels = [], onDemand = [], optimized = [], afterPPA = [];
  let totalOD = 0, totalPPA = 0, s = spend;
  for (let i = 1; i <= term; i++) {
    labels.push('Year ' + i);
    onDemand.push(s);
    const opt = s * (1 - optPct);
    optimized.push(opt);
    const tier = getDiscountTier(opt);
    const ppa = opt * (1 - tier.rate);
    afterPPA.push(ppa);
    totalOD += s; totalPPA += ppa;
    s *= (1 + growth);
  }
  calcChart.data.labels = labels;
  calcChart.data.datasets = [
    { label: 'On-Demand', data: onDemand, backgroundColor: 'rgba(136,146,176,0.3)', borderColor: '#8892b0', borderWidth: 2 },
    { label: 'After Optimization', data: optimized, backgroundColor: 'rgba(255,153,0,0.3)', borderColor: '#ff9900', borderWidth: 2 },
    { label: 'After PPA', data: afterPPA, backgroundColor: 'rgba(100,255,218,0.3)', borderColor: '#64ffda', borderWidth: 2 }
  ];
  calcChart.update();
  const avgTier = getDiscountTier(spend * (1 - optPct));
  document.getElementById('calcDiscount').textContent = avgTier.label;
  document.getElementById('calcTotalSavings').textContent = fmt(totalOD - totalPPA);
  document.getElementById('calcEffective').textContent = pct((totalPPA / totalOD) * 100);
  document.getElementById('calcCombined').textContent = fmt(totalOD - totalPPA);
  window._ppaSavings = totalOD - totalPPA;
  updateReinvestment();
}

function initReinvestment() {
  reinvestChart = new Chart(document.getElementById('reinvestChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['New Workloads', 'Regional Expansion', 'AI/ML Innovation', 'Migration'], datasets: [{ data: [30, 20, 25, 25], backgroundColor: ['#ff9900', '#64ffda', '#b8a9ff', '#00c9a7'], borderColor: '#0a0e27', borderWidth: 3 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => c.label + ': ' + fmt((window._ppaSavings || 1000000) * c.raw / 100) } } }, cutout: '55%' }
  });
  updateReinvestment();
}

function updateReinvestment() {
  const w = +document.getElementById('riWorkloads').value;
  const r = +document.getElementById('riRegions').value;
  const a = +document.getElementById('riAi').value;
  const m = +document.getElementById('riMigration').value;
  document.getElementById('riWorkloadsVal').textContent = w + '%';
  document.getElementById('riRegionsVal').textContent = r + '%';
  document.getElementById('riAiVal').textContent = a + '%';
  document.getElementById('riMigrationVal').textContent = m + '%';
  if (reinvestChart) { reinvestChart.data.datasets[0].data = [w, r, a, m]; reinvestChart.update(); }
  const savings = window._ppaSavings || 1000000;
  const total = w + r + a + m || 1;
  document.getElementById('reinvestInsight').innerHTML =
    `💰 With <strong style="color:#64ffda">${fmt(savings)}</strong> in combined value: ` +
    `<strong style="color:#ff9900">${fmt(savings * w / total)}</strong> → new workloads, ` +
    `<strong style="color:#64ffda">${fmt(savings * r / total)}</strong> → regional expansion, ` +
    `<strong style="color:#b8a9ff">${fmt(savings * a / total)}</strong> → AI/ML innovation, ` +
    `<strong style="color:#00c9a7">${fmt(savings * m / total)}</strong> → migration acceleration. ` +
    `This isn't money saved — it's growth capital redirected.`;
}

// ══════════════════════════════════════════
// SECTION 9: Your Growth Planner
// ══════════════════════════════════════════
let plannerChart;
let plannerRowId = 3; // starting after the 3 default rows

function initPlanner() {
  const ctx = document.getElementById('plannerChart').getContext('2d');
  plannerChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } },
        tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + fmt(c.raw) } }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: (v) => fmt(v) }, grid: { color: 'rgba(45,53,97,0.5)' } }
      }
    }
  });

  // Add project button
  document.getElementById('plannerAddBtn').addEventListener('click', addPlannerRow);

  // Download CSV button
  document.getElementById('plannerDownloadBtn').addEventListener('click', downloadPlannerCSV);

  // Delegate events on the table
  const table = document.getElementById('plannerTable');
  table.addEventListener('input', updatePlanner);
  table.addEventListener('change', updatePlanner);
  table.addEventListener('click', (e) => {
    if (e.target.closest('.planner-remove-btn')) {
      const row = e.target.closest('tr');
      if (document.querySelectorAll('#plannerBody tr').length > 1) {
        row.remove();
        updatePlanner();
      }
    }
  });

  // Format spend inputs on blur
  table.addEventListener('blur', (e) => {
    if (e.target.classList.contains('planner-spend')) {
      e.target.value = formatSpendInput(parseSpendInput(e.target.value));
    }
  }, true);

  updatePlanner();
}

function parseSpendInput(val) {
  return Math.max(0, parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0);
}

function formatSpendInput(num) {
  return num.toLocaleString('en-US');
}

function addPlannerRow() {
  const term = +document.getElementById('plannerTerm').value;
  const tbody = document.getElementById('plannerBody');
  const tr = document.createElement('tr');
  tr.setAttribute('data-row', plannerRowId++);
  let yearOpts = '';
  for (let i = 1; i <= 5; i++) {
    yearOpts += `<option value="${i}"${i === 1 ? ' selected' : ''}>Year ${i}</option>`;
  }
  tr.innerHTML =
    `<td><input type="text" class="planner-input planner-name" value="New Project" aria-label="Project name"></td>` +
    `<td><select class="planner-select planner-year" aria-label="Start year">${yearOpts}</select></td>` +
    `<td><div class="spend-input-wrap"><span class="spend-prefix">$</span><input type="text" class="planner-input planner-spend" value="100,000" aria-label="Annual spend increase"></div></td>` +
    `<td><select class="planner-select planner-category" aria-label="Category"><option value="migration">Migration</option><option value="new-workload">New Workload</option><option value="expansion">Regional Expansion</option><option value="ai-ml">AI / ML</option><option value="modernization">Modernization</option><option value="marketplace">Marketplace</option><option value="other">Other</option></select></td>` +
    `<td><button class="planner-remove-btn" aria-label="Remove project" title="Remove">✕</button></td>`;
  tbody.appendChild(tr);
  tr.querySelector('.planner-name').focus();
  tr.querySelector('.planner-name').select();
  updatePlanner();
}

function updatePlanner() {
  const baseline = +document.getElementById('plannerBaseline').value;
  const growth = +document.getElementById('plannerGrowth').value / 100;
  const term = +document.getElementById('plannerTerm').value;
  document.getElementById('plannerBaselineVal').textContent = fmt(baseline);
  document.getElementById('plannerGrowthVal').textContent = pct(growth * 100);
  document.getElementById('plannerTermVal').textContent = term + ' yr';

  // Gather projects
  const rows = document.querySelectorAll('#plannerBody tr');
  const projects = [];
  rows.forEach(row => {
    const name = row.querySelector('.planner-name').value || 'Unnamed';
    const startYear = +row.querySelector('.planner-year').value;
    const spend = parseSpendInput(row.querySelector('.planner-spend').value);
    const category = row.querySelector('.planner-category').value;
    projects.push({ name, startYear, spend, category });
  });

  // Build year-by-year data
  const labels = [];
  const baselineData = [];
  const projectData = [];
  let totalOverTerm = 0;
  let totalProjectSpend = 0;
  let y1Total = 0;

  const categoryColors = {
    migration: '#00c9a7',
    'new-workload': '#ff9900',
    expansion: '#64ffda',
    'ai-ml': '#b8a9ff',
    modernization: '#ff6b9d',
    marketplace: '#ffd700',
    other: '#8892b0'
  };

  // Build per-category stacked data
  const categories = ['migration', 'new-workload', 'expansion', 'ai-ml', 'modernization', 'marketplace', 'other'];
  const categoryLabels = { migration: 'Migration', 'new-workload': 'New Workload', expansion: 'Regional Expansion', 'ai-ml': 'AI / ML', modernization: 'Modernization', marketplace: 'Marketplace', other: 'Other' };
  const catData = {};
  categories.forEach(c => catData[c] = []);

  let b = baseline;
  for (let yr = 1; yr <= term; yr++) {
    labels.push('Year ' + yr);
    baselineData.push(b);

    let yearProjectSpend = 0;
    categories.forEach(c => {
      let catSpend = 0;
      projects.forEach(p => {
        if (p.category === c && p.startYear <= yr) {
          catSpend += p.spend;
        }
      });
      catData[c].push(catSpend);
      yearProjectSpend += catSpend;
    });

    const yearTotal = b + yearProjectSpend;
    totalOverTerm += yearTotal;
    totalProjectSpend += yearProjectSpend;
    if (yr === 1) y1Total = yearTotal;

    b = b * (1 + growth);
  }

  // Build datasets
  const datasets = [
    {
      label: 'Baseline Spend',
      data: baselineData,
      backgroundColor: 'rgba(136,146,176,0.4)',
      borderColor: '#8892b0',
      borderWidth: 1
    }
  ];
  categories.forEach(c => {
    const hasData = catData[c].some(v => v > 0);
    if (hasData) {
      datasets.push({
        label: categoryLabels[c],
        data: catData[c],
        backgroundColor: categoryColors[c] + '66',
        borderColor: categoryColors[c],
        borderWidth: 1
      });
    }
  });

  plannerChart.data.labels = labels;
  plannerChart.data.datasets = datasets;
  plannerChart.update();

  // Update metrics
  document.getElementById('planY1').textContent = fmt(y1Total);
  document.getElementById('planTotal').textContent = fmt(totalOverTerm);
  document.getElementById('planProjectTotal').textContent = fmt(totalProjectSpend);

  const avgAnnual = totalOverTerm / term;
  const tier = getDiscountTier(avgAnnual);
  document.getElementById('planTier').textContent = tier.label;
  document.getElementById('planTierSub').textContent = tier.tier + ' — avg ' + fmt(avgAnnual) + '/yr';

  // Insight
  const projCount = projects.length;
  const totalSavings = totalOverTerm * tier.rate;
  document.getElementById('plannerInsight').innerHTML =
    `📋 With <strong>${projCount} planned project${projCount !== 1 ? 's' : ''}</strong> adding <strong style="color:#ff9900">${fmt(totalProjectSpend)}</strong> on top of your <strong>${fmt(baseline)}</strong> baseline over <strong>${term} year${term !== 1 ? 's' : ''}</strong>, ` +
    `your total projected spend is <strong style="color:#fff">${fmt(totalOverTerm)}</strong>. ` +
    `At the <strong style="color:#ff9900">${tier.label}</strong> value tier, that could translate to approximately <strong style="color:#64ffda">${fmt(totalSavings)}</strong> in PPA value.`;
}

function downloadPlannerCSV() {
  const baseline = +document.getElementById('plannerBaseline').value;
  const growth = +document.getElementById('plannerGrowth').value;
  const term = +document.getElementById('plannerTerm').value;

  const rows = document.querySelectorAll('#plannerBody tr');
  const categoryLabels = { migration: 'Migration', 'new-workload': 'New Workload', expansion: 'Regional Expansion', 'ai-ml': 'AI / ML', modernization: 'Modernization', marketplace: 'Marketplace', other: 'Other' };

  let csv = 'AWS Private Pricing Agreement - Growth Planner\r\n';
  csv += '\r\n';
  csv += 'Baseline Settings\r\n';
  csv += 'Current Annual Baseline Spend,' + baseline + '\r\n';
  csv += 'Organic YoY Growth %,' + growth + '%\r\n';
  csv += 'Planning Horizon,' + term + ' years\r\n';
  csv += '\r\n';
  csv += 'Project / Initiative,Start Year,Annual Spend Increase,Category\r\n';

  let totalProjectSpend = 0;
  rows.forEach(row => {
    const name = row.querySelector('.planner-name').value.replace(/,/g, ' ');
    const startYear = row.querySelector('.planner-year').value;
    const spend = parseSpendInput(row.querySelector('.planner-spend').value);
    const catVal = row.querySelector('.planner-category').value;
    const catLabel = categoryLabels[catVal] || catVal;
    csv += `"${name}",Year ${startYear},${spend},"${catLabel}"\r\n`;
    totalProjectSpend += spend;
  });

  csv += '\r\n';
  csv += 'Summary\r\n';

  let b = baseline, totalOverTerm = 0;
  csv += 'Year,Baseline Spend,Project Spend Added,Total Projected Spend\r\n';
  for (let yr = 1; yr <= term; yr++) {
    let yrProject = 0;
    rows.forEach(row => {
      const startYear = +row.querySelector('.planner-year').value;
      const spend = parseSpendInput(row.querySelector('.planner-spend').value);
      if (startYear <= yr) yrProject += spend;
    });
    const total = b + yrProject;
    csv += `Year ${yr},${Math.round(b)},${yrProject},${Math.round(total)}\r\n`;
    totalOverTerm += total;
    b = b * (1 + growth / 100);
  }
  csv += `\r\nTotal Over Term,,${totalProjectSpend},${Math.round(totalOverTerm)}\r\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AWS_PPA_Growth_Plan.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════
// INITIALIZATION & EVENT BINDING
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initGrowthJourney();
  initESROI();
  initEligibility();
  updateQualification();
  initOptimizationStack();
  initDemandPlanning();
  updateDealScenarios();
  initGrowthClause();
  updateRiskBalance();
  initCalculator();
  initReinvestment();
  initPlanner();

  // Section 1
  document.getElementById('overviewSpend').addEventListener('input', () => {
    updateGrowthJourney();
    syncSpendFromOverview();
  });
  document.getElementById('overviewGrowth').addEventListener('input', updateGrowthJourney);
  document.getElementById('overviewUnits').addEventListener('input', updateGrowthJourney);
  // Section 2 - Enterprise Support ROI
  document.getElementById('esAnnualSpend').addEventListener('input', updateESROI);
  document.getElementById('esDowntimeHours').addEventListener('input', updateESROI);
  document.getElementById('esDowntimeCost').addEventListener('input', updateESROI);
  // Section 3
  document.getElementById('qualSpend').addEventListener('input', updateQualification);
  document.getElementById('qualGrowth').addEventListener('input', updateQualification);
  // Section 3
  document.getElementById('stackSpend').addEventListener('input', updateOptimizationStack);
  // Section 4
  document.getElementById('dpSpend').addEventListener('input', updateDemandPlanning);
  document.getElementById('dpGrowth').addEventListener('input', updateDemandPlanning);
  document.getElementById('dpTerm').addEventListener('input', updateDemandPlanning);
  document.getElementById('dpMktplaceAmount').addEventListener('input', updateDemandPlanning);
  document.getElementById('dpMktplaceAmount').addEventListener('blur', function() {
    this.value = formatSpendInput(parseSpendInput(this.value));
  });
  // Section 5
  document.getElementById('dealSpend').addEventListener('input', updateDealScenarios);
  document.getElementById('growthClause').addEventListener('input', updateGrowthClause);
  document.getElementById('growthBase').addEventListener('input', updateGrowthClause);
  // Section 6
  document.getElementById('riskLevel').addEventListener('input', updateRiskBalance);
  // Section 7
  document.getElementById('calcSpend').addEventListener('input', updateCalculator);
  document.getElementById('calcGrowth').addEventListener('input', updateCalculator);
  document.getElementById('calcTerm').addEventListener('input', updateCalculator);
  document.getElementById('calcOptimization').addEventListener('input', updateCalculator);
  // Reinvestment
  document.getElementById('riWorkloads').addEventListener('input', updateReinvestment);
  document.getElementById('riRegions').addEventListener('input', updateReinvestment);
  document.getElementById('riAi').addEventListener('input', updateReinvestment);
  document.getElementById('riMigration').addEventListener('input', updateReinvestment);
  // Section 9 - Planner
  document.getElementById('plannerBaseline').addEventListener('input', updatePlanner);
  document.getElementById('plannerGrowth').addEventListener('input', updatePlanner);
  document.getElementById('plannerTerm').addEventListener('input', updatePlanner);
  // Scenario cards
  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
});
