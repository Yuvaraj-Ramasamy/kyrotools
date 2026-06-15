// ==========================================
// EMI LOAN CALCULATOR LOGIC
// ==========================================

// State Variables
let loanAmount = 1000000;
let annualRate = 8.5;
let loanTenure = 5;
let tenureType = 'years'; // years or months
let scheduleMode = 'yearly'; // yearly or monthly
let emiChart = null;
let statsDebounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    initEmiListeners();
    calculateEmi();
    initFAQAccordion();
});

/**
 * Binds input controls and slider sync listeners
 */
function initEmiListeners() {
    // 1. Sync Loan Amount Slider & Input
    const pRange = document.getElementById('emi-principal-range');
    const pInput = document.getElementById('emi-principal-input');
    const lblP = document.getElementById('lbl-principal');

    const updatePrincipal = (val) => {
        loanAmount = Math.max(50000, Math.min(10000000, val));
        pRange.value = loanAmount;
        pInput.value = loanAmount;
        lblP.innerText = '₹' + loanAmount.toLocaleString('en-IN');
        calculateEmi();
        debounceStatsIncrement();
    };

    pRange.addEventListener('input', (e) => updatePrincipal(parseInt(e.target.value)));
    pInput.addEventListener('input', (e) => updatePrincipal(parseInt(e.target.value) || 0));

    // 2. Sync Interest Rate Slider & Input
    const rRange = document.getElementById('emi-interest-range');
    const rInput = document.getElementById('emi-interest-input');
    const lblR = document.getElementById('lbl-interest');

    const updateInterest = (val) => {
        annualRate = Math.max(1, Math.min(25, val));
        rRange.value = annualRate;
        rInput.value = annualRate;
        lblR.innerText = annualRate.toFixed(1) + '%';
        calculateEmi();
        debounceStatsIncrement();
    };

    rRange.addEventListener('input', (e) => updateInterest(parseFloat(e.target.value)));
    rInput.addEventListener('input', (e) => updateInterest(parseFloat(e.target.value) || 0));

    // 3. Sync Tenure Slider, Input & Type
    const tRange = document.getElementById('emi-tenure-range');
    const tInput = document.getElementById('emi-tenure-input');
    const tType = document.getElementById('emi-tenure-type');
    const lblT = document.getElementById('lbl-tenure');

    const updateTenure = () => {
        let val = parseInt(tInput.value) || 0;
        tenureType = tType.value;

        if (tenureType === 'years') {
            tRange.min = 1;
            tRange.max = 30;
            loanTenure = Math.max(1, Math.min(30, val));
            lblT.innerText = loanTenure + ' Years';
        } else {
            tRange.min = 3;
            tRange.max = 360;
            loanTenure = Math.max(3, Math.min(360, val));
            lblT.innerText = loanTenure + ' Months';
        }

        tRange.value = loanTenure;
        tInput.value = loanTenure;
        calculateEmi();
        debounceStatsIncrement();
    };

    tRange.addEventListener('input', (e) => {
        tInput.value = e.target.value;
        updateTenure();
    });
    tInput.addEventListener('input', updateTenure);
    tType.addEventListener('change', () => {
        // Adapt input value on type change
        let val = parseInt(tInput.value) || 0;
        if (tType.value === 'years') {
            tInput.value = Math.max(1, Math.round(val / 12));
        } else {
            tInput.value = Math.max(3, val * 12);
        }
        updateTenure();
    });

    // 4. Amortization table switches
    const btnYearly = document.getElementById('sched-yearly');
    const btnMonthly = document.getElementById('sched-monthly');

    btnYearly.addEventListener('click', () => {
        scheduleMode = 'yearly';
        btnYearly.style.background = 'var(--bg-secondary)';
        btnYearly.style.color = 'var(--text-primary)';
        btnMonthly.style.background = 'none';
        btnMonthly.style.color = 'var(--text-secondary)';
        document.getElementById('th-period').innerText = 'Year';
        calculateEmi();
    });

    btnMonthly.addEventListener('click', () => {
        scheduleMode = 'monthly';
        btnMonthly.style.background = 'var(--bg-secondary)';
        btnMonthly.style.color = 'var(--text-primary)';
        btnYearly.style.background = 'none';
        btnYearly.style.color = 'var(--text-secondary)';
        document.getElementById('th-period').innerText = 'Month';
        calculateEmi();
    });

    // 5. CSV Export Trigger
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        exportAmortizationToCSV();
    });
}

/**
 * Calculates core parameters and renders elements
 */
