// common.js – utility to load shared layout into tool pages

/**
 * Fetches layout.html and injects its content into the current document.
 * After injection, the tool page should populate the <main id="main-content"> element.
 */
export async function loadLayout() {
    try {
        const resp = await fetch('layout.html');
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Replace <body> content with layout body content
        document.documentElement.replaceChild(doc.body, document.body);
        // Ensure main content placeholder exists
        const main = document.getElementById('main-content');
        if (!main) {
            const newMain = document.createElement('main');
            newMain.id = 'main-content';
            newMain.className = 'container';
            document.body.appendChild(newMain);
        }
    } catch (e) {
        console.error('Failed to load layout:', e);
    }
}

/** Simple lazy loader for external scripts */
export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
