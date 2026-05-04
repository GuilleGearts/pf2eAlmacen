# 🗡️ Ecosistema Pathfinder 2e Visualizers

> Herramientas visuales de alto rendimiento para **Pathfinder 2e** con soporte bilingüe completo, filtros avanzados y un motor de procesamiento de datos automatizado.

Este ecosistema centraliza la exploración de reglas y contenido oficial de PF2e, diseñado para facilitar la consulta rápida tanto a jugadores como a Directores de Juego.

## 📱 Aplicaciones Incluidas

1.  **[Almacén de Dotes](https://almacendotes.vercel.app/)**: Visualizador dinámico de todas las dotes del juego.
2.  **[Almacén de Equipo](https://almacendeequipo.vercel.app/)**: Buscador de objetos, armas, armaduras y equipo de aventuras.
3.  **[Almacén de Acciones](https://almacenacciones.vercel.app/)**: Buscador de acciones básicas, de clase, de habilidad y de modo de juego (Combate, Exploración, Tiempo Libre).
4.  **[Almacén de Estados](https://almacencondiciones.vercel.app/)**: Consulta rápida de condiciones y sus efectos.

---

## ✨ Características Principales

- 🌍 **Bilingüismo Real:** Cambia instantáneamente entre Inglés y Español.
- 🛠️ **Workflow Automatizado:** Extracción directa de los packs JSON de **Foundry VTT**.
- 📊 **Filtros Avanzados (Tri-State):**
  - **Verde (Incluir):** Debe contener el rasgo.
  - **Rojo (Excluir):** No debe contener el rasgo.
  - **Gris (Neutro):** No aplica filtro.
- 📖 **Diccionario de Rasgos:** Modal interactivo que explica cada rasgo al hacer click.
- 🎨 **Estética Premium:** Temas adaptados a la identidad visual de PF2e, con soporte para modo claro y oscuro.
- 💎 **Traducciones Curadas:** Sincronizado con la terminología oficial de **Devir** y la comunidad.

---

## 🗂️ Estructura del Repositorio

El proyecto se divide en aplicaciones web (SPA) y un motor de procesamiento en Python.

```text
PF2E-V2/
├── feats/                # App: Visualizador de Dotes
├── equipment/            # App: Visualizador de Equipo
├── actions/              # App: Visualizador de Acciones
├── conditions/           # App: Visualizador de Estados
├── scripts/              # Motor de Procesamiento (Python)
│   ├── actions_parser.py   # Extractor de Acciones
│   ├── conditions_parser.py # Extractor de Estados
│   ├── parser.py           # Extractor de Dotes
│   └── ...
└── GitVTT/               # Submódulo con packs de Foundry VTT
```

---

## ⚙️ Workflow de Datos y Traducción

Para mantener el contenido actualizado con los últimos libros, se sigue este proceso:

1.  **Extracción:** Los parsers leen los archivos `.json` de Foundry VTT y generan la base de datos base en inglés.
    ```bash
    python scripts/parser.py
    ```
2.  **Traducción (Excel):** Se utiliza Excel como puente para traducciones masivas o correcciones manuales.
    - Se exporta el JSON a un archivo `.xlsx`.
    - Se aplican traducciones (vía script `translate_all.py` usando Google Translate API o manualmente).
    - Se re-importa el Excel al JSON final.
3.  **Rasgos:** Se procesan los rasgos para asegurar que el diccionario interactivo funcione en ambos idiomas.

---

## 🚀 Desarrollo Local

Para ejecutar las aplicaciones localmente:

```bash
# Servir dotes
python -m http.server 8080 --directory feats

# Servir equipo
python -m http.server 8081 --directory equipment
```

---

## 🌐 Despliegue

El proyecto está optimizado para **Vercel**. Cada subcarpeta (`/feats`, `/equipment`) actúa como la raíz de un proyecto independiente, compartiendo la misma base de datos si es necesario.

---

## ⚖️ Aviso Legal

Este sitio web utiliza marcas registradas y derechos de autor propiedad de **Paizo Inc.**, utilizados bajo la Política de Uso Comunitario de Paizo. No estamos autorizados a cobrarte por el uso de este contenido. Para más información sobre la Política de Uso Comunitario de Paizo, visita [paizo.com/communityuse](http://paizo.com/communityuse).

---

## 👤 Autor
**GuilleGearts** | [![Cafecito](https://img.shields.io/badge/☕%20Cafecito-orange)](https://cafecito.app/guillegearts)
