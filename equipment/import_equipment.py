import json
import pandas as pd
import os

JSON_PATH = 'equipment_data.json'
EXCEL_PATH = 'traduccion_equipos.xlsx'

def import_from_excel():
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: No se encontró {EXCEL_PATH}")
        return

    print(f"Cargando traducciones desde {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH)
    
    # Fill NaN with empty strings
    df = df.fillna('')

    if not os.path.exists(JSON_PATH):
        print(f"Error: No se encontró {JSON_PATH}")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    count = 0
    for _, row in df.iterrows():
        item_id = str(row['ID'])
        name_es = str(row['Name (ES)']).strip()
        desc_es = str(row['Description (ES)']).strip()

        if item_id in data and (name_es or desc_es):
            if 'es' not in data[item_id]:
                data[item_id]['es'] = {}
            
            if name_es:
                data[item_id]['es']['name'] = name_es
            if desc_es:
                data[item_id]['es']['description'] = desc_es
            count += 1

    print(f"Actualizadas {count} entradas en el JSON.")
    
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("¡Proceso completado con éxito!")

if __name__ == "__main__":
    import_from_excel()
