// ==========================================
// INVOICE BUILDER LOGIC
// ==========================================

// State Variables
let invoiceItems = [
    { id: 1, desc: 'Premium SaaS UI/UX Development', qty: 1, rate: 45000, tax: 18 }
];
let logoBase64 = null;
const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: '$',
    CAD: '$'
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Setup Default Dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 15);
    
    document.getElementById('inv-date').value = today.toISOString().substring(0, 10);
    document.getElementById('inv-due').value = dueDate.toISOString().substring(0, 10);

    // Initial Render & Calculations
    renderItems();
    syncFormToPreview();
    initInvoiceListeners();
    initFAQAccordion();
});

/**
 * Syncs simple inputs to preview elements
 */
function syncFormToPreview() {
    const currency = document.getElementById('inv-currency').value;
    const symbol = currencySymbols[currency] || '$';

    const textBinds = {
        'inv-number': 'preview-inv-number',
        'sender-name': 'preview-sender-name',
        'sender-address': 'preview-sender-address',
        'client-name': 'preview-client-name',
        'client-address': 'preview-client-address',
        'inv-notes': 'preview-notes'
    };

    Object.keys(textBinds).forEach(inputId => {
        const inputEl = document.getElementById(inputId);
        const previewEl = document.getElementById(textBinds[inputId]);
        if (inputEl && previewEl) {
            previewEl.innerText = inputEl.value;
        }
    });

    // Dates formatting
    const formatDate = (val) => {
        if (!val) return '—';
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    document.getElementById('preview-date-issued').innerText = formatDate(document.getElementById('inv-date').value);
    document.getElementById('preview-date-due').innerText = formatDate(document.getElementById('inv-due').value);
}

/**
 * Hooks up event listeners for input fields, buttons, and dropzones
 */
function initInvoiceListeners() {
    // Forms change listeners
    const inputs = ['inv-number', 'sender-name', 'sender-address', 'client-name', 'client-address', 'inv-notes', 'inv-date', 'inv-due', 'inv-currency', 'tax-type', 'discount-val'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                syncFormToPreview();
                calculateTotals();
            });
            el.addEventListener('change', () => {
                syncFormToPreview();
                calculateTotals();
            });
        }
    });

    // Add item click
    document.getElementById('add-item-btn').addEventListener('click', () => {
        const newId = invoiceItems.length > 0 ? Math.max(...invoiceItems.map(i => i.id)) + 1 : 1;
        invoiceItems.push({
            id: newId,
            desc: '',
            qty: 1,
            rate: 0,
            tax: 18
        });
        renderItems();
        calculateTotals();
    });

    // Template selections
    const templateButtons = document.querySelectorAll('.template-btn');
    const previewBox = document.getElementById('invoice-preview');
    
    templateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            templateButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Remove previous templates classes
            previewBox.className = 'invoice-preview-box';
            
            const template = btn.getAttribute('data-template');
            previewBox.classList.add(`template-${template}`);
        });
    });

    // Drag and Drop Logo
    const dropzone = document.getElementById('logo-dropzone');
    const logoInput = document.getElementById('logo-input');
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    const badge = document.getElementById('logo-preview-badge');

    const handleLogoFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoBase64 = e.target.result;
                document.getElementById('preview-logo-container').innerHTML = `<img src="${logoBase64}" class="invoice-logo-preview" alt="Company Logo">`;
                dropzone.style.display = 'none';
                badge.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    };

    logoInput.addEventListener('change', (e) => {
        handleLogoFile(e.target.files[0]);
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleLogoFile(e.dataTransfer.files[0]);
        }
    });

    removeLogoBtn.addEventListener('click', () => {
        logoBase64 = null;
        document.getElementById('preview-logo-container').innerHTML = `<div class="invoice-logo-placeholder">Upload Logo</div>`;
        dropzone.style.display = 'block';
        badge.style.display = 'none';
        logoInput.value = '';
    });

    // Print Button
    document.getElementById('btn-print').addEventListener('click', () => {
        // Increment statistic counter
        if (window.incrementUsageStat) {
            incrementUsageStat('invoices_created');
        }
        window.print();
    });

    // Email Modal Elements
    const emailBtn = document.getElementById('btn-email');
    const emailModal = document.getElementById('email-modal');
    const emailCancel = document.getElementById('email-cancel-btn');
    const emailForm = document.getElementById('email-form');

    emailBtn.addEventListener('click', () => {
        const clientEmail = document.getElementById('client-name').value || 'Client';
        document.getElementById('email-subject').value = `Invoice from ${document.getElementById('sender-name').value || 'Kyro'}`;
        emailModal.classList.add('active');
    });

    const closeModal = () => {
        emailModal.classList.remove('active');
    };

    emailCancel.addEventListener('click', closeModal);
    
    // Close modal on background click
    emailModal.addEventListener('click', (e) => {
        if (e.target === emailModal) closeModal();
    });

    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('email-submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="spinner"></div>`;

        // Simulate SMTP network delivery delay
        setTimeout(() => {
            alert(`Invoice ${document.getElementById('inv-number').value} successfully emailed to ${document.getElementById('email-to').value}!`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            emailForm.reset();
            closeModal();
            if (window.incrementUsageStat) {
                incrementUsageStat('invoices_created');
            }
        }, 1500);
    });

    // Toggle Due Date Checkbox
    const toggleDue = document.getElementById('toggle-due-date');
    if (toggleDue) {
        const handleDueToggle = () => {
            const dueInput = document.getElementById('inv-due');
            const previewDueBlock = document.getElementById('preview-due-block');
            if (toggleDue.checked) {
                dueInput.disabled = false;
                previewDueBlock.style.display = 'block';
            } else {
                dueInput.disabled = true;
                previewDueBlock.style.display = 'none';
            }
        };
        toggleDue.addEventListener('change', handleDueToggle);
        handleDueToggle(); // Run initial state check
    }
}

