
// Data Management
const DATA_KEY = 'income-tracker-data';
let incomeData = [];
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('income-date').valueAsDate = new Date();
    setupEventListeners();
    updateSummary();
    initCharts();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('salary').addEventListener('input', updateAutoTotal);
    document.getElementById('bonus').addEventListener('input', updateAutoTotal);
    document.getElementById('special').addEventListener('input', updateAutoTotal);
    document.getElementById('tip').addEventListener('input', updateAutoTotal);

    document.getElementById('search-input').addEventListener('input', filterHistory);
    document.getElementById('sort-select').addEventListener('change', filterHistory);
}

// Auto Total Calculator
function updateAutoTotal() {
    const salary = parseFloat(document.getElementById('salary').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const special = parseFloat(document.getElementById('special').value) || 0;
    const tip = parseFloat(document.getElementById('tip').value) || 0;
    const total = salary + bonus + special + tip;
    document.getElementById('auto-total').textContent = formatCurrency(total);
}

// Add Income
function addIncome(e) {
    e.preventDefault();

    const date = document.getElementById('income-date').value;
    const salary = parseFloat(document.getElementById('salary').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const special = parseFloat(document.getElementById('special').value) || 0;
    const tip = parseFloat(document.getElementById('tip').value) || 0;
    const notes = document.getElementById('notes').value;

    if (salary + bonus + special + tip === 0) {
        showToast('ກະລຸນາໃສ່ຈຳນວນເງິນ');
        return;
    }

    const income = {
        id: Date.now(),
        date,
        salary,
        bonus,
        special,
        tip,
        total: salary + bonus + special + tip,
        notes,
        createdAt: new Date().toISOString()
    };

    incomeData.push(income);
    saveData();
    updateSummary();
    document.getElementById('income-form').reset();
    document.getElementById('income-date').valueAsDate = new Date();
    showToast('ບັນທຶກຜ້ວາສະເລັບແລ້ວ!');
    switchView('home-view');
}

// Update Summary
function updateSummary() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear();

    const todayIncome = incomeData
        .filter(item => item.date === today)
        .reduce((sum, item) => sum + item.total, 0);

    const monthIncome = incomeData
        .filter(item => item.date.startsWith(currentMonth))
        .reduce((sum, item) => sum + item.total, 0);

    const yearIncome = incomeData
        .filter(item => item.date.startsWith(currentYear.toString()))
        .reduce((sum, item) => sum + item.total, 0);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0);

    document.getElementById('today-income').textContent = formatCurrency(todayIncome);
    document.getElementById('month-income').textContent = formatCurrency(monthIncome);
    document.getElementById('year-income').textContent = formatCurrency(yearIncome);
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);

    updateCharts();
    updateReceipt();
    updateMonthlySummary();
}

// Update Receipt
function updateReceipt() {
    const receipts = {};

    incomeData.forEach(item => {
        if (!receipts[item.date]) {
            receipts[item.date] = {
                date: item.date,
                salary: 0,
                bonus: 0,
                special: 0,
                tip: 0,
                total: 0
            };
        }
        receipts[item.date].salary += item.salary;
        receipts[item.date].bonus += item.bonus;
        receipts[item.date].special += item.special;
        receipts[item.date].tip += item.tip;
        receipts[item.date].total += item.total;
    });

    const receiptHTML = Object.values(receipts)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(receipt => `
            <div class="card" style="border-left: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <strong>${new Date(receipt.date).toLocaleDateString('lo-LA')}</strong>
                    <span style="font-size: 18px; font-weight: bold; color: var(--success);">${formatCurrency(receipt.total)}</span>
                </div>
                <table style="font-size: 12px;">
                    <tr>
                        <td><span class="badge badge-primary">💵 Salary</span></td>
                        <td>${formatCurrency(receipt.salary)}</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-success">⭐ Bonus</span></td>
                        <td>${formatCurrency(receipt.bonus)}</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-warning">🎁 Special</span></td>
                        <td>${formatCurrency(receipt.special)}</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-danger">💸 Tip</span></td>
                        <td>${formatCurrency(receipt.tip)}</td>
                    </tr>
                </table>
            </div>
        `).join('');

    document.getElementById('receipt-container').innerHTML = receiptHTML || '<p style="text-align: center; opacity: 0.5;">ຍັງບໍ່ມີລາຍຮັບ</p>';
}

