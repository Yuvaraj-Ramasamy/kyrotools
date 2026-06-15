// ==========================================
// QUOTATION BUILDER & SHARE LOGIC
// ==========================================

// State Variables
let invoiceItems = [
    { id: 1, desc: 'Enterprise Cloud Architecture Strategy', qty: 5, rate: 12000, tax: 18 }
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
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + 30);
    
    document.getElementById('quote-date').value = today.toISOString().substring(0, 10);
    document.getElementById('quote-validity').value = validityDate.toISOString().substring(0, 10);

    // Initial Load - Check for shared state in hash
    loadSharedState();

    // Initial Render & Calculations
    renderItems();
    syncFormToPreview();
    initQuotationListeners();
    initFAQAccordion();
});

/**
 * Syncs simple inputs to preview elements
 */
function syncFormToPreview() {
    const currency = document.getElementById('quote-currency').value;
    const symbol = currencySymbols[currency] || '$';

    const textBinds = {
        'quote-number': 'preview-quote-number',
        'sender-name': 'preview-sender-name',
        'sender-address': 'preview-sender-address',
        'client-name': 'preview-client-name',
        'client-address': 'preview-client-address',
        'quote-terms': 'preview-terms'
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

    document.getElementById('preview-date-issued').innerText = formatDate(document.getElementById('quote-date').value);
    document.getElementById('preview-date-validity').innerText = formatDate(document.getElementById('quote-validity').value);
}

/**
 * Sets up listeners for user actions
 */
function initQuotationListeners() {
    // Forms change listeners
    const inputs = ['quote-number', 'sender-name', 'sender-address', 'client-name', 'client-address', 'quote-terms', 'quote-date', 'quote-validity', 'quote-currency', 'tax-type', 'discount-val'];
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
        if (window.incrementUsageStat) {
            incrementUsageStat('quotations_created');
        }
        window.print();
    });

    // Share Button
    document.getElementById('btn-share').addEventListener('click', () => {
        generateShareLink();
    });

    // Toggle Validity Date Checkbox
    const toggleValidity = document.getElementById('toggle-validity-date');
    if (toggleValidity) {
        const handleValidityToggle = () => {
            const validityInput = document.getElementById('quote-validity');
            const previewValidityBlock = document.getElementById('preview-validity-block');
            if (toggleValidity.checked) {
                validityInput.disabled = false;
                previewValidityBlock.style.display = 'block';
            } else {
                validityInput.disabled = true;
                previewValidityBlock.style.display = 'none';
            }
        };
        toggleValidity.addEventListener('change', handleValidityToggle);
        handleValidityToggle(); // Run initial state check
    }
}

/**
 * Renders lists of estimation rows
 */
function renderItems() {
    const listContainer = document.getElementById('item-list-container');
    const previewBody = document.getElementById('preview-table-body');
    const currency = document.getElementById('quote-currency').value;
    const symbol = currencySymbols[currency] || '$';

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
        previewBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No items. Add one above.</td></tr>`;
        return;
    }

    invoiceItems.forEach((item, index) => {
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

    // Attach row events
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
 * Compute totals & tax split
 */
function calculateTotals() {
    const currency = document.getElementById('quote-currency').value;
    const symbol = currencySymbols[currency] || '$';
    const discountPercent = parseFloat(document.getElementById('discount-val').value) || 0;
    const taxSplit = document.getElementById('tax-type').value;

    let subtotal = 0;
    let totalTax = 0;
    
    invoiceItems.forEach(item => {
        const lineVal = item.qty * item.rate;
        subtotal += lineVal;
        
        const lineTaxAmount = lineVal * (item.tax / 100);
        totalTax += lineTaxAmount;
    });

    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = (subtotal - discountAmount) + totalTax;

    const format = (val) => symbol + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
 * Encodes all inputs to Base64 hash for quote sharing
 */
function generateShareLink() {
    try {
        const data = {
            num: document.getElementById('quote-number').value,
            cur: document.getElementById('quote-currency').value,
            date: document.getElementById('quote-date').value,
            valid: document.getElementById('quote-validity').value,
            sName: document.getElementById('sender-name').value,
            sAddr: document.getElementById('sender-address').value,
            cName: document.getElementById('client-name').value,
            cAddr: document.getElementById('client-address').value,
            items: invoiceItems,
            disc: document.getElementById('discount-val').value,
            taxT: document.getElementById('tax-type').value,
            terms: document.getElementById('quote-terms').value
        };

        const jsonStr = JSON.stringify(data);
        const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
        const shareUrl = window.location.origin + window.location.pathname + '#q=' + base64Str;

        navigator.clipboard.writeText(shareUrl).then(() => {
            const shareBtn = document.getElementById('btn-share');
            const originalContent = shareBtn.innerHTML;
            
            shareBtn.innerHTML = `<i data-lucide="check"></i> Copied!`;
            if (window.lucide) window.lucide.createIcons();

            setTimeout(() => {
                shareBtn.innerHTML = originalContent;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
            
            if (window.incrementUsageStat) {
                incrementUsageStat('quotations_created');
            }
        });
    } catch (e) {
        console.error('Failed to generate share link', e);
        alert('Could not generate share link.');
    }
}

/**
 * Checks for hash link parameters on load
 */
function loadSharedState() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#q=')) {
        try {
            const base64Str = hash.substring(3);
            const decodedJson = decodeURIComponent(escape(atob(base64Str)));
            const data = JSON.parse(decodedJson);

            // Populate forms
            document.getElementById('quote-number').value = data.num || '';
            document.getElementById('quote-currency').value = data.cur || 'INR';
            document.getElementById('quote-date').value = data.date || '';
            document.getElementById('quote-validity').value = data.valid || '';
            document.getElementById('sender-name').value = data.sName || '';
            document.getElementById('sender-address').value = data.sAddr || '';
            document.getElementById('client-name').value = data.cName || '';
            document.getElementById('client-address').value = data.cAddr || '';
            document.getElementById('discount-val').value = data.disc || '0';
            document.getElementById('tax-type').value = data.taxT || 'cgst-sgst';
            document.getElementById('quote-terms').value = data.terms || '';

            if (data.items && Array.isArray(data.items)) {
                invoiceItems = data.items;
            }
        } catch (e) {
            console.error('Failed to parse sharing URL hash state', e);
        }
    }
}

/**
 * FAQ Accordion Toggles
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
