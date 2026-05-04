import json
import urllib.request
import urllib.parse
import time
import os
import sys

# Redirigir salida a log
log_file = open('translate_actions.log', 'w', encoding='utf-8', buffering=1)
sys.stdout = log_file
sys.stderr = log_file

def translate_text(text):
    if not text:
        return ""
    
    retries = 5
    for attempt in range(retries):
        try:
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" + urllib.parse.quote(str(text))
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            response = urllib.request.urlopen(req)
            result = json.loads(response.read().decode('utf-8'))
            translated = "".join([x[0] for x in result[0]])
            
            # Limpieza básica de HTML roto por traducción
            translated = translated.replace("< p >", "<p>").replace("< / p >", "</p>")
            translated = translated.replace("< strong >", "<strong>").replace("< / strong >", "</strong>")
            translated = translated.replace("< em >", "<em>").replace("< / em >", "</em>")
            translated = translated.replace("< hr / >", "<hr />")
            
            return translated
            
        except Exception as e:
            print(f"Error traduciendo (intento {attempt+1}): {e}")
            time.sleep(5 * (attempt + 1))
            
    return str(text)

def main():
    data_path = 'actions_data.json'
    print(f"Cargando {data_path}...")
    
    if not os.path.exists(data_path):
        print(f"Error: No se encuentra {data_path}")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    to_translate = [k for k, v in data.items() if 'es' not in v or not v['es'].get('name')]
    total = len(to_translate)
    
    if total == 0:
        print("No hay traducciones pendientes.")
        return

    print(f"Iniciando traducción de {total} acciones...")
    
    for i, item_id in enumerate(to_translate):
        item = data[item_id]
        name_en = item['en']['name']
        desc_en = item['en']['description']
        
        print(f"[{i+1}/{total}] Traduciendo: {name_en}")
        
        name_es = translate_text(name_en)
        time.sleep(0.5) # Pequeña pausa para no saturar
        desc_es = translate_text(desc_en)
        time.sleep(0.5)
        
        item['es'] = {
            "name": name_es,
            "description": desc_es
        }
        
        # Guardado periódico
        if (i + 1) % 20 == 0:
            print("Guardando progreso...")
            with open(data_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)

    # Guardado final
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("Traducción completada con éxito.")

if __name__ == "__main__":
    main()
