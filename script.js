/* ═══════════════════════════════════════════════════
   ALAYA — Energy Legal Intelligence Dashboard
   Dynamic Engine
   ═══════════════════════════════════════════════════ */

// ═══════ DATA STORE ═══════
let casesData = [];
let regulationsData = [];
let energyData = {};
let activeFilters = { court: 'all', status: 'all' };
let searchQuery = '';

// ═══════ INITIALIZATION ═══════
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await loadAllData();
    initNavigation();
    initSearch();
    initFilters();
    initMobileMenu();
    renderDashboard();
    renderAllCases();
    renderRegulations();
    renderAnalytics();
    renderEnergySection();
    renderTransparency();
    initGeospatial();
    setLastUpdated();
});

// ═══════ SOURCES DATA ═══════
const sourcesData = [
    {
        name: 'Supreme Court of India',
        type: 'Registry (Legal)',
        description: 'Case status, orders, and judgment summaries for landmark energy disputes.',
        status: 'Online',
        updated: 'Daily',
        link: 'https://main.sci.gov.in/'
    },
    {
        name: 'APTEL',
        type: 'Tribunal (Legal)',
        description: 'Appellate Tribunal for Electricity rulings and appeal tracking.',
        status: 'Online',
        updated: 'Daily',
        link: 'https://aptel.gov.in/'
    },
    {
        name: 'CERC',
        type: 'Regulatory (Policy)',
        description: 'Tariff orders, regulations, and implementation directives.',
        status: 'Online',
        updated: 'Real-time',
        link: 'https://cercind.gov.in/'
    },
    {
        name: 'MNRE / ALMM',
        type: 'Statistical (Energy)',
        description: 'Installed capacity by technology and ALMM list compliance.',
        status: 'Online',
        updated: 'Monthly',
        link: 'https://mnre.gov.in/'
    },
    {
        name: 'POSOCO / Grid-Controller',
        type: 'Operational (Energy)',
        description: 'Daily RE generation, regional load, and curtailment logs.',
        status: 'Online',
        updated: 'Daily',
        link: 'https://grid-india.in/'
    },
    {
        name: 'State SERCs',
        type: 'Regional (Regulatory)',
        description: 'State-wise RPO targets and local utility performance reports.',
        status: 'Syncing',
        updated: 'Weekly',
        link: '#'
    }
];

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const savedTheme = localStorage.getItem('alaya-theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    
    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('alaya-theme', next);
        icon.textContent = next === 'light' ? '☀️' : '🌙';
        
        // Refresh charts to pick up color changes
        renderAnalytics();
        renderEnergySection();
    });
}


// ═══════ DATA LOADING ═══════
async function loadAllData() {
    try {
        const [casesRes, regsRes, energyRes] = await Promise.all([
            fetch('data/cases.json'),
            fetch('data/regulations.json'),
            fetch('data/energy.json')
        ]);
        casesData = await casesRes.json();
        regulationsData = await regsRes.json();
        energyData = await energyRes.json();

        // Sort cases by date descending
        casesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Sort regulations by date descending
        regulationsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
        console.error('Failed to load data:', err);
    }
}

// ═══════ NAVIGATION ═══════
function initNavigation() {
    const navItems = document.querySelectorAll('#nav-menu li');
    const sections = document.querySelectorAll('.view-section');
    const searchContainer = document.getElementById('search-container');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === sectionId) s.classList.add('active');
            });

            // Show search only on cases and dashboard
            const showSearch = ['dashboard', 'cases'].includes(sectionId);
            searchContainer.style.display = showSearch ? 'block' : 'none';

            // Update subtitle
            const subtitles = {
                dashboard: `Tracking ${casesData.length} legal developments across Indian energy markets`,
                cases: `${getFilteredCases().length} proceedings across all forums`,
                regulations: `${regulationsData.length} regulatory milestones shaping the sector`,
                analytics: 'Visual intelligence on case distribution and trends',
                energy: 'Renewable energy capacity and compliance data',
                transparency: 'Audit trail of data sources and system methodology',
                geospatial: 'CERC Digital Twin: Mapping global and local energy infrastructure'
            };
            document.getElementById('header-subtitle').textContent = subtitles[sectionId] || '';

            // Close mobile sidebar
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // "View All" button
    document.getElementById('view-all-cases').addEventListener('click', () => {
        document.querySelector('[data-section="cases"]').click();
    });
}

