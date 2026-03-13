const cases = [
    {
        title: "Parampujya Solar Energy Pvt. Ltd. vs. CERC",
        court: "Supreme Court",
        issue: "Change in Law compensation - Carrying cost",
        status: "Pending",
        statusClass: "status-pending"
    },
    {
        title: "Deviation Settlement Mechanism (DSM) Regulations Challenge",
        court: "Delhi High Court",
        issue: "Volume limits and penal charges on renewable generators",
        status: "Pending",
        statusClass: "status-pending"
    },
    {
        title: "Green Energy Open Access Rules Implementation",
        court: "APTEL",
        issue: "State commissions delaying adoption of central rules",
        status: "Resolved",
        statusClass: "status-resolved"
    },
    {
        title: "Renewable Purchase Obligation (RPO) Compliance",
        court: "Supreme Court",
        issue: "Enforcement of RPO targets on state distribution companies",
        status: "Pending",
        statusClass: "status-pending"
    },
    {
        title: "Adani Green Energy vs. TNERC",
        court: "Madras High Court",
        issue: "Curtailment of wind energy - Compensation claims",
        status: "Pending",
        statusClass: "status-pending"
    }
];

const regulations = [
    {
        title: "Green Energy Open Access (Amendment) Rules, 2024",
        court: "Ministry of Power",
        issue: "Reduction of load requirement for open access",
        status: "Active",
        statusClass: "status-resolved"
    },
    {
        title: "CERC (Connectivity and General Network Access) Regulations",
        court: "CERC",
        issue: "Simplified grid access for renewable projects",
        status: "Under Review",
        statusClass: "status-pending"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('#nav-menu li');
    const sections = document.querySelectorAll('.view-section');
    const recentCaseList = document.getElementById('recent-case-list');
    const allCaseList = document.getElementById('all-case-list');
    const regulationList = document.getElementById('regulation-list');

    // Tab Switching Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            
            // Update Active Link
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Active Section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Render Cases
    function renderList(data, container) {
        if (!container) return;
        container.innerHTML = '';
        data.forEach(itemData => {
            const item = document.createElement('div');
            item.classList.add('case-item');
            item.innerHTML = `
                <div class="case-info">
                    <h4>${itemData.title}</h4>
                    <p>${itemData.court} | Issue: ${itemData.issue}</p>
                </div>
                <div class="case-status">
                    <span class="status-badge ${itemData.statusClass}">${itemData.status}</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderList(cases.slice(0, 3), recentCaseList);
    renderList(cases, allCaseList);
    renderList(regulations, regulationList);
});

