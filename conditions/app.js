let allConditions = [];
let filteredConditions = [];

const state = {
    searchQuery: '',
    selectedGroups: new Set(),
    includedTraits: new Set(),
    excludedTraits: new Set(),
    language: localStorage.getItem('pf2e-lang') || 'es'
};

const uiTranslations = {
    en: {
        title: "Pathfinder 2e Conditions",
        searchPlaceholder: "Search conditions...",
        traitSearchPlaceholder: "Search trait...",
        filters: "Filters",
        clearAll: "Clear",
        group: "Group",
        traits: "Traits",
        loading: "Loading conditions...",
        noMatch: "No conditions match your filters.",
        source: "Source: ",
        showing: "Showing",
        groups: {
            senses: "Senses",
            death: "Death",
            movement: "Movement",
            attitude: "Attitude",
            detection: "Detection",
            degree_of_detection: "Degree of Detection"
        }
    },
    es: {
        title: "Almacén de Estados PF2e",
        searchPlaceholder: "Buscar estados...",
        traitSearchPlaceholder: "Buscar rasgo...",
        filters: "Filtros",
        clearAll: "Limpiar",
        group: "Grupo",
        traits: "Rasgos",
        loading: "Cargando estados...",
        noMatch: "Ningún estado coincide con los filtros.",
        source: "Fuente: ",
        showing: "Mostrando",
        groups: {
            senses: "Sentidos",
            death: "Muerte",
            movement: "Movimiento",
            attitude: "Actitud",
            detection: "Detección",
            degree_of_detection: "Grado de Detección"
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

        const res = await fetch('conditions_data.json?v=' + Date.now());
        if (!res.ok) throw new Error('No se pudieron cargar los datos');
        const data = await res.json();
        
        allConditions = Object.values(data).sort((a, b) => {
            const nameA = a[state.language]?.name || a.en.name;
            const nameB = b[state.language]?.name || b.en.name;
            return nameA.localeCompare(nameB);
        });
        
        filteredConditions = [...allConditions];
        
        buildFilters();
        renderConditions();
        setupEventListeners();
        
    } catch (error) {
        document.getElementById('conditions-grid').innerHTML = `<div class="loader">Error: ${error.message}</div>`;
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
    document.getElementById('ui-group').textContent = t.group;
    document.getElementById('ui-specific-trait').textContent = t.traits;
}

function buildFilters() {
    const groups = new Set();
    const traits = new Set();

    allConditions.forEach(cond => {
        if (cond.group) groups.add(cond.group);
        if (cond.traits) cond.traits.forEach(t => traits.add(t));
    });

    const groupContainer = document.getElementById('group-filters');
    const traitsContainer = document.getElementById('traits-list');

    groupContainer.innerHTML = '';
    Array.from(groups).sort().forEach(group => {
        const translated = uiTranslations[state.language].groups[group] || group;
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" value="${group}" class="group-cb"> ${translated}`;
        groupContainer.appendChild(label);
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
        buildFilters();
        applyFilters();
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        applyFilters();
    });

    document.querySelector('.sidebar').addEventListener('change', (e) => {
        if (e.target.classList.contains('group-cb')) {
            if (e.target.checked) state.selectedGroups.add(e.target.value);
            else state.selectedGroups.delete(e.target.value);
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
        state.selectedGroups.clear();
        state.includedTraits.clear();
        state.excludedTraits.clear();
        document.getElementById('search-input').value = '';
        document.querySelectorAll('.group-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.trait-item').forEach(i => i.dataset.state = 'neutral');
        applyFilters();
    });
}

function applyFilters() {
    filteredConditions = allConditions.filter(cond => {
        const langData = cond[state.language] || cond.en;
        if (state.searchQuery && !langData.name.toLowerCase().includes(state.searchQuery)) return false;
        if (state.selectedGroups.size > 0 && !state.selectedGroups.has(cond.group)) return false;
        for (let trait of state.excludedTraits) if (cond.traits.includes(trait)) return false;
        for (let trait of state.includedTraits) if (!cond.traits.includes(trait)) return false;
        return true;
    });
    renderConditions();
}

function renderConditions() {
    const grid = document.getElementById('conditions-grid');
    grid.innerHTML = '';
    const t = uiTranslations[state.language];
    document.getElementById('results-count').textContent = `${t.showing} ${filteredConditions.length}`;
    if (filteredConditions.length === 0) {
        grid.innerHTML = `<div class="loader">${t.noMatch}</div>`;
        return;
    }
    filteredConditions.forEach(cond => grid.appendChild(createConditionCard(cond)));
}

function createConditionCard(cond) {
    const card = document.createElement('article');
    card.className = 'condition-card';
    const langData = cond[state.language] || cond.en;
    
    const traitsHtml = cond.traits.map(t => `<span class="trait-badge">${formatTrait(t)}</span>`).join('');

    card.innerHTML = `
        <div class="condition-header">
            <h2 class="condition-title">${langData.name}</h2>
        </div>
        <div class="condition-meta">
            ${cond.publication ? uiTranslations[state.language].source + cond.publication : ''}
        </div>
        <div class="condition-traits">
            ${traitsHtml}
        </div>
        <div class="condition-desc">
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