function renderTransparency() {
    const grid = document.getElementById('sources-grid');
    if (!grid) return;

    grid.innerHTML = sourcesData.map((source, i) => `
        <div class="source-card" style="animation: fadeInUp 0.5s ${i * 0.1}s var(--ease-out) both;">
            <div class="source-header">
                <span class="source-title">${source.name}</span>
                <span class="source-status status-${source.status.toLowerCase()}">${source.status}</span>
            </div>
            <div class="source-body">
                <p>${source.description}</p>
            </div>
            <div class="source-footer">
                <span class="source-updated">Updated: ${source.updated}</span>
                <a href="${source.link}" target="_blank" class="source-link">Source Registry ↗</a>
            </div>
        </div>
    `).join('');
}

// ═══════ SEARCH ═══════
function initSearch() {
    const input = document.getElementById('search-input');
    let timeout;
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderAllCases();
            renderDashboardCases();
        }, 200);
    });
}

// ═══════ FILTERS ═══════
function initFilters() {
    const filterBar = document.getElementById('filter-bar');
    const courts = ['All', ...new Set(casesData.map(c => c.courtShort))];

    courts.forEach(court => {
        const chip = document.createElement('button');
        chip.className = 'filter-chip' + (court === 'All' ? ' active' : '');
        chip.textContent = court;
        chip.addEventListener('click', () => {
            filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilters.court = court === 'All' ? 'all' : court;
            renderAllCases();
            renderDashboardCases();
        });
        filterBar.appendChild(chip);
    });
}

function getFilteredCases() {
    return casesData.filter(c => {
        const matchCourt = activeFilters.court === 'all' || c.courtShort === activeFilters.court;
        const matchSearch = !searchQuery ||
            c.title.toLowerCase().includes(searchQuery) ||
            c.issue.toLowerCase().includes(searchQuery) ||
            c.court.toLowerCase().includes(searchQuery) ||
            c.category.toLowerCase().includes(searchQuery) ||
            c.caseNo.toLowerCase().includes(searchQuery);
        return matchCourt && matchSearch;
    });
}

// ═══════ MOBILE MENU ═══════
function initMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// ═══════ DASHBOARD RENDERING ═══════
function renderDashboard() {
    renderStatCards();
    renderDashboardCases();
}

