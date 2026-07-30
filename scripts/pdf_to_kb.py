"""
Script para extrair texto de PDFs, gerar embeddings e inserir na knowledge_base do Supabase.

Uso:
  1. Copie .env.example para .env e preencha as credenciais
  2. Coloque os PDFs na pasta definida em PDF_FOLDER
  3. pip install -r requirements.txt
  4. python pdf_to_kb.py
"""

import os
import re
import sys
import json
import uuid
from pathlib import Path

import fitz
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
PDF_FOLDER = os.getenv("PDF_FOLDER", "./pdfs")
CATEGORY = os.getenv("CATEGORY", "Geral")

CHUNK_MIN_CHARS = 300
CHUNK_MAX_CHARS = 1500
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBED_DIM = 384

STOP_WORDS = set([
    "de", "a", "o", "que", "e", "do", "da", "em", "um", "para",
    "com", "não", "uma", "os", "no", "se", "na", "por", "mais",
    "as", "dos", "como", "mas", "ao", "ele", "das", "à", "seu",
    "sua", "entre", "ser", "foi", "este", "esta", "seus", "suas",
    "eu", "muito", "mesmo", "já", "também", "quando", "depois",
    "sobre", "todos", "pode", "ser", "ter", "maior", "forma",
    "parte", "cada", "ainda", "assim", "pelo", "pela", "até",
    "isso", "eles", "todas", "qual", "são", "você", "pois",
    "ou", "era", "bem", "desde", "onde", "contra", "sem",
    "então", "só", "porque", "muito", "sendo", "está", "foram",
    "tem", "tinha", "estava", "teve", "ter", "seus", "lhe",
    "lhes", "nos", "lhe", "lhes", "nós", "vós", "lhe", "lhes",
])

HF_HEADERS = {"Content-Type": "application/json"}
if HUGGINGFACE_API_KEY:
    HF_HEADERS["Authorization"] = f"Bearer {HUGGINGFACE_API_KEY}"

try:
    from sentence_transformers import SentenceTransformer
    LOCAL_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    USE_LOCAL_MODEL = True
    print("Modelo de embedding local carregado. Usando modo offline.")
except ImportError:
    USE_LOCAL_MODEL = False
    print("sentence-transformers não encontrado. Usando API Hugging Face (requer internet).")


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text_parts = []
    for page in doc:
        text = page.get_text()
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            text_parts.append(text)
    doc.close()
    return "\n\n".join(text_parts)


def chunk_text(text: str, title: str) -> list[dict]:
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    buffer = ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(buffer) + len(para) < CHUNK_MAX_CHARS:
            buffer = (buffer + "\n\n" + para).strip()
        else:
            if buffer:
                chunks.append({"title": title, "content": buffer})
            buffer = para
    if buffer:
        chunks.append({"title": title, "content": buffer})
    return chunks


def extract_keywords(text: str, max_kw: int = 8) -> list[str]:
    words = re.findall(r'[a-zA-ZÀ-ÿ]+', text.lower())
    freq = {}
    for w in words:
        if len(w) > 3 and w not in STOP_WORDS:
            freq[w] = freq.get(w, 0) + 1
    sorted_kw = sorted(freq.items(), key=lambda x: -x[1])
    return [w for w, _ in sorted_kw[:max_kw]]


def generate_embedding(text: str) -> list[float] | None:
    if USE_LOCAL_MODEL:
        try:
            return LOCAL_MODEL.encode(text[:2000]).tolist()
        except Exception as e:
            print(f"  Erro modelo local: {e}")
            return None
    try:
        resp = requests.post(
            f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}",
            headers=HF_HEADERS,
            json={"inputs": text, "options": {"wait_for_model": True}},
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"  Erro HF API: {resp.status_code} - {resp.text[:200]}")
            return None
        data = resp.json()
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            return data[0]
        return None
    except Exception as e:
        print(f"  Erro ao gerar embedding: {e}")
        return None


def insert_chunk(supabase: Client, chunk: dict, embedding: list[float]):
    data = {
        "id": str(uuid.uuid4()),
        "title": chunk["title"],
        "content": chunk["content"],
        "keywords": extract_keywords(chunk["content"]),
        "embedding": embedding,
    }
    resp = supabase.table("knowledge_base").insert(data).execute()
    return resp


def main():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env")
        print("  - SUPABASE_URL: https://lbgztfqgzjmiwvcghnki.supabase.co")
        print("  - SUPABASE_SERVICE_ROLE_KEY: Pega em https://supabase.com/dashboard/project/lbgztfqgzjmiwvcghnki/settings/api")
        sys.exit(1)

    pdf_dir = Path(PDF_FOLDER)
    if not pdf_dir.exists():
        print(f"ERRO: Pasta de PDFs não encontrada: {PDF_FOLDER}")
        print("Crie a pasta e coloque os PDFs lá.")
        sys.exit(1)

    pdf_files = sorted(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"Nenhum PDF encontrado em {PDF_FOLDER}")
        sys.exit(1)

    print(f"Conectando ao Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    total_chunks = 0
    total_errors = 0

    for pdf_path in pdf_files:
        print(f"\nProcessando: {pdf_path.name}")
        text = extract_text_from_pdf(str(pdf_path))
        if not text.strip():
            print(f"  Nenhum texto extraído. Pulando.")
            continue

        title = pdf_path.stem.replace("_", " ").replace("-", " ").title()
        chunks = chunk_text(text, title)
        print(f"  Extraídos {len(chunks)} chunks")

        for i, chunk in enumerate(tqdm(chunks, desc=f"  Embeddings")):
            chunk_text_for_emb = chunk["content"][:2000]
            embedding = generate_embedding(chunk_text_for_emb)
            if embedding is None:
                total_errors += 1
                continue
            try:
                insert_chunk(supabase, chunk, embedding)
                total_chunks += 1
            except Exception as e:
                print(f"  Erro ao inserir chunk {i}: {e}")
                total_errors += 1

    print(f"\nConcluído!")
    print(f"  Inseridos: {total_chunks} chunks")
    print(f"  Erros: {total_errors}")
    print(f"  Categoria: {CATEGORY}")


if __name__ == "__main__":
    main()
