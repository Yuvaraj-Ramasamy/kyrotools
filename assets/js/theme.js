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

    // Initialize Hamburger Mobile Menu
    initMobileMenu();

    // Create Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

/**
 * Initializes and manages dark/light mode themes
 */
function initTheme() {
    // Force dark mode always
    const darkTheme = 'dark';
    document.documentElement.setAttribute('data-theme', darkTheme);
    localStorage.setItem('kyro-theme', darkTheme);
    updateThemeIcon(darkTheme);
    // Remove theme toggle button if present
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.style.display = 'none';
    }
}

/**
 * Updates the theme switcher button icon (Sun or Moon)
 */
function updateThemeIcon(theme) {
    // No toggle UI needed for dark‑only mode; ensure icons are generated if needed elsewhere
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

/**
 * Handles mobile hamburger dropdown events
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            // Update button icon
            menuBtn.innerHTML = isActive ? `<i data-lucide="x"></i>` : `<i data-lucide="menu"></i>`;
            if (window.lucide) window.lucide.createIcons();
            // Lock/unlock body scroll
            if (isActive) {
                body.classList.add('menu-open');
            } else {
                body.classList.remove('menu-open');
            }
        });

        // Toggle dropdowns on click in mobile
        const dropdowns = navLinks.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const toggleBtn = dropdown.querySelector('a');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Close other dropdowns
                        dropdowns.forEach(other => {
                            if (other !== dropdown) {
                                other.classList.remove('active');
                            }
                        });
                        
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });

        // Close menu when clicking outside or clicking any nav link
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuBtn.innerHTML = `<i data-lucide="menu"></i>`;
                if (window.lucide) window.lucide.createIcons();
                body.classList.remove('menu-open');
                // Also close active dropdowns
                dropdowns.forEach(d => d.classList.remove('active'));
            }
        });
    }
}