function renderStatCards() {
    const grid = document.getElementById('stat-grid');
    const pending = casesData.filter(c => c.status === 'Pending').length;
    const critical = casesData.filter(c => c.impact === 'Critical').length;
    const courts = {
        SC: casesData.filter(c => c.courtShort === 'SC').length,
        HC: casesData.filter(c => c.courtShort === 'HC').length,
        APTEL: casesData.filter(c => c.courtShort === 'APTEL').length,
        CERC: casesData.filter(c => c.courtShort === 'CERC').length,
    };

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Cases</div>
            <div class="stat-value">${casesData.length}</div>
            <div class="stat-detail"><span class="trend-up">▲</span> ${pending} pending</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Critical Impact</div>
            <div class="stat-value">${String(critical).padStart(2, '0')}</div>
            <div class="stat-detail"><span class="trend-up">⚠</span> Require monitoring</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Supreme Court</div>
            <div class="stat-value">${String(courts.SC).padStart(2, '0')}</div>
            <div class="stat-detail">HC: ${courts.HC} · APTEL: ${courts.APTEL}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Regulations</div>
            <div class="stat-value">${String(regulationsData.length).padStart(2, '0')}</div>
            <div class="stat-detail">${regulationsData.filter(r => r.status === 'Active').length} active frameworks</div>
        </div>
    `;
}

function renderDashboardCases() {
    const list = document.getElementById('recent-case-list');
    const filtered = getFilteredCases().slice(0, 5);
    document.getElementById('recent-count').textContent = filtered.length;
    renderCaseList(filtered, list);
}

// ═══════ CASES RENDERING ═══════
function renderAllCases() {
    const list = document.getElementById('all-case-list');
    const filtered = getFilteredCases();
    document.getElementById('total-case-count').textContent = `${filtered.length} of ${casesData.length}`;
    renderCaseList(filtered, list);
}

function renderCaseList(data, container) {
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No cases match your search or filters.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = data.map((item, i) => `
        <div class="case-item" style="animation-delay: ${i * 0.04}s">
            <div class="case-info">
                <h4>${item.title}</h4>
                <div class="case-meta">
                    <span class="court-tag">${item.courtShort}</span>
                    <span class="separator">·</span>
                    <span>${item.category}</span>
                    <span class="separator">·</span>
                    <span class="mono">${item.caseNo}</span>
                    <span class="separator">·</span>
                    <span>${formatDate(item.date)}</span>
                </div>
                <div class="case-issue">${item.issue}</div>
            </div>
            <div class="case-badges">
                <span class="impact-badge impact-${item.impact.toLowerCase()}">${item.impact}</span>
                <span class="status-badge status-${getStatusClass(item.status)}">${item.status}</span>
            </div>
        </div>
    `).join('');
}

// ═══════ REGULATIONS RENDERING ═══════
function renderRegulations() {
    const container = document.getElementById('regulation-timeline');
    document.getElementById('reg-count').textContent = regulationsData.length;

    container.innerHTML = regulationsData.map((reg, i) => `
        <div class="timeline-item ${reg.impact === 'Landmark' ? 'landmark' : ''}" style="animation-delay: ${i * 0.06}s">
            <div class="tl-date">${formatDate(reg.date)}</div>
            <div class="tl-title">${reg.title}</div>
            <div class="tl-authority">${reg.authority}</div>
            <div class="tl-desc">${reg.description}</div>
            <div class="tl-badges">
                <span class="status-badge status-${getStatusClass(reg.status)}">${reg.status}</span>
                ${reg.impact === 'Landmark' ? '<span class="impact-badge impact-critical">Landmark</span>' : ''}
            </div>
        </div>
    `).join('');
}

// ═══════ ANALYTICS RENDERING ═══════
function renderAnalytics() {
    renderCourtDonut();
    renderStatusDonut();
    renderVolumeChart();
    renderCategoryChart();
}

function renderCourtDonut() {
    const wrapper = document.getElementById('court-donut-wrapper');
    const courtCounts = {};
    casesData.forEach(c => {
        courtCounts[c.courtShort] = (courtCounts[c.courtShort] || 0) + 1;
    });

    const entries = Object.entries(courtCounts).sort((a, b) => b[1] - a[1]);
    const total = casesData.length;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Theme-aware palette
    const colors = isLight 
        ? ['#2B4C99', '#337AB7', '#FFD700', '#B45309', '#047857', '#1D4ED8', '#64748B']
        : ['#6c5ce7', '#a29bfe', '#74b9ff', '#fd79a8', '#00cec9', '#fdcb6e', '#55efc4'];

    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 50;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const segments = entries.map(([court, count], i) => {
        const pct = count / total;
        const dashLen = pct * circumference;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="${strokeWidth}" stroke-dasharray="${dashLen} ${circumference - dashLen}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
        offset += dashLen;
        return seg;
    });

    const legend = entries.map(([court, count], i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${colors[i % colors.length]}"></span>
            <span>${court}</span>
            <span class="legend-value">${count}</span>
        </div>
    `).join('');

    wrapper.innerHTML = `
        <svg class="donut-chart" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--surface-2)" stroke-width="${strokeWidth}" />
            ${segments.join('')}
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-center-text" font-size="22" fill="var(--text-primary)">${total}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="donut-center-label" fill="var(--text-secondary)">Total</text>
        </svg>
        <div class="chart-legend">${legend}</div>
    `;
}