/**
 * Dynamic lines renderer
 */
function renderItems() {
    const listContainer = document.getElementById('item-list-container');
    const previewBody = document.getElementById('preview-table-body');
    const currency = document.getElementById('inv-currency').value;
    const symbol = currencySymbols[currency] || '$';

    // Keep the headers
    listContainer.innerHTML = `
        <div class="item-list-header">
            <div>Description</div>
            <div>Qty</div>
            <div>Rate</div>
            <div>Tax (GST %)</div>
            <div></div>
        </div>
    `;
    previewBody.innerHTML = '';

    if (invoiceItems.length === 0) {
        previewBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No items added. Add items above to begin.</td></tr>`;
        return;
    }

    invoiceItems.forEach((item, index) => {
        // 1. Build Builder Interface item row
        const row = document.createElement('div');
        row.className = 'item-list-row';
        row.innerHTML = `
            <input type="text" class="item-desc" data-index="${index}" placeholder="Description" value="${item.desc}">
            <input type="number" class="item-qty" data-index="${index}" min="1" value="${item.qty}">
            <input type="number" class="item-rate" data-index="${index}" min="0" step="0.01" value="${item.rate}">
            <select class="item-tax" data-index="${index}">
                <option value="0" ${item.tax === 0 ? 'selected' : ''}>0%</option>
                <option value="3" ${item.tax === 3 ? 'selected' : ''}>3%</option>
                <option value="5" ${item.tax === 5 ? 'selected' : ''}>5%</option>
                <option value="12" ${item.tax === 12 ? 'selected' : ''}>12%</option>
                <option value="18" ${item.tax === 18 ? 'selected' : ''}>18%</option>
                <option value="28" ${item.tax === 28 ? 'selected' : ''}>28%</option>
            </select>
            <button class="btn btn-danger remove-item-btn" data-index="${index}" style="padding: 6px 10px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        listContainer.appendChild(row);

        // 2. Build Preview Row
        const lineTotal = item.qty * item.rate;
        const previewRow = document.createElement('tr');
        previewRow.innerHTML = `
            <td style="padding: 10px 12px; font-weight: 500;">${item.desc || 'Untitled Item'}</td>
            <td style="padding: 10px 12px; text-align: center;">${item.qty}</td>
            <td style="padding: 10px 12px; text-align: right;">${symbol}${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 12px; text-align: right;">${item.tax}%</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600;">${symbol}${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        previewBody.appendChild(previewRow);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Attach Row Event Listeners
    document.querySelectorAll('.item-desc').forEach(el => {
        el.addEventListener('input', (e) => {
            const idx = e.target.getAttribute('data-index');
            invoiceItems[idx].desc = e.target.value;
            syncFormToPreview();
        });
    });

    const numberInputs = ['.item-qty', '.item-rate', '.item-tax'];
    numberInputs.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('input', (e) => {
                const idx = e.target.getAttribute('data-index');
                const val = parseFloat(e.target.value) || 0;
                
                if (selector === '.item-qty') invoiceItems[idx].qty = Math.max(1, val);
                if (selector === '.item-rate') invoiceItems[idx].rate = Math.max(0, val);
                if (selector === '.item-tax') invoiceItems[idx].tax = val;
                
                renderItems();
                calculateTotals();
            });
        });
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            invoiceItems.splice(idx, 1);
            renderItems();
            calculateTotals();
        });
    });
}

/**
 * Core mathematical engine
 */
function calculateTotals() {
    const currency = document.getElementById('inv-currency').value;
    const symbol = currencySymbols[currency] || '$';
    const discountPercent = parseFloat(document.getElementById('discount-val').value) || 0;
    const taxSplit = document.getElementById('tax-type').value;

    let subtotal = 0;
    let totalTax = 0;
    
    invoiceItems.forEach(item => {
        const lineVal = item.qty * item.rate;
        subtotal += lineVal;
        
        // Calculate line tax amount
        const lineTaxAmount = lineVal * (item.tax / 100);
        totalTax += lineTaxAmount;
    });

    // Discount calculations
    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = (subtotal - discountAmount) + totalTax;

    // Format utility
    const format = (val) => symbol + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Update displays
    document.getElementById('preview-subtotal').innerText = format(subtotal);
    
    if (discountAmount > 0) {
        document.getElementById('row-discount').style.display = 'flex';
        document.getElementById('preview-discount').innerText = '-' + format(discountAmount);
    } else {
        document.getElementById('row-discount').style.display = 'none';
    }

    if (taxSplit === 'cgst-sgst') {
        document.getElementById('row-cgst').style.display = 'flex';
        document.getElementById('row-sgst').style.display = 'flex';
        document.getElementById('row-igst').style.display = 'none';

        document.getElementById('preview-cgst').innerText = format(totalTax / 2);
        document.getElementById('preview-sgst').innerText = format(totalTax / 2);
    } else {
        document.getElementById('row-cgst').style.display = 'none';
        document.getElementById('row-sgst').style.display = 'none';
        document.getElementById('row-igst').style.display = 'flex';

        document.getElementById('preview-igst').innerText = format(totalTax);
    }

    document.getElementById('preview-total').innerText = format(totalAmount);
}

/**
 * Initialise SEO FAQ Accordions
 */
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}
