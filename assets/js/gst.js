// ==========================================
// GST CALCULATOR MATH LOGIC
// ==========================================

// State Variables
let gstMode = 'exclusive'; // exclusive or inclusive
let gstRate = 18;
let inputAmount = 10000;
let statsDebounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    initGstListeners();
    calculateGst();
    initFAQAccordion();
});

/**
 * Attaches event listeners for controls
 */
function initGstListeners() {
    const amountInput = document.getElementById('gst-amount');
    const customRateInput = document.getElementById('gst-custom-rate');
    const rateBtns = document.querySelectorAll('.gst-rate-btn');
    const modeExclusiveBtn = document.getElementById('mode-exclusive');
    const modeInclusiveBtn = document.getElementById('mode-inclusive');

    // Amount Input Listener
    amountInput.addEventListener('input', (e) => {
        inputAmount = parseFloat(e.target.value) || 0;
        calculateGst();
        debounceStatsIncrement();
    });

    // Mode Toggle Buttons
    modeExclusiveBtn.addEventListener('click', () => {
        gstMode = 'exclusive';
        modeExclusiveBtn.className = 'btn btn-primary';
        modeInclusiveBtn.className = 'btn btn-secondary';
        
        document.getElementById('amount-label').innerText = 'Amount (exclusive of tax)';
        document.getElementById('label-base').innerText = 'Base Amount (Net):';
        document.getElementById('label-total').innerText = 'Total Bill Value (Gross):';
        
        calculateGst();
        debounceStatsIncrement();
    });

    modeInclusiveBtn.addEventListener('click', () => {
        gstMode = 'inclusive';
        modeExclusiveBtn.className = 'btn btn-secondary';
        modeInclusiveBtn.className = 'btn btn-primary';
        
        document.getElementById('amount-label').innerText = 'Amount (inclusive of tax)';
        document.getElementById('label-base').innerText = 'Post-Tax Base Amount (Net):';
        document.getElementById('label-total').innerText = 'Pre-Tax Bill Value (Gross):';
        
        calculateGst();
        debounceStatsIncrement();
    });

    // Rate Grid Selector
    rateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            rateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customRateInput.value = ''; // Clear custom rate field
            
            gstRate = parseFloat(btn.getAttribute('data-rate'));
            calculateGst();
            debounceStatsIncrement();
        });
    });

    // Custom Rate Input
    customRateInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 0) {
            // Uncheck standard rate grid buttons
            rateBtns.forEach(b => b.classList.remove('active'));
            gstRate = val;
            calculateGst();
            debounceStatsIncrement();
        } else if (e.target.value === '') {
            // Default back to standard active button rate if custom is cleared
            const activeBtn = document.querySelector('.gst-rate-btn.active');
            if (activeBtn) {
                gstRate = parseFloat(activeBtn.getAttribute('data-rate'));
                calculateGst();
            }
        }
    });
}

/**
 * Performs core GST calculations based on mode
 */
function calculateGst() {
    let baseAmount = 0;
    let totalGst = 0;
    let finalAmount = 0;

    if (gstMode === 'exclusive') {
        baseAmount = inputAmount;
        totalGst = baseAmount * (gstRate / 100);
        finalAmount = baseAmount + totalGst;
    } else {
        finalAmount = inputAmount;
        baseAmount = finalAmount / (1 + (gstRate / 100));
        totalGst = finalAmount - baseAmount;
    }

    // Tax Splits
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const igst = totalGst;

    // UI Updates
    const format = (val) => '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('val-base').innerText = format(baseAmount);
    document.getElementById('val-cgst').innerText = format(cgst);
    document.getElementById('val-sgst').innerText = format(sgst);
    document.getElementById('val-igst').innerText = format(igst);
    document.getElementById('val-tax').innerText = format(totalGst);
    document.getElementById('val-total').innerText = format(finalAmount);
}

/**
 * Debounces the localStorage statistics logging
 */
function debounceStatsIncrement() {
    clearTimeout(statsDebounceTimer);
    statsDebounceTimer = setTimeout(() => {
        if (window.incrementUsageStat) {
            incrementUsageStat('gst_calculations');
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
