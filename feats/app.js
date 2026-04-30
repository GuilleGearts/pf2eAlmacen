let allFeats = [];
let filteredFeats = [];
const RENDER_LIMIT = 50;
let currentRenderCount = 0;
let traitsData = {};

// DOM Elements
const searchInput = document.getElementById('search-input');
const traitSearchInput = document.getElementById('trait-search-input');
const traitsListContainer = document.getElementById('traits-list');
const categoryFiltersContainer = document.getElementById('category-filters');
const levelFiltersContainer = document.getElementById('level-filters');
const featsGrid = document.getElementById('feats-grid');
const resultsCount = document.getElementById('results-count');
const clearFiltersBtn = document.getElementById('clear-filters');
const themeSelector = document.getElementById('theme-selector');
const languageSelector = document.getElementById('language-selector');

// State
const state = {
    searchQuery: '',
    includedTraits: new Set(),
    excludedTraits: new Set(),
    selectedCategories: new Set(),
    selectedLevels: new Set(),
    language: 'es'
};

const uiTranslations = {
    en: {
        title: "Pathfinder 2e Feats",
        searchPlaceholder: "Search feats by name or description...",
        traitSearchPlaceholder: "Search trait...",
        filters: "Filters",
        clearAll: "Clear All",
        specificTrait: "Specific Trait",
        anyTrait: "Any Trait",
        category: "Category",
        level: "Level",
        anyLevel: "Any Level",
        loading: "Loading feats...",
        noMatch: "No feats match your filters.",
        source: "Source: ",
        levelPrefix: "Level ",
        showing: "Showing"
    },
    es: {
        title: "Almacén de Dotes PF2e",
        searchPlaceholder: "Buscar dotes por nombre o descripción...",
        traitSearchPlaceholder: "Buscar rasgo...",
        filters: "Filtros",
        clearAll: "Limpiar",
        specificTrait: "Rasgos",
        anyTrait: "Cualquier Rasgo",
        category: "Categoría",
        level: "Nivel",
        anyLevel: "Cualquier Nivel",
        loading: "Cargando dotes...",
        noMatch: "Ninguna dote coincide con los filtros.",
        source: "Fuente: ",
        levelPrefix: "Nivel ",
        showing: "Mostrando"
    }
};

function updateUI() {
    const t = uiTranslations[state.language];
    document.getElementById('page-title').textContent = t.title;
    document.getElementById('main-title').textContent = t.title;
    document.getElementById('search-input').placeholder = t.searchPlaceholder;
    if (traitSearchInput) traitSearchInput.placeholder = t.traitSearchPlaceholder;
    document.getElementById('ui-filters-title').textContent = t.filters;
    document.getElementById('clear-filters').textContent = t.clearAll;
    document.getElementById('ui-specific-trait').textContent = t.specificTrait;
    document.getElementById('ui-category').textContent = t.category;
    document.getElementById('ui-level').textContent = t.level;
    
    if (levelFiltersContainer.children.length > 0) levelFiltersContainer.children[0].textContent = t.anyLevel;
}

// Initialize
async function init() {
    try {
        // Load Theme and Language
        const savedTheme = localStorage.getItem('pf2e-theme') || 'pf2e';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSelector.value = savedTheme;

        const savedLanguage = localStorage.getItem('pf2e-lang') || 'es';
        state.language = savedLanguage;
        languageSelector.value = savedLanguage;
        updateUI();

        const [featsRes, traitsRes] = await Promise.all([
            fetch('feats_data.json?v=' + Date.now()),
            fetch('traits_data.json?v=' + Date.now()).catch(() => ({ ok: false }))
        ]);
        
        if (!featsRes.ok) throw new Error('Failed to load feats data');
        const data = await featsRes.json();
        
        if (traitsRes.ok) {
            traitsData = await traitsRes.json();
        }
        
        allFeats = Object.values(data).sort((a, b) => a.en.name.localeCompare(b.en.name));
        filteredFeats = [...allFeats];
        
        buildFilters();
        renderFeats(true);
        setupEventListeners();
        
    } catch (error) {
        featsGrid.innerHTML = `<div class="loader">Error loading feats: ${error.message}</div>`;
    }
}

function buildFilters() {
    const categories = new Set();
    const levels = new Set();
    const traits = new Set();

    allFeats.forEach(feat => {
        if (feat.category) categories.add(feat.category);
        if (feat.level !== undefined && feat.level !== null) levels.add(feat.level);
        if (feat.traits && Array.isArray(feat.traits)) {
            feat.traits.forEach(t => traits.add(t));
        }
    });

    // Render Categories
    Array.from(categories).sort().forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${cat}" class="cat-cb"> ${formatTrait(cat)}`;
        categoryFiltersContainer.appendChild(label);
    });

    // Render Levels as checkboxes
    Array.from(levels).sort((a, b) => a - b).forEach(lvl => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${lvl}" class="lvl-cb"> ${uiTranslations[state.language].levelPrefix}${lvl}`;
        levelFiltersContainer.appendChild(label);
    });

    // Render Specific Traits (Tri-State List)
    traitsListContainer.innerHTML = '';
    Array.from(traits).sort().forEach(trait => {
        const item = document.createElement('div');
        item.className = 'trait-item';
        item.dataset.trait = trait;
        item.dataset.state = 'neutral';
        item.innerHTML = `<div class="trait-state-icon"></div><span>${formatTrait(trait)}</span>`;
        traitsListContainer.appendChild(item);
    });
}

function setupEventListeners() {
    themeSelector.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pf2e-theme', theme);
    });

    languageSelector.addEventListener('change', (e) => {
        state.language = e.target.value;
        localStorage.setItem('pf2e-lang', state.language);
        updateUI();
        // Rebuild level checkbox labels
        document.querySelectorAll('.lvl-cb').forEach(cb => {
            const textNode = cb.parentElement.lastChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = ' ' + uiTranslations[state.language].levelPrefix + cb.value;
            }
        });
        // Rebuild trait item names
        document.querySelectorAll('.trait-item').forEach(item => {
            const span = item.querySelector('span');
            if (span) span.textContent = formatTrait(item.dataset.trait);
        });
        applyFilters(); // Re-render and re-filter using new language
    });

    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        applyFilters();
    });

    if (traitSearchInput) {
        traitSearchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.trait-item').forEach(item => {
                const tName = item.querySelector('span').textContent.toLowerCase();
                item.style.display = tName.includes(q) ? 'flex' : 'none';
            });
        });
    }

    if (traitsListContainer) {
        traitsListContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.trait-item');
            if (!item) return;
            
            const trait = item.dataset.trait;
            let currentState = item.dataset.state;
            
            if (currentState === 'neutral') {
                item.dataset.state = 'included';
                state.includedTraits.add(trait);
            } else if (currentState === 'included') {
                item.dataset.state = 'excluded';
                state.includedTraits.delete(trait);
                state.excludedTraits.add(trait);
            } else {
                item.dataset.state = 'neutral';
                state.excludedTraits.delete(trait);
            }
            applyFilters();
        });
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    const traitModal = document.getElementById('trait-modal');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            traitModal.classList.add('hidden');
        });
    }
    if (traitModal) {
        traitModal.addEventListener('click', (e) => {
            if (e.target === traitModal) {
                traitModal.classList.add('hidden');
            }
        });
    }

    document.querySelector('.sidebar').addEventListener('change', (e) => {
        if (e.target.classList.contains('cat-cb')) {
            if (e.target.checked) state.selectedCategories.add(e.target.value);
            else state.selectedCategories.delete(e.target.value);
            applyFilters();
        }
        if (e.target.classList.contains('lvl-cb')) {
            if (e.target.checked) state.selectedLevels.add(e.target.value);
            else state.selectedLevels.delete(e.target.value);
            applyFilters();
        }
    });

    clearFiltersBtn.addEventListener('click', () => {
        state.searchQuery = '';
        state.selectedCategories.clear();
        state.selectedLevels.clear();
        state.includedTraits.clear();
        state.excludedTraits.clear();
        
        searchInput.value = '';
        if (traitSearchInput) traitSearchInput.value = '';
        
        document.querySelectorAll('.cat-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.lvl-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.trait-item').forEach(item => {
            item.dataset.state = 'neutral';
            item.style.display = 'flex';
        });
        
        applyFilters();
    });
    
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (currentRenderCount < filteredFeats.length) {
                renderMoreFeats();
            }
        }
    });
}

