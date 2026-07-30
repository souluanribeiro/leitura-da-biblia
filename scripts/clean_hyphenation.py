import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HYPHEN_RE = re.compile(r'(\w)-\s+(\w)')


def clean_text(text: str) -> str:
    text = HYPHEN_RE.sub(r'\1\2', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def update_chunk(supabase: Client, row_id: str, new_content: str) -> bool:
    try:
        supabase.table("knowledge_base").update({"content": new_content}).eq("id", row_id).execute()
        return True
    except Exception as e:
        print(f"  Erro ao atualizar {row_id}: {e}")
        return False


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("Buscando chunks existentes...")
    all_rows = []
    offset = 0
    limit = 1000
    while True:
        r = supabase.table("knowledge_base").select("id, content").range(offset, offset + limit - 1).execute()
        if not r.data:
            break
        all_rows.extend(r.data)
        offset += limit
        if len(r.data) < limit:
            break

    print(f"Total de chunks: {len(all_rows)}")

    to_update = []
    for row in tqdm(all_rows, desc="Limpando texto"):
        new = clean_text(row["content"])
        if new != row["content"]:
            to_update.append((row["id"], new))

    print(f"Atualizando {len(to_update)} chunks com 10 threads...")

    with ThreadPoolExecutor(max_workers=10) as executor:
        futs = {executor.submit(update_chunk, supabase, rid, txt): rid for rid, txt in to_update}
        for f in tqdm(as_completed(futs), total=len(futs), desc="Enviando"):
            f.result()

    print(f"\nConcluído! {len(to_update)} chunks limpos de {len(all_rows)}")


if __name__ == "__main__":
    main()
