import json
import urllib.request
import urllib.parse
import time
import os
import pandas as pd
import numpy as np
import subprocess
from datetime import datetime
import sys

# Override print to include timestamp
def log_print(*args, **kwargs):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    # Use the original print to write to the redirected stdout
    builtins_print(f"{timestamp} ", end="")
    builtins_print(*args, **kwargs)

import builtins
builtins_print = builtins.print
builtins.print = log_print

EXCEL_PATH = 'traduccion_equipos.xlsx'

def translate_text(text):
    if not text or pd.isna(text):
        return ""
    
    retries = 5
    for attempt in range(retries):
        try:
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" + urllib.parse.quote(str(text))
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            response = urllib.request.urlopen(req)
            result = json.loads(response.read().decode('utf-8'))
            translated = "".join([x[0] for x in result[0]])
            
            # Fix potential HTML formatting issues caused by translation
            translated = translated.replace("< p >", "<p>").replace("< / p >", "</p>")
            translated = translated.replace("< strong >", "<strong>").replace("< / strong >", "</strong>")
            translated = translated.replace("< em >", "<em>").replace("< / em >", "</em>")
            translated = translated.replace("< hr / >", "<hr />")
            
            return translated
            
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = 30 * (attempt + 1)
                print(f"Rate limit reached. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"HTTP Error {e.code}. Waiting 5 seconds...")
                time.sleep(5)
        except Exception as e:
            print(f"Error translating: {e}")
            time.sleep(5)
            
    return str(text)

def main():
    print(f"Reading {EXCEL_PATH}...")
    
    try:
        df = pd.read_excel(EXCEL_PATH)
    except Exception as e:
        print(f"Could not read excel file: {e}")
        return

    # Find rows where translation is missing (ES name or ES description is empty)
    missing_mask = (df['Name (ES)'].isna() | (df['Name (ES)'] == '')) | (df['Description (ES)'].isna() | (df['Description (ES)'] == ''))
    indices_to_translate = df[missing_mask].index
    
    total = len(indices_to_translate)
    if total == 0:
        print("No missing translations found! Everything is translated.")
        subprocess.run(["python", "import_equipment.py"], check=False)
        return

    print(f"Found {total} items to translate. Processing...")
    
    for i, idx in enumerate(indices_to_translate):
        name_en = df.loc[idx, 'Name (EN)']
        desc_en = df.loc[idx, 'Description (EN)']
        
        # Translate name if missing
        if pd.isna(df.loc[idx, 'Name (ES)']) or df.loc[idx, 'Name (ES)'] == '':
            name_es = translate_text(name_en)
            df.loc[idx, 'Name (ES)'] = name_es
            time.sleep(0.5)
        
        # Translate description if missing
        if pd.isna(df.loc[idx, 'Description (ES)']) or df.loc[idx, 'Description (ES)'] == '':
            desc_es = translate_text(desc_en)
            df.loc[idx, 'Description (ES)'] = desc_es
            time.sleep(0.5)
        
        if (i+1) % 10 == 0 or i == 0:
            print(f"Translating {i+1}/{total} ({( (i+1)/total)*100:.1f}%) - {name_en}")
        
        # Save periodically to prevent data loss
        if (i + 1) % 50 == 0:
            print(f"Autosaving progress at {i+1}/{total}...")
            try:
                df.to_excel(EXCEL_PATH, index=False)
                subprocess.run(["python", "import_equipment.py"], check=False)
            except Exception as e:
                print(f"Error saving/importing: {e}")

    # Final save
    print("Saving final results...")
    try:
        df.to_excel(EXCEL_PATH, index=False)
        subprocess.run(["python", "import_equipment.py"], check=False)
        print("Full translation complete and Excel/JSON files updated!")
    except Exception as e:
        print(f"Error on final save: {e}")

if __name__ == '__main__':
    # Log output to a file, using append mode to keep history
    log_file = open('translate_equipment.log', 'a', buffering=1, encoding='utf-8')
    sys.stdout = log_file
    sys.stderr = log_file
    
    print("\n--- INICIANDO NUEVA SESION DE TRADUCCION ---")
    main()