function renderStatusDonut() {
    const wrapper = document.getElementById('status-donut-wrapper');
    const statusCounts = {};
    casesData.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
    const total = casesData.length;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Use theme variables for status colors
    const getStatusColor = (status) => {
        const map = {
            'Pending': isLight ? '#92400e' : '#fdcb6e',
            'Resolved': isLight ? '#065f46' : '#00cec9',
            'Under Review': isLight ? '#1e40af' : '#74b9ff',
            'Active': isLight ? '#065f46' : '#55efc4',
            'Draft': isLight ? '#374151' : '#b2bec3'
        };
        return map[status] || (isLight ? '#64748b' : '#636e72');
    };

    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 50;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const segments = entries.map(([status, count]) => {
        const pct = count / total;
        const dashLen = pct * circumference;
        const color = getStatusColor(status);
        const seg = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${dashLen} ${circumference - dashLen}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
        offset += dashLen;
        return seg;
    });

    const legend = entries.map(([status, count]) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${getStatusColor(status)}"></span>
            <span>${status}</span>
            <span class="legend-value">${count}</span>
        </div>
    `).join('');

    wrapper.innerHTML = `
        <svg class="donut-chart" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--surface-2)" stroke-width="${strokeWidth}" />
            ${segments.join('')}
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-center-text" font-size="22" fill="var(--text-primary)">${total}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="donut-center-label" fill="var(--text-secondary)">Cases</text>
        </svg>
        <div class="chart-legend">${legend}</div>
    `;
}

function renderVolumeChart() {
    const wrapper = document.getElementById('volume-bar-chart');
    // Simulate monthly filings from case dates
    const months = {};
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    casesData.forEach(c => {
        const d = new Date(c.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = (months[key] || 0) + 1;
    });

    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
    const maxVal = Math.max(...sorted.map(s => s[1]));

    const svgWidth = 500;
    const svgHeight = 200;
    const barWidth = Math.min(40, (svgWidth - 60) / sorted.length - 10);
    const chartHeight = svgHeight - 40;

    const bars = sorted.map(([key, val], i) => {
        const x = 30 + i * (barWidth + 10);
        const h = (val / maxVal) * chartHeight;
        const y = chartHeight - h + 10;
        const [yr, mo] = key.split('-');
        const label = monthLabels[parseInt(mo) - 1] + ' ' + yr.slice(2);
        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="url(#barGrad)" style="animation: barGrow 0.8s ${i * 0.1}s var(--ease-out) both; transform-origin: bottom;">
                <title>${val} case(s) — ${label}</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${svgHeight - 4}" text-anchor="middle" font-size="9">${label}</text>
            <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="var(--text-primary)" font-weight="600">${val}</text>
        `;
    }).join('');

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gradStart = isLight ? '#2B4C99' : '#6c5ce7';
    const gradEnd = isLight ? '#4a69bd' : '#a29bfe';

    wrapper.innerHTML = `
        <svg class="bar-chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${gradStart}" />
                    <stop offset="100%" stop-color="${gradEnd}" />
                </linearGradient>
            </defs>
            ${bars}
        </svg>
    `;
}

function renderCategoryChart() {
    const container = document.getElementById('category-chart');
    const catCounts = {};
    casesData.forEach(c => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });

    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Theme-aware palette for categories
    const colors = isLight
        ? ['#2B4C99', '#337AB7', '#4a69bd', '#1e40af', '#FFD700', '#B45309', '#047857']
        : ['#6c5ce7', '#a29bfe', '#74b9ff', '#fd79a8', '#00cec9', '#fdcb6e', '#55efc4'];

    container.innerHTML = sorted.map(([cat, count], i) => `
        <div class="rpo-item" style="animation: fadeInUp 0.4s ${i * 0.05}s var(--ease-out) both;">
            <span class="rpo-state">${cat}</span>
            <div class="rpo-bar-outer">
                <div class="rpo-bar-inner compliant" style="width: ${(count / max) * 100}%; background: ${colors[i % colors.length]};"></div>
            </div>
            <span class="rpo-value">${count}</span>
        </div>
    `).join('');
}

// ═══════ ENERGY SECTION RENDERING ═══════
function renderEnergySection() {
    renderEnergyHero();
    renderEnergyProgressChart();
    renderRPOGrid();
    renderStateList();
}

function renderEnergyHero() {
    const hero = document.getElementById('energy-hero');
    const nat = energyData.national;
    const pct = ((nat.totalRE / nat.target2030) * 100).toFixed(1);

    hero.innerHTML = `
        <div class="energy-stat-large">
            <div class="stat-label">Total RE Capacity</div>
            <div class="stat-value">${nat.totalRE} <span class="stat-unit">GW</span></div>
            <div class="progress-bar-outer">
                <div class="progress-bar-inner" style="width: ${pct}%"></div>
            </div>
            <div class="progress-label">
                <span>Current</span>
                <span>${pct}% of ${nat.target2030} GW target</span>
            </div>
        </div>
        <div class="energy-stat-large">
            <div class="stat-label">Capacity Breakdown</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">Solar</div>
                    <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--status-pending);">${nat.solar} GW</div>
                </div>
                <div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">Wind</div>
                    <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--status-review);">${nat.wind} GW</div>
                </div>
                <div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">Large Hydro</div>
                    <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--status-resolved);">${nat.largeHydro} GW</div>
                </div>
                <div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px;">Biomass</div>
                    <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--status-active);">${nat.biomass} GW</div>
                </div>
            </div>
        </div>
    `;
}

function renderEnergyProgressChart() {
    const wrapper = document.getElementById('energy-progress-chart');
    const data = energyData.yearlyProgress;
    const maxVal = Math.max(...data.map(d => d.installed));

    const svgWidth = 500;
    const svgHeight = 220;
    const barWidth = 45;
    const chartHeight = svgHeight - 50;
    const gap = (svgWidth - 40 - data.length * barWidth) / (data.length - 1);

    const bars = data.map((d, i) => {
        const x = 20 + i * (barWidth + gap);
        const h = (d.installed / maxVal) * chartHeight;
        const y = chartHeight - h + 15;
        const isLatest = i === data.length - 1;
        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="6" fill="${isLatest ? 'url(#energyGradLive)' : 'url(#energyGrad)'}" style="animation: barGrow 0.8s ${i * 0.1}s var(--ease-out) both; transform-origin: bottom;">
                <title>${d.installed} GW — ${d.year}</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${svgHeight - 8}" text-anchor="middle" font-size="9">${d.year.replace(' (YTD)', '*')}</text>
            <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="var(--text-primary)" font-weight="600">${d.installed}</text>
        `;
    }).join('');

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const grad1Start = isLight ? '#047857' : '#00cec9';
    const grad1End = isLight ? '#064e3b' : '#006c6a';
    const grad2Start = isLight ? '#059669' : '#55efc4';
    const grad2End = isLight ? '#047857' : '#00cec9';

    wrapper.innerHTML = `
        <svg class="bar-chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${grad1Start}" />
                    <stop offset="100%" stop-color="${grad1End}" />
                </linearGradient>
                <linearGradient id="energyGradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${grad2Start}" />
                    <stop offset="100%" stop-color="${grad2End}" />
                </linearGradient>
            </defs>
            ${bars}
        </svg>
    `;
}

function renderRPOGrid() {
    const grid = document.getElementById('rpo-grid');
    const data = energyData.rpoCompliance;

    grid.innerHTML = data.map((item, i) => {
        const pct = (item.achieved / 35) * 100; // scale to 35% max for visual
        const targetPct = (item.target / 35) * 100;
        const compliant = item.achieved >= item.target;
        return `
            <div class="rpo-item" style="animation: fadeInUp 0.4s ${i * 0.06}s var(--ease-out) both;">
                <span class="rpo-state">${item.state}</span>
                <div class="rpo-bar-outer">
                    <div class="rpo-bar-inner ${compliant ? 'compliant' : 'non-compliant'}" style="width: ${pct}%"></div>
                    <div class="rpo-bar-target" style="left: ${targetPct}%"></div>
                </div>
                <span class="rpo-value">${item.achieved}%</span>
            </div>
        `;
    }).join('');
}

function renderStateList() {
    const list = document.getElementById('state-list');
    const states = energyData.stateWise.sort((a, b) => b.total - a.total);

    list.innerHTML = states.map((s, i) => `
        <div class="case-item" style="animation-delay: ${i * 0.04}s">
            <div class="case-info">
                <h4>${s.state}</h4>
                <div class="case-meta">
                    <span>☀️ Solar: ${s.solar} GW</span>
                    <span class="separator">·</span>
                    <span>💨 Wind: ${s.wind} GW</span>
                </div>
            </div>
            <div class="case-badges">
                <span class="status-badge status-active" style="font-family: 'JetBrains Mono', monospace;">${s.total} GW</span>
            </div>
        </div>
    `).join('');
}

// ═══════ UTILITIES ═══════
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusClass(status) {
    const map = {
        'Pending': 'pending',
        'Resolved': 'resolved',
        'Under Review': 'review',
        'Active': 'active',
        'Draft': 'draft'
    };
    return map[status] || 'pending';
}

function setLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && energyData.lastUpdated) {
        el.textContent = formatDate(energyData.lastUpdated);
    }
}

// ═══════ GEOSPATIAL INTELLIGENCE (CESIUM) ═══════
let cesiumViewer = null;

async function initGeospatial() {
    const section = document.getElementById('geospatial');
    if (!section) return;

    // Initialize Cesium Viewer with OpenStreetMap and zero Ion dependencies
    try {
        cesiumViewer = new Cesium.Viewer('cesiumContainer', {
            imageryProvider: new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
            }),
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            baseLayerPicker: false,
            geocoder: false,
            animation: false,
            timeline: false,
            homeButton: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            selectionIndicator: false,
            infoBox: false,
            fullscreenButton: false,
            vrButton: false,
            creditContainer: document.createElement('div') // Hide credits to avoid Ion hits
        });
        
        // Ensure Ion is not called
        Cesium.Ion.defaultAccessToken = '';
    } catch (e) {
        console.error("Cesium Init Error:", e);
    }

    // Custom pins for CERC Lens
    initMapMarkers();
    initMapControls();
}

function initMapMarkers() {
    if (!cesiumViewer) return;

    // India Macro Points (States with high regulatory/market activity)
    const indiaPoints = [
        { name: 'Gujarat', pos: [71.1924, 22.2587], rpo: '22.4%', tariff: '₹2.80', note: 'Global Solar Leader' },
        { name: 'Rajasthan', pos: [73.8474, 27.0238], rpo: '26.2%', tariff: '₹2.40', note: 'Highest Installed Capacity' },
        { name: 'Andhra Pradesh', pos: [79.74, 15.91], rpo: '19.8%', tariff: '₹3.10', note: 'Wind Energy Hub' },
        { name: 'Karnataka', pos: [75.71, 15.31], rpo: '28.1%', tariff: '₹2.95', note: 'Market Integration Leader' }
    ];

    // Global Perspective
    const globalPoints = [
        { name: 'Germany', pos: [10.45, 51.16], rpo: '42.0%', tariff: '€0.06', note: 'Energiewende Benchmark' },
        { name: 'China', pos: [104.19, 35.86], rpo: '29.0%', tariff: '$0.04', note: 'Production Scale Master' },
        { name: 'USA (California)', pos: [-119.41, 36.77], rpo: '33.0%', tariff: '$0.08', note: 'Dynamic Pricing Leader' }
    ];

    // RE Parks (Micro)
    const parkPoints = [
        { name: 'Bhadla Solar Park', pos: [72.3, 27.5], cap: '2.2 GW', note: 'Worlds Largest Solar Park' },
        { name: 'Pavagada Solar Park', pos: [77.4, 14.2], cap: '2.0 GW', note: 'Critical Grid Node' }
    ];

    // Functions to fly to regions
    window.flyToIndia = () => {
        cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 5000000)
        });
        showMapInsights('Central India', 'Regulatory focus on Inter-state Transmission (ISTS)', '21.0%', '₹2.90');
    };

    window.flyToGlobal = () => {
        cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(10, 30, 15000000)
        });
        showMapInsights('Global Market', 'Insights from leading energy transition economies.', '35.0%', '$0.05');
    };

    // Add entities
    indiaPoints.forEach(p => addMapEntity(p, 'india', Cesium.Color.GOLD));
    globalPoints.forEach(p => addMapEntity(p, 'global', Cesium.Color.BLUEVIOLET));
    parkPoints.forEach(p => addMapEntity(p, 'parks', Cesium.Color.SPRINGGREEN));

    // Default start
    setTimeout(window.flyToIndia, 1000);
}

function addMapEntity(data, type, color) {
    cesiumViewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(data.pos[0], data.pos[1], 100),
        name: data.name,
        type: type,
        description: `<strong>${data.name}</strong><br>${data.note}`,
        point: {
            pixelSize: 10,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
        }
    });
}

function initMapControls() {
    const btns = document.querySelectorAll('.map-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-map-view');

            if (view === 'india') window.flyToIndia();
            if (view === 'global') window.flyToGlobal();
            if (view === 'parks') {
                cesiumViewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(72.5, 27.5, 200000)
                });
                showMapInsights('Bhadla Complex', 'Investigating curtailment trends in Western India.', '23.5%', '₹2.44');
            }
        });
    });

    // Click handler for entities
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas);
    handler.setInputAction((click) => {
        const picked = cesiumViewer.scene.pick(click.position);
        if (Cesium.defined(picked)) {
            const entity = picked.id;
            const name = entity.name;
            // Find data
            const all = [...[
                { name: 'Gujarat', rpo: '22.4%', tariff: '₹2.80', note: 'Global Solar Leader' },
                { name: 'Rajasthan', rpo: '26.2%', tariff: '₹2.40', note: 'Highest Installed Capacity' },
                { name: 'Bhadla Solar Park', rpo: 'N/A', tariff: '₹2.44', note: 'Critical Curtailment Monitoring' }
            ]];
            const found = all.find(x => x.name === name);
            if (found) {
                showMapInsights(found.name, found.note, found.rpo, found.tariff);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function showMapInsights(title, text, rpo, tariff) {
    document.querySelector('#map-info-panel h3').textContent = title;
    document.querySelector('#map-insight-text').textContent = text;
    document.getElementById('i-rpo').textContent = rpo || '--';
    document.getElementById('i-tariff').textContent = tariff || '--';
}