function calculateEmi() {
    const totalMonths = tenureType === 'years' ? loanTenure * 12 : loanTenure;
    const monthlyRate = annualRate / 12 / 100;

    let emi = 0;
    if (monthlyRate === 0) {
        emi = loanAmount / totalMonths;
    } else {
        emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalRepayment = emi * totalMonths;
    const totalInterest = totalRepayment - loanAmount;

    // UI Updates
    const format = (val) => '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('val-emi').innerText = format(emi);
    document.getElementById('val-total-interest').innerText = format(totalInterest);
    document.getElementById('val-total-repayment').innerText = format(totalRepayment);

    // Refresh Donut Graph
    updateDonutChart(loanAmount, totalInterest);

    // Render Table
    renderAmortizationTable(emi, totalMonths, monthlyRate);
}

/**
 * Dynamic donut chart wrapper using Chart.js
 */
function updateDonutChart(principal, interest) {
    const canvas = document.getElementById('emi-donut-chart');
    if (!canvas) return;

    if (emiChart) {
        emiChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Read active text colors variables
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const labelColor = isDark ? '#9ca3af' : '#475569';
    
    emiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: ['#6366f1', '#ec4899'],
                hoverBackgroundColor: ['#4f46e5', '#db2777'],
                borderColor: isDark ? '#111827' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: labelColor,
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '500'
                        },
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            return context.label + ': ₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Global variable to export CSV content easily
let amortizationData = [];

/**
 * Builds schedule list items based on active table mode
 */
function renderAmortizationTable(emi, totalMonths, monthlyRate) {
    const tbody = document.getElementById('amortization-table-body');
    tbody.innerHTML = '';
    
    let balance = loanAmount;
    let monthlyRecords = [];
    amortizationData = [];

    // 1. Calculate raw monthly records
    for (let i = 1; i <= totalMonths; i++) {
        const interestPaid = balance * monthlyRate;
        const principalPaid = emi - interestPaid;
        balance = Math.max(0, balance - principalPaid);
        
        monthlyRecords.push({
            period: i,
            principalPaid: principalPaid,
            interestPaid: interestPaid,
            totalPayment: emi,
            balance: balance
        });
    }

    // 2. Aggregate depending on mode
    if (scheduleMode === 'yearly') {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        let yearNum = 1;

        monthlyRecords.forEach((record, index) => {
            yearlyPrincipal += record.principalPaid;
            yearlyInterest += record.interestPaid;

            // Group every 12 months or at the final payment
            if ((index + 1) % 12 === 0 || (index + 1) === totalMonths) {
                amortizationData.push({
                    period: yearNum,
                    principalPaid: yearlyPrincipal,
                    interestPaid: yearlyInterest,
                    totalPayment: yearlyPrincipal + yearlyInterest,
                    balance: record.balance
                });
                
                // Reset accumulators
                yearlyPrincipal = 0;
                yearlyInterest = 0;
                yearNum++;
            }
        });
    } else {
        amortizationData = monthlyRecords;
    }

    // 3. Render compiled rows to DOM
    const format = (val) => '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    amortizationData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${scheduleMode === 'yearly' ? 'Year ' + row.period : 'Month ' + row.period}</td>
            <td>${format(row.principalPaid)}</td>
            <td style="color: var(--secondary);">${format(row.interestPaid)}</td>
            <td style="font-weight: 500;">${format(row.totalPayment)}</td>
            <td>${format(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Downloads Amortization data as CSV
 */
function exportAmortizationToCSV() {
    if (amortizationData.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Headers
    const headers = [scheduleMode === 'yearly' ? 'Year' : 'Month', 'Principal Paid (INR)', 'Interest Paid (INR)', 'Total Payment (INR)', 'Remaining Balance (INR)'];
    csvContent += headers.join(',') + '\r\n';

    // Rows
    amortizationData.forEach(row => {
        const line = [
            row.period,
            row.principalPaid.toFixed(2),
            row.interestPaid.toFixed(2),
            row.totalPayment.toFixed(2),
            row.balance.toFixed(2)
        ];
        csvContent += line.join(',') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kyro_Amortization_Schedule_${scheduleMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.incrementUsageStat) {
        incrementUsageStat('emi_calculations');
    }
}

/**
 * Debounces localStorage stats logging
 */
function debounceStatsIncrement() {
    clearTimeout(statsDebounceTimer);
    statsDebounceTimer = setTimeout(() => {
        if (window.incrementUsageStat) {
            incrementUsageStat('emi_calculations');
        }
    }, 2000);
}

/**
 * FAQ Accordion Toggle
 */
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}
