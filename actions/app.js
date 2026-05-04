let allActions = [];
let filteredActions = [];
const RENDER_LIMIT = 50;
let currentRenderCount = 0;

const state = {
    searchQuery: '',
    selectedTypes: new Set(),
    selectedModes: new Set(),
    includedTraits: new Set(),
    excludedTraits: new Set(),
    language: localStorage.getItem('pf2e-lang') || 'es'
};

const uiTranslations = {
    en: {
        title: "Pathfinder 2e Actions",
        searchPlaceholder: "Search actions by name...",
        traitSearchPlaceholder: "Search trait...",
        filters: "Filters",
        clearAll: "Clear",
        actionType: "Action Type",
        mode: "Game Mode",
        traits: "Traits",
        loading: "Loading actions...",
        noMatch: "No actions match your filters.",
        source: "Source: ",
        showing: "Showing",
        types: {
            action: "Action",
            reaction: "Reaction",
            free: "Free Action",
            passive: "Passive"
        },
        modes: {
            basic: "Basic",
            exploration: "Exploration",
            downtime: "Downtime",
            combat: "Combat",
            skill: "Skill",
            class: "Class",
            ancestry: "Ancestry"
        }
    },
    es: {
        title: "Almacén de Acciones PF2e",
        searchPlaceholder: "Buscar acciones por nombre...",
        traitSearchPlaceholder: "Buscar rasgo...",
        filters: "Filtros",
        clearAll: "Limpiar",
        actionType: "Tipo de Acción",
        mode: "Modo de Juego",
        traits: "Rasgos",
        loading: "Cargando acciones...",
        noMatch: "Ninguna acción coincide con los filtros.",
        source: "Fuente: ",
        showing: "Mostrando",
        types: {
            action: "Acción",
            reaction: "Reacción",
            free: "Acción Gratuita",
            passive: "Pasiva"
        },
        modes: {
            basic: "Básicas",
            exploration: "Exploración",
            downtime: "Tiempo Libre",
            combat: "Combate",
            skill: "Habilidad",
            class: "Clase",
            ancestry: "Linaje"
        }
    }
};

async function init() {
    try {
        const savedTheme = localStorage.getItem('pf2e-theme') || 'pf2e';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('theme-selector').value = savedTheme;
        document.getElementById('language-selector').value = state.language;

        updateUI();

        const res = await fetch('actions_data.json?v=' + Date.now());
        if (!res.ok) throw new Error('No se pudieron cargar los datos de acciones');
        const data = await res.json();
        
        allActions = Object.values(data).sort((a, b) => {
            const nameA = a[state.language]?.name || a.en.name;
            const nameB = b[state.language]?.name || b.en.name;
            return nameA.localeCompare(nameB);
        });
        
        filteredActions = [...allActions];
        
        buildFilters();
        renderActions(true);
        setupEventListeners();
        
    } catch (error) {
        document.getElementById('actions-grid').innerHTML = `<div class="loader">Error: ${error.message}</div>`;
    }
}

function updateUI() {
    const t = uiTranslations[state.language];
    document.getElementById('page-title').textContent = t.title;
    document.getElementById('main-title').textContent = t.title;
    document.getElementById('search-input').placeholder = t.searchPlaceholder;
    document.getElementById('trait-search-input').placeholder = t.traitSearchPlaceholder;
    document.getElementById('ui-filters-title').textContent = t.filters;
    document.getElementById('clear-filters').textContent = t.clearAll;
    document.getElementById('ui-action-type').textContent = t.actionType;
    document.getElementById('ui-mode').textContent = t.mode;
    document.getElementById('ui-specific-trait').textContent = t.traits;
}

function buildFilters() {
    const types = new Set();
    const modes = new Set();
    const traits = new Set();

    allActions.forEach(action => {
        if (action.actionType) types.add(action.actionType);
        if (action.mode) modes.add(action.mode);
        if (action.traits) action.traits.forEach(t => traits.add(t));
    });

    const typeContainer = document.getElementById('type-filters');
    const modeContainer = document.getElementById('mode-filters');
    const traitsContainer = document.getElementById('traits-list');

    typeContainer.innerHTML = '';
    Array.from(types).sort().forEach(type => {
        const translated = uiTranslations[state.language].types[type] || type;
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${type}" class="type-cb"> ${translated}`;
        typeContainer.appendChild(label);
    });

    modeContainer.innerHTML = '';
    Array.from(modes).sort().forEach(mode => {
        const translated = uiTranslations[state.language].modes[mode] || mode;
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${mode}" class="mode-cb"> ${translated}`;
        modeContainer.appendChild(label);
    });

    traitsContainer.innerHTML = '';
    Array.from(traits).sort().forEach(trait => {
        const item = document.createElement('div');
        item.className = 'trait-item';
        item.dataset.trait = trait;
        item.dataset.state = 'neutral';
        item.innerHTML = `<div class="trait-state-icon"></div><span>${formatTrait(trait)}</span>`;
        traitsContainer.appendChild(item);
    });
}