function applyFilters() {
    filteredFeats = allFeats.filter(feat => {
        // Obtenemos los textos en el idioma seleccionado, con fallback a inglés
        const langData = (state.language === 'es' && feat.es && feat.es.name) ? feat.es : feat.en;
        
        if (state.searchQuery) {
            const nameMatch = langData.name.toLowerCase().includes(state.searchQuery);
            const descMatch = langData.description.toLowerCase().includes(state.searchQuery);
            if (!nameMatch && !descMatch) return false;
        }

        if (state.selectedCategories.size > 0 && !state.selectedCategories.has(feat.category)) {
            return false;
        }

        if (state.selectedLevels.size > 0 && !state.selectedLevels.has(feat.level.toString())) {
            return false;
        }

        const featTraits = feat.traits || [];

        for (let ext of state.excludedTraits) {
            if (featTraits.includes(ext)) return false;
        }
        
        for (let inc of state.includedTraits) {
            if (!featTraits.includes(inc)) return false;
        }

        return true;
    });

    renderFeats(true);
}

function formatTrait(trait) {
    if (!trait) return '';
    const formatted = trait.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    if (traitsData && traitsData[trait.toLowerCase()]) {
        const data = traitsData[trait.toLowerCase()];
        const langData = (state.language === 'es' && data.es && data.es.name) ? data.es : data.en;
        if (langData && langData.name) {
            return langData.name;
        }
    }
    return formatted;
}

function getTraitColorClass(trait) {
    const t = trait.toLowerCase();
    if (t === 'general') return 'trait-general';
    if (t === 'skill') return 'trait-skill';
    if (t.includes('class') || t === 'archetype') return 'trait-class';
    if (t === 'ancestry' || t === 'heritage') return 'trait-ancestry';
    return '';
}

function createFeatCard(feat) {
    const card = document.createElement('article');
    card.className = 'feat-card';
    
    const rarity = feat.rarity || 'common';
    const rarityBadge = rarity !== 'common' ? `<span class="trait-badge rarity-${rarity}">${formatTrait(rarity)}</span>` : '';
    
    const traitsHtml = (feat.traits || []).map(t => 
        `<button class="trait-badge ${getTraitColorClass(t)}" onclick="showTraitModal('${t}')">${formatTrait(t)}</button>`
    ).join('');

    // Obtener los datos del idioma seleccionado, con fallback a inglés
    const langData = (state.language === 'es' && feat.es && feat.es.name) ? feat.es : feat.en;
    
    // Si estamos en español y el nombre viene del inglés (por falta de traducción), añadimos un indicador visual
    const isUntranslated = (state.language === 'es' && (!feat.es || !feat.es.name));
    const untranslatedBadge = isUntranslated ? `<span class="trait-badge" style="background:#ffeb3b;color:#333;border-color:#fbc02d;" title="No traducido aún">EN</span>` : '';

    const t = uiTranslations[state.language];

    card.innerHTML = `
        <div class="feat-header">
            <h2 class="feat-title">${langData.name} ${untranslatedBadge}</h2>
            <span class="feat-level">${t.levelPrefix}${feat.level}</span>
        </div>
        <div class="feat-meta">
            <span class="publication">${feat.publication ? t.source + feat.publication : ''}</span>
        </div>
        <div class="feat-traits">
            ${rarityBadge}
            ${traitsHtml}
        </div>
        <div class="feat-desc">
            ${langData.description}
        </div>
    `;
    return card;
}

function renderFeats(reset = false) {
    if (reset) {
        featsGrid.innerHTML = '';
        currentRenderCount = 0;
        window.scrollTo(0, 0);
    }

    const t = uiTranslations[state.language];
    resultsCount.textContent = `${t.showing} ${filteredFeats.length}`;

    if (filteredFeats.length === 0) {
        featsGrid.innerHTML = `<div class="loader">${t.noMatch}</div>`;
        return;
    }

    renderMoreFeats();
}

function renderMoreFeats() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(currentRenderCount + RENDER_LIMIT, filteredFeats.length);
    
    for (let i = currentRenderCount; i < end; i++) {
        fragment.appendChild(createFeatCard(filteredFeats[i]));
    }
    
    featsGrid.appendChild(fragment);
    currentRenderCount = end;
}

document.addEventListener('DOMContentLoaded', init);

window.showTraitModal = function(traitId) {
    if (!traitsData || !traitsData[traitId.toLowerCase()]) return;
    const data = traitsData[traitId.toLowerCase()];
    
    const langData = (state.language === 'es' && data.es && data.es.name) ? data.es : data.en;
    
    document.getElementById('modal-trait-title').textContent = langData.name || formatTrait(traitId);
    document.getElementById('modal-trait-desc').innerHTML = langData.description || 'No description available.';
    
    document.getElementById('trait-modal').classList.remove('hidden');
};
