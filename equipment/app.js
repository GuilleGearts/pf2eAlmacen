let allItems = [];
let filteredItems = [];
const RENDER_LIMIT = 50;
let currentRenderCount = 0;
let traitsData = {};

const APP_VERSION = "v2.1.2";
const DATA_VERSION = "2024.05.03";

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
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

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
        title: "PF2e Equipment Visualizer",
        searchPlaceholder: "Search items by name or description...",
        traitSearchPlaceholder: "Search trait...",
        filters: "Filters",
        clearAll: "Clear All",
        specificTrait: "Traits",
        category: "Item Type",
        level: "Level",
        anyLevel: "Any Level",
        loading: "Loading items...",
        noMatch: "No items match your filters.",
        source: "Source: ",
        levelPrefix: "Level ",
        showing: "Showing",
        price: "Price: ",
        bulk: "Bulk: ",
        damage: "Damage: ",
        ac: "AC Bonus: "
    },
    es: {
        title: "Almacén de Equipo PF2e",
        searchPlaceholder: "Buscar objetos por nombre o descripción...",
        traitSearchPlaceholder: "Buscar rasgo...",
        filters: "Filtros",
        clearAll: "Limpiar",
        specificTrait: "Rasgos",
        category: "Tipo de Objeto",
        level: "Nivel",
        anyLevel: "Cualquier Nivel",
        loading: "Cargando objetos...",
        noMatch: "Ningún objeto coincide con los filtros.",
        source: "Fuente: ",
        levelPrefix: "Nivel ",
        showing: "Mostrando",
        price: "Precio: ",
        bulk: "Volumen: ",
        damage: "Daño: ",
        ac: "Bono CA: ",
        itemTypes: {
            ammo: "Munición",
            armor: "Armadura",
            backpack: "Mochila",
            consumable: "Consumible",
            equipment: "Equipo",
            kit: "Kit",
            shield: "Escudo",
            treasure: "Tesoro",
            weapon: "Arma"
        },
        damageTypes: {
            bludgeoning: "contundente",
            piercing: "perforante",
            slashing: "cortante",
            acid: "ácido",
            cold: "frío",
            electricity: "electricidad",
            fire: "fuego",
            force: "fuerza",
            mental: "mental",
            poison: "veneno",
            sonic: "sónico",
            spirit: "espíritu",
            vitality: "vitalidad",
            void: "vacío",
            persistent: "persistente"
        },
        traitPatterns: {
            "versatile-b": "Versátil C",
            "versatile-p": "Versátil P",
            "versatile-s": "Versátil C",
            "two-hand": "A dos manos",
            "deadly": "Mortífera",
            "fatal": "Fatal",
            "fatal-aim": "Puntería fatal",
            "thrown": "Arrojadiza",
            "scatter": "Dispersión",
            "capacity": "Capacidad",
            "range": "Alcance",
            "reload": "Recarga",
            "shove": "Empujar",
            "trip": "Derribar",
            "grapple": "Agarrar",
            "disarm": "Desarmar",
            "reach": "Alcance",
            "agile": "Ágil",
            "finesse": "Sutileza",
            "forceful": "Poderosa",
            "backstabber": "Puñalada trapera",
            "backswing": "Recobro",
            "twin": "Gemela",
            "parry": "Parada",
            "propulsive": "Propulsora",
            "sweep": "Barrido",
            "tethered": "Atada",
            "unarmed": "Desarmado",
            "nonlethal": "No letal",
            "shove": "Empujar",
            "concealable": "Ocultable",
            "concussive": "Conmocionadora",
            "kickback": "Retroceso",
            "modular": "Modular",
            "recovery": "Recuperación",
            "resonant": "Resonante",
            "chaotic": "Caótico",
            "evil": "Malvado",
            "good": "Bueno",
            "lawful": "Legal",
            "uncommon": "Poco común",
            "rare": "Raro",
            "unique": "Único",
            "common": "Común"
        }
    }
};

function updateUI() {
    const t = uiTranslations[state.language];
    document.getElementById('page-title').textContent = t.title;
    document.getElementById('main-title').textContent = t.title;
    document.getElementById('app-version').textContent = APP_VERSION;
    document.getElementById('data-version').textContent = `Data: ${DATA_VERSION}`;
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
        const savedTheme = localStorage.getItem('pf2e-theme') || 'pf2e';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSelector.value = savedTheme;

        const savedLanguage = localStorage.getItem('pf2e-lang') || 'es';
        state.language = savedLanguage;
        languageSelector.value = savedLanguage;
        
        // Mobile initial state: collapsed by default on small screens if no preference saved
        const isMobile = window.innerWidth <= 900;
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === null ? isMobile : localStorage.getItem('sidebar-collapsed') === 'true';
        
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else if (isMobile) {
            sidebarOverlay.classList.add('active');
        }
        
        updateUI();

        const [itemsRes, traitsRes] = await Promise.all([
            fetch('equipment_data.json?v=' + Date.now()),
            fetch('traits_data.json?v=' + Date.now()).catch(() => ({ ok: false }))
        ]);
        
        if (!itemsRes.ok) throw new Error('Failed to load equipment data');
        const data = await itemsRes.json();
        
        if (traitsRes.ok) {
            traitsData = await traitsRes.json();
        }
        
        allItems = Object.values(data).sort((a, b) => a.en.name.localeCompare(b.en.name));
        filteredItems = [...allItems];
        
        buildFilters();
        renderItems(true);
        setupEventListeners();
        
    } catch (error) {
        featsGrid.innerHTML = `<div class="loader">Error loading items: ${error.message}</div>`;
    }
}

function buildFilters() {
    const categories = new Set();
    const levels = new Set();
    const traits = new Set();

    allItems.forEach(item => {
        if (item.type) categories.add(item.type);
        if (item.level !== undefined && item.level !== null) levels.add(item.level);
        if (item.traits && Array.isArray(item.traits)) {
            item.traits.forEach(t => {
                if (t) traits.add(t);
            });
        }
    });

    // Render Categories (Item Types)
    categoryFiltersContainer.innerHTML = '';
    Array.from(categories).sort().forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        const translatedCat = uiTranslations[state.language].itemTypes ? (uiTranslations[state.language].itemTypes[cat] || formatTrait(cat)) : formatTrait(cat);
        label.innerHTML = `<input type="checkbox" value="${cat}" class="cat-cb"> ${translatedCat}`;
        categoryFiltersContainer.appendChild(label);
    });

    // Render Levels
    levelFiltersContainer.innerHTML = '';
    Array.from(levels).sort((a, b) => a - b).forEach(lvl => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${lvl}" class="lvl-cb"> ${uiTranslations[state.language].levelPrefix}${lvl}`;
        levelFiltersContainer.appendChild(label);
    });

    // Render Traits
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
        document.querySelectorAll('.lvl-cb').forEach(cb => {
            const textNode = cb.parentElement.lastChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = ' ' + uiTranslations[state.language].levelPrefix + cb.value;
            }
        });
        document.querySelectorAll('.trait-item').forEach(item => {
            const span = item.querySelector('span');
            if (span) span.textContent = formatTrait(item.dataset.trait);
        });
        applyFilters();
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
    
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
            
            if (window.innerWidth <= 900) {
                if (!isCollapsed) sidebarOverlay.classList.add('active');
                else sidebarOverlay.classList.remove('active');
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            sidebarOverlay.classList.remove('active');
            localStorage.setItem('sidebar-collapsed', 'true');
        });
    }

    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (currentRenderCount < filteredItems.length) {
                renderMoreItems();
            }
        }
    });
}

function applyFilters() {
    filteredItems = allItems.filter(item => {
        const query = state.searchQuery;
        
        if (query) {
            const esData = item.es || {};
            const enData = item.en || {};
            
            // Check current language first
            const primaryData = (state.language === 'es' && esData.name) ? esData : enData;
            const nameMatch = (primaryData.name || "").toLowerCase().includes(query);
            const descMatch = (primaryData.description || "").toLowerCase().includes(query);
            
            if (!nameMatch && !descMatch) {
                // Fallback: check the OTHER language if we didn't find a match
                const secondaryData = (primaryData === esData) ? enData : esData;
                const altNameMatch = (secondaryData.name || "").toLowerCase().includes(query);
                const altDescMatch = (secondaryData.description || "").toLowerCase().includes(query);
                
                if (!altNameMatch && !altDescMatch) return false;
            }
        }

        if (state.selectedCategories.size > 0 && !state.selectedCategories.has(item.type)) {
            return false;
        }
        if (state.selectedLevels.size > 0) {
            const itemLvl = item.level !== undefined && item.level !== null ? item.level.toString() : "";
            if (!state.selectedLevels.has(itemLvl)) return false;
        }
        
        const itemTraits = item.traits || [];
        for (let ext of state.excludedTraits) {
            if (itemTraits.includes(ext)) return false;
        }
        for (let inc of state.includedTraits) {
            if (!itemTraits.includes(inc)) return false;
        }
        return true;
    });
    renderItems(true);
}

