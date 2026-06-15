// ==========================================
// THEME & LOGIC CONTROLLER FOR KYRO BUSINESS TOOLS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme
    initTheme();

    // Initialize Scroll Listener for Sticky Header
    initScrollListener();

    // Initialize Stats Counters
    initStats();

    // Create Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

/**
 * Initializes and manages dark/light mode themes
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('kyro-theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('kyro-theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
}

/**
 * Updates the theme switcher button icon (Sun or Moon)
 */
function updateThemeIcon(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    
    if (theme === 'dark') {
        toggleBtn.innerHTML = `<i data-lucide="sun"></i>`;
    } else {
        toggleBtn.innerHTML = `<i data-lucide="moon"></i>`;
    }
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Monitors scroll height to styling sticky headers
 */
function initScrollListener() {
    const handleScroll = () => {
        if (window.scrollY > 20) {
            document.body.setAttribute('data-scrolled', 'true');
        } else {
            document.body.removeAttribute('data-scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once in case already scrolled
}

/**
 * Handles localStorage usage counters across all tools
 */
const STATS_KEY = 'kyro-business-stats';

const defaultStats = {
    invoices_created: 0,
    quotations_created: 0,
    gst_calculations: 0,
    emi_calculations: 0,
    pdf_actions: 0
};

function getStats() {
    try {
        const stats = localStorage.getItem(STATS_KEY);
        return stats ? { ...defaultStats, ...JSON.parse(stats) } : { ...defaultStats };
    } catch (e) {
        return { ...defaultStats };
    }
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function incrementUsageStat(key) {
    const stats = getStats();
    if (key in stats) {
        stats[key]++;
        saveStats(stats);
        updateDashboardCounters();
    }
}

function initStats() {
    // Check if storage has stats; if not, write defaults
    if (!localStorage.getItem(STATS_KEY)) {
        saveStats(defaultStats);
    }
    updateDashboardCounters();
}

function updateDashboardCounters() {
    const stats = getStats();
    
    // Attempt to update elements on dashboard if they exist
    const elements = {
        'stat-invoice': stats.invoices_created,
        'stat-quotation': stats.quotations_created,
        'stat-gst': stats.gst_calculations,
        'stat-emi': stats.emi_calculations,
        'stat-pdf': stats.pdf_actions
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = elements[id];
        }
    });
}
