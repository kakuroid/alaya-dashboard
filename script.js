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
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const caseList = document.getElementById('case-list');
    
    cases.forEach(caseItem => {
        const item = document.createElement('div');
        item.classList.add('case-item');
        item.innerHTML = `
            <div class="case-info">
                <h4>${caseItem.title}</h4>
                <p>${caseItem.court} | Issue: ${caseItem.issue}</p>
            </div>
            <div class="case-status">
                <span class="status-badge ${caseItem.statusClass}">${caseItem.status}</span>
            </div>
        `;
        caseList.appendChild(item);
    });
});
