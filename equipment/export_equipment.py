import json
import pandas as pd
import os

JSON_PATH = 'equipment_data.json'
EXCEL_PATH = 'traduccion_equipos.xlsx'

def export_to_excel():
    if not os.path.exists(JSON_PATH):
        print(f"Error: No se encontró {JSON_PATH}")
        return

    print(f"Cargando datos desde {JSON_PATH}...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    records = []
    for item_id, item in data.items():
        records.append({
            'ID': item_id,
            'Name (EN)': item['en']['name'],
            'Description (EN)': item['en']['description'],
            'Name (ES)': item.get('es', {}).get('name', ''),
            'Description (ES)': item.get('es', {}).get('description', '')
        })
        
    df = pd.DataFrame(records)
    
    print(f"Exportando {len(df)} equipos a Excel...")
    df.to_excel(EXCEL_PATH, index=False)
    print(f"Archivo generado exitosamente en: {EXCEL_PATH}")

if __name__ == "__main__":
    export_to_excel()