// Update Monthly Summary
function updateMonthlySummary() {
    const monthlySummary = {};

    incomeData.forEach(item => {
        const month = item.date.slice(0, 7);
        if (!monthlySummary[month]) {
            monthlySummary[month] = 0;
        }
        monthlySummary[month] += item.total;
    });

    const rows = Object.entries(monthlySummary)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, total]) => `
            <tr>
                <td>${month}</td>
                <td>${formatCurrency(total)}</td>
                <td><span class="badge badge-primary">${(total / getTotalIncome() * 100 || 0).toFixed(1)}%</span></td>
            </tr>
        `).join('');

    document.getElementById('monthly-summary-table').innerHTML = rows || '<tr><td colspan="3" style="text-align: center; padding: 20px;">ຍັງບໍ່ມີລາຍຮັບ</td></tr>';
}

// Show History
function filterHistory() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const sort = document.getElementById('sort-select').value;

    let filtered = incomeData.filter(item => {
        return item.notes.toLowerCase().includes(search) || 
               item.date.includes(search) ||
               item.total.toString().includes(search);
    });

    if (sort === 'date-asc') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'date-desc') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'amount-desc') {
        filtered.sort((a, b) => b.total - a.total);
    }

    const historyHTML = filtered.map(item => `
        <div class="history-item">
            <div class="history-item-info">
                <div class="history-item-type">
                    ${item.salary > 0 ? '<i class="fas fa-money-bill icon-salary"></i> Salary ' : ''}
                    ${item.bonus > 0 ? '<i class="fas fa-star icon-bonus"></i> Bonus ' : ''}
                    ${item.special > 0 ? '<i class="fas fa-gift icon-special"></i> Special ' : ''}
                    ${item.tip > 0 ? '<i class="fas fa-hand-holding-usd icon-tip"></i> Tip ' : ''}
                </div>
                <div class="history-item-date">${new Date(item.date).toLocaleDateString('lo-LA')} ${item.notes ? '• ' + item.notes : ''}</div>
            </div>
            <div style="text-align: right;">
                <div class="history-item-amount">${formatCurrency(item.total)}</div>
                <div class="history-item-actions">
                    <button class="btn btn-small btn-secondary" onclick="editIncome(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteIncome(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('history-list').innerHTML = historyHTML || '<p style="text-align: center; opacity: 0.5; padding: 20px;">ບໍ່ພົບລາຍການທີ່ຄົ້ນຫາ</p>';
}

// Delete Income
function deleteIncome(id) {
    if (confirm('ທ່ານແນ່ໃຈບໍ້ວ່າຕ້ອງການລຶບລາຍການນີ້?')) {
        incomeData = incomeData.filter(item => item.id !== id);
        saveData();
        updateSummary();
        filterHistory();
        showToast('ລຶບສຳເລັບແລ້ວ');
    }
}

// Edit Income
function editIncome(id) {
    const item = incomeData.find(i => i.id === id);
    if (item) {
        document.getElementById('income-date').value = item.date;
        document.getElementById('salary').value = item.salary;
        document.getElementById('bonus').value = item.bonus;
        document.getElementById('special').value = item.special;
        document.getElementById('tip').value = item.tip;
        document.getElementById('notes').value = item.notes;
        updateAutoTotal();
        deleteIncome(id);
        switchView('add-view');
        showToast('ແກ້ໄຂລາຍການ');
    }
}

// Charts
function initCharts() {
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: getComputedStyle(document.body).color
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    color: getComputedStyle(document.body).color
                },
                grid: {
                    color: 'rgba(0,0,0,0.05)'
                }
            },
            x: {
                ticks: {
                    color: getComputedStyle(document.body).color
                },
                grid: {
                    color: 'rgba(0,0,0,0.05)'
                }
            }
        }
    };

    // Monthly Chart
    charts.monthly = new Chart(document.getElementById('monthlyChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'ລາຍໄດ້',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: chartConfig
    });

    // Pie Chart
    charts.pie = new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: {
            labels: ['💵 Salary', '⭐ Bonus', '🎁 Special', '💸 Tip'],
            datasets: [{
                data: [],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).color
                    }
                }
            }
        }
    });

    // Year Chart
    charts.year = new Chart(document.getElementById('yearChart'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'ລາຍໄດ້ຮາຍເດືອນ',
                data: [],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981']
            }]
        },
        options: chartConfig
    });
}

function updateCharts() {
    if (!charts.monthly) return;

    // Last 30 days
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
    }

    const dailyData = last30Days.map(date => {
        return incomeData
            .filter(item => item.date === date)
            .reduce((sum, item) => sum + item.total, 0);
    });

    charts.monthly.data.labels = last30Days.map(d => new Date(d).toLocaleDateString('lo-LA', { month: 'short', day: 'numeric' }));
    charts.monthly.data.datasets[0].data = dailyData;
    charts.monthly.update();

    // Pie Chart
    let totalSalary = 0, totalBonus = 0, totalSpecial = 0, totalTip = 0;
    incomeData.forEach(item => {
        totalSalary += item.salary;
        totalBonus += item.bonus;
        totalSpecial += item.special;
        totalTip += item.tip;
    });

    charts.pie.data.datasets[0].data = [totalSalary, totalBonus, totalSpecial, totalTip];
    charts.pie.update();

    // Year Chart
    const months = [];
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        months.push(new Date(monthStr).toLocaleDateString('lo-LA', { month: 'short' }));
        
        const total = incomeData
            .filter(item => item.date.startsWith(monthStr))
            .reduce((sum, item) => sum + item.total, 0);
        monthlyData.push(total);
    }

    charts.year.data.labels = months;
    charts.year.data.datasets[0].data = monthlyData;
    charts.year.update();
}

// Data Management
function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(incomeData));
}

function loadData() {
    const stored = localStorage.getItem(DATA_KEY);
    incomeData = stored ? JSON.parse(stored) : [];
}

function exportData() {
    const dataStr = JSON.stringify(incomeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `income-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('Export ສຳເລັບແລ້ວ');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('ທ່ານຕ້ອງການນໍາເຂົ້າ ' + data.length + ' ລາຍການບໍ?')) {
                incomeData = [...incomeData, ...data];
                saveData();
                updateSummary();
                showToast('Import ສຳເລັບແລ້ວ');
            }
        } catch (err) {
            showToast('ຂໍ້ຜິດພາດໃນການ import');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function deleteAllData() {
    if (confirm('ທ່ານແນ່ໃຈບໍ້ວ່າຕ້ອງການລຶບຂໍ້ມູນທັງໝົດ? ບໍ່ສາມາດກູ້ຄືນໄດ້')) {
        incomeData = [];
        saveData();
        updateSummary();
        showToast('ລຶບຂໍ້ມູນທັງໝົດ');
    }
}

function showDataModal() {
    switchView('data-view');
    updateDataPreview();
}

function updateDataPreview() {
    const preview = JSON.stringify(incomeData, null, 2).slice(0, 500);
    document.getElementById('data-preview').textContent = preview + (incomeData.length > 5 ? '\n...' : '');
}

// View Management
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    event?.target?.classList.add('active');

    if (viewId === 'history-view') {
        filterHistory();
    }
    if (viewId === 'summary-view') {
        updateMonthlySummary();
    }
}

// Theme
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
    if (charts.monthly) {
        updateCharts();
    }
}

// Load theme preference
if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Utilities
function formatCurrency(amount) {
    return new Intl.NumberFormat('lo-LA', {
        style: 'currency',
        currency: 'LAK',
        minimumFractionDigits: 0
    }).format(amount);
}

function getTotalIncome() {
    return incomeData.reduce((sum, item) => sum + item.total, 0);
}