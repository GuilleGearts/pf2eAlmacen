# 🗡️ Ecosistema Pathfinder 2e Visualizers

> Herramientas visuales para **Pathfinder 2e** con soporte bilingüe, filtros avanzados y diccionario de rasgos.

Este repositorio contiene dos aplicaciones independientes:
1.  **[Almacén de Dotes](https://pf2e-feats.vercel.app)** (Carpeta `/feats`)
2.  **[Almacén de Equipo y Objetos](https://pf2e-equipment.vercel.app)** (Carpeta `/equipment`)

---

## 📖 Descripción General

Este ecosistema permite explorar dotes y equipamiento de **Pathfinder Segunda Edición**. Diseñado para rapidez y simplicidad, extrae datos directamente de los packs oficiales de **Foundry VTT**.

### ✨ Características Comunes
- 🌍 **Bilingüe:** Español / Inglés.
- 🎨 **Temas:** PF2e, Claro y Oscuro.
- 🏷️ **Filtro de Rasgos (Tri-State):** Incluir (AND), Excluir o Neutro.
- 📚 **Diccionario Interactivo:** Modal con descripciones oficiales de rasgos.
- 💎 **Terminología Devir:** Ajustada a la edición oficial en español.

---

## 🗂️ Estructura del Proyecto

```
PF2E-V2/
├── feats/                      # App de Dotes (SPA)
│   ├── index.html, app.js, style.css
│   └── feats_data.json
├── equipment/                  # App de Equipo (SPA)
│   ├── index.html, app.js, style.css
│   └── equipment_data.json
└── scripts/                    # Procesamiento de Datos
    ├── parser.py               # Genera feats_data.json
    ├── equipment_parser.py     # Genera equipment_data.json
    ├── build_traits.py         # Genera traits_data.json (para ambas apps)
    └── fix_trait_names.py      # Aplica correcciones oficiales
```

---

## 🚀 Uso Local

Sirve cualquiera de las carpetas:
```bash
# Para dotes
python -m http.server 8080 --directory feats

# Para equipo
python -m http.server 8081 --directory equipment
```

---

## 🛠️ Workflow de Datos

1.  **Dotes:** `cd scripts && python parser.py`
2.  **Equipo:** `cd scripts && python equipment_parser.py`
3.  **Rasgos:** `cd scripts && python build_traits.py && python fix_trait_names.py`

---

## 🌐 Despliegue en Vercel

Configurá dos proyectos en Vercel apuntando al mismo repositorio:
- Proyecto 1: Root Directory = `feats/`
- Proyecto 2: Root Directory = `equipment/`

---

## ⚖️ Aviso Legal
Utiliza marcas de **Paizo Inc.** bajo la Política de Uso Comunitario. [paizo.com/communityuse](http://paizo.com/communityuse).

---

## 👤 Autor
**GuilleGearts** | [![Cafecito](https://img.shields.io/badge/☕%20Cafecito-orange)](https://cafecito.app/guillegearts)