function formatTrait(trait) {
    if (!trait) return '';
    const t = trait.toLowerCase();
    
    // Check if we are in Spanish and have a pattern or translation
    if (state.language === 'es') {
        const patterns = uiTranslations.es.traitPatterns;
        
        // Direct matches first
        if (patterns[t]) return patterns[t];
        
        // Pattern matches (e.g., two-hand-d10, fatal-d12, thrown-20)
        if (t.includes('two-hand-')) return `${patterns['two-hand']} ${t.split('-').pop()}`;
        if (t.includes('fatal-aim-')) return `${patterns['fatal-aim']} ${t.split('-').pop()}`;
        if (t.includes('fatal-')) return `${patterns['fatal']} ${t.split('-').pop()}`;
        if (t.includes('deadly-')) return `${patterns['deadly']} ${t.split('-').pop()}`;
        if (t.includes('thrown-')) return `${patterns['thrown']} ${t.split('-').pop()} pies`;
        if (t.includes('scatter-')) return `${patterns['scatter']} ${t.split('-').pop()} pies`;
        if (t.includes('capacity-')) return `${patterns['capacity']} ${t.split('-').pop()}`;
        if (t.startsWith('versatile-')) {
            const type = t.split('-').pop();
            return `Versátil ${type.toUpperCase()}`;
        }
        
        // Core types fallback
        if (uiTranslations.es.itemTypes[t]) return uiTranslations.es.itemTypes[t];
    }

    const formatted = trait.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (traitsData && traitsData[t]) {
        const data = traitsData[t];
        const langData = (state.language === 'es' && data.es && data.es.name) ? data.es : data.en;
        if (langData && langData.name) {
            if (state.language === 'es' && t === 'downtime') return "Tiempo Libre";
            return langData.name;
        }
    }
    return formatted;
}

function getTraitColorClass(trait) {
    const t = trait.toLowerCase();
    if (t === 'weapon') return 'trait-class';
    if (t === 'armor') return 'trait-general';
    if (t === 'consumable') return 'trait-skill';
    if (t === 'equipment') return 'trait-ancestry';
    return '';
}

function translateDamage(damageText) {
    if (!damageText || state.language !== 'es') return damageText;
    let translated = damageText.toLowerCase();
    const types = uiTranslations.es.damageTypes;
    
    Object.keys(types).forEach(type => {
        const regex = new RegExp(`\\b${type}\\b`, 'g');
        translated = translated.replace(regex, types[type]);
    });
    
    return translated;
}

function createItemCard(item) {
    const card = document.createElement('article');
    card.className = 'feat-card';
    
    const rarity = item.rarity || 'common';
    const rarityBadge = rarity !== 'common' ? `<span class="trait-badge rarity-${rarity}">${formatTrait(rarity)}</span>` : '';
    
    const traitsHtml = (item.traits || []).map(t => 
        `<button class="trait-badge ${getTraitColorClass(t)}" onclick="showTraitModal('${t}')">${formatTrait(t)}</button>`
    ).join('');

    const langData = (state.language === 'es' && item.es && item.es.name) ? item.es : item.en;
    const t = uiTranslations[state.language];

    let extraHtml = '';
    if (item.extra) {
        if (item.extra.damage) extraHtml += `<span><strong>${t.damage}</strong>${translateDamage(item.extra.damage)}</span>`;
        if (item.extra.ac) extraHtml += `<span><strong>${t.ac}</strong>${item.extra.ac}</span>`;
    }

    card.innerHTML = `
        <div class="feat-header">
            <h2 class="feat-title">${langData.name}</h2>
            <span class="feat-level">${t.levelPrefix}${item.level}</span>
        </div>
        <span class="publication">${item.publication ? t.source + item.publication : ''}</span>
        <div class="feat-traits">
            <span class="trait-badge ${getTraitColorClass(item.type)}">${formatTrait(item.type)}</span>
            ${rarityBadge}
            ${traitsHtml}
        </div>
        <div class="feat-meta">
            <span class="price"><strong>${t.price}</strong>${item.price || '-'}</span>
            <span class="bulk"><strong>${t.bulk}</strong>${item.bulk || '-'}</span>
            ${extraHtml}
        </div>
        <div class="feat-desc">
            ${langData.description || (state.language === 'es' && item.en ? item.en.description : '') || ''}
        </div>
    `;
    return card;
}

function renderItems(reset = false) {
    if (reset) {
        featsGrid.innerHTML = '';
        currentRenderCount = 0;
        window.scrollTo(0, 0);
    }
    const t = uiTranslations[state.language];
    resultsCount.textContent = `${t.showing} ${filteredItems.length}`;
    if (filteredItems.length === 0) {
        featsGrid.innerHTML = `<div class="loader">${t.noMatch}</div>`;
        return;
    }
    renderMoreItems();
}

function renderMoreItems() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(currentRenderCount + RENDER_LIMIT, filteredItems.length);
    for (let i = currentRenderCount; i < end; i++) {
        fragment.appendChild(createItemCard(filteredItems[i]));
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