function setupEventListeners() {
    document.getElementById('theme-selector').addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pf2e-theme', theme);
    });

    document.getElementById('language-selector').addEventListener('change', (e) => {
        state.language = e.target.value;
        localStorage.setItem('pf2e-lang', state.language);
        updateUI();
        buildFilters(); // Rebuild to update labels
        applyFilters();
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        applyFilters();
    });

    document.getElementById('trait-search-input').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.trait-item').forEach(item => {
            const tName = item.querySelector('span').textContent.toLowerCase();
            item.style.display = tName.includes(q) ? 'flex' : 'none';
        });
    });

    document.querySelector('.sidebar').addEventListener('change', (e) => {
        if (e.target.classList.contains('type-cb')) {
            if (e.target.checked) state.selectedTypes.add(e.target.value);
            else state.selectedTypes.delete(e.target.value);
            applyFilters();
        }
        if (e.target.classList.contains('mode-cb')) {
            if (e.target.checked) state.selectedModes.add(e.target.value);
            else state.selectedModes.delete(e.target.value);
            applyFilters();
        }
    });

    document.getElementById('traits-list').addEventListener('click', (e) => {
        const item = e.target.closest('.trait-item');
        if (!item) return;
        const trait = item.dataset.trait;
        if (item.dataset.state === 'neutral') {
            item.dataset.state = 'included';
            state.includedTraits.add(trait);
        } else if (item.dataset.state === 'included') {
            item.dataset.state = 'excluded';
            state.includedTraits.delete(trait);
            state.excludedTraits.add(trait);
        } else {
            item.dataset.state = 'neutral';
            state.excludedTraits.delete(trait);
        }
        applyFilters();
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        state.searchQuery = '';
        state.selectedTypes.clear();
        state.selectedModes.clear();
        state.includedTraits.clear();
        state.excludedTraits.clear();
        document.getElementById('search-input').value = '';
        document.getElementById('trait-search-input').value = '';
        document.querySelectorAll('.type-cb, .mode-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.trait-item').forEach(i => i.dataset.state = 'neutral');
        applyFilters();
    });

    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (currentRenderCount < filteredActions.length) {
                renderMoreActions();
            }
        }
    });
}

function applyFilters() {
    filteredActions = allActions.filter(action => {
        const langData = action[state.language] || action.en;
        if (state.searchQuery && !langData.name.toLowerCase().includes(state.searchQuery)) return false;
        if (state.selectedTypes.size > 0 && !state.selectedTypes.has(action.actionType)) return false;
        if (state.selectedModes.size > 0 && !state.selectedModes.has(action.mode)) return false;
        
        for (let trait of state.excludedTraits) if (action.traits.includes(trait)) return false;
        for (let trait of state.includedTraits) if (!action.traits.includes(trait)) return false;
        
        return true;
    });
    renderActions(true);
}

function renderActions(reset = false) {
    const grid = document.getElementById('actions-grid');
    if (reset) {
        grid.innerHTML = '';
        currentRenderCount = 0;
    }
    const t = uiTranslations[state.language];
    document.getElementById('results-count').textContent = `${t.showing} ${filteredActions.length}`;
    if (filteredActions.length === 0) {
        grid.innerHTML = `<div class="loader">${t.noMatch}</div>`;
        return;
    }
    renderMoreActions();
}

function renderMoreActions() {
    const grid = document.getElementById('actions-grid');
    const fragment = document.createDocumentFragment();
    const end = Math.min(currentRenderCount + RENDER_LIMIT, filteredActions.length);
    for (let i = currentRenderCount; i < end; i++) {
        fragment.appendChild(createActionCard(filteredActions[i]));
    }
    grid.appendChild(fragment);
    currentRenderCount = end;
}

function getActionIcon(action) {
    const type = action.actionType;
    const count = action.actionCount;
    if (type === 'reaction') return 'icons/Reaction.webp';
    if (type === 'free') return 'icons/FreeAction.webp';
    if (type === 'passive') return 'icons/Passive.webp';
    if (count === 1) return 'icons/OneAction.webp';
    if (count === 2) return 'icons/TwoActions.webp';
    if (count === 3) return 'icons/ThreeActions.webp';
    return null;
}

function createActionCard(action) {
    const card = document.createElement('article');
    card.className = 'action-card';
    const langData = action[state.language] || action.en;
    const icon = getActionIcon(action);
    const iconHtml = icon ? `<img src="${icon}" class="action-icon" alt="${action.actionType}">` : '';
    
    const traitsHtml = action.traits.map(t => `<span class="trait-badge">${formatTrait(t)}</span>`).join('');
    const rarityBadge = action.rarity !== 'common' ? `<span class="trait-badge rarity-${action.rarity}">${formatTrait(action.rarity)}</span>` : '';

    card.innerHTML = `
        <div class="action-header">
            <h2 class="action-title">${langData.name}</h2>
            ${iconHtml}
        </div>
        <div class="action-meta">
            ${action.publication ? uiTranslations[state.language].source + action.publication : ''}
        </div>
        <div class="action-traits">
            ${rarityBadge}
            ${traitsHtml}
        </div>
        <div class="action-desc">
            ${langData.description}
        </div>
    `;
    return card;
}

function formatTrait(trait) {
    if (!trait) return '';
    return trait.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

init();
