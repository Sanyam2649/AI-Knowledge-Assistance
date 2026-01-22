import os
import re
import time
from datetime import datetime
from io import BytesIO
import pdfplumber
from docx import Document


def validate_file(file_path: str):
    max_size = 10 * 1024 * 1024 
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']

    if not os.path.exists(file_path):
        return {"valid": False, "error": "File does not exist"}

    if os.path.getsize(file_path) == 0:
        return {"valid": False, "error": "File is empty"}

    if os.path.getsize(file_path) > max_size:
        return {"valid": False, "error": "File size exceeds 10MB limit"}

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in allowed_extensions:
        return {"valid": False, "error": "Unsupported file type. Upload PDF, DOCX, or TXT"}

    return {"valid": True}


def validate_upload(file) -> dict:
    """
    Validate a Flask/Werkzeug FileStorage upload by checking filename + stream length.

    This is intentionally separate from validate_file(file_path) because uploads are not
    guaranteed to exist on disk yet.
    """
    max_size = 10 * 1024 * 1024
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']

    if file is None:
        return {"valid": False, "error": "No file provided"}

    filename = getattr(file, "filename", "") or ""
    if not filename.strip():
        return {"valid": False, "error": "Missing filename"}

    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        return {"valid": False, "error": "Unsupported file type. Upload PDF, DOCX, or TXT"}

    # Best-effort size check without loading entire content into memory
    stream = getattr(file, "stream", None)
    if stream is not None:
        try:
            pos = stream.tell()
            stream.seek(0, os.SEEK_END)
            size = stream.tell()
            stream.seek(pos, os.SEEK_SET)
            if size == 0:
                return {"valid": False, "error": "File is empty"}
            if size > max_size:
                return {"valid": False, "error": "File size exceeds 10MB limit"}
        except Exception:
            # If stream doesn't support seek/tell, skip size check here; on-disk validate will catch it.
            pass

    return {"valid": True}

def extract_text(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()
    text = ''
    page_count = 0

    try:
        if ext == '.pdf':
            print(f"🔍 Extracting text from PDF: {file_path}")
            text, page_count = extract_text_from_pdf(file_path)

        elif ext in ['.docx', '.doc']:
            print(f"🔍 Extracting text from DOCX: {file_path}")
            text = extract_text_from_docx(file_path)

        elif ext == '.txt':
            print(f"📝 Reading text file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()

        else:
            raise ValueError(f"Unsupported file type: {ext}")

        if not text or len(text.strip()) == 0:
            raise ValueError("No text could be extracted from the file")

        text = clean_text(text)
        return text, page_count

    except Exception as e:
        print(f"❌ Error extracting text: {e}")
        raise

def extract_text_from_pdf(file_path: str):
    text = ''
    page_count = 0
    try:
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ''
                text += page_text + ' '
        return text.strip(), page_count
    except Exception as e:
        print(f"❌ PDF extraction failed: {e}")
        # Fallback: extract ASCII text
        with open(file_path, 'rb') as f:
            raw = f.read()
            text = raw.decode('latin1', errors='ignore')
            text = ' '.join(re.findall(r'\b[a-zA-Z0-9\s.,!?;:()-]+\b', text))
        return text.strip(), 0

def extract_text_from_docx(file_path: str):
    try:
        doc = Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        return ' '.join(full_text)
    except Exception as e:
        print(f"❌ DOCX extraction failed: {e}")
        raise

def clean_text(text: str):
    if not text:
        return ''
    return (
        text.replace('\r', ' ')
            .replace('\n', ' ')
            .replace('\t', ' ')
            .strip()
    )

def chunk_text(text: str, file_name: str, file_type: str, file_size: int, page_count: int = 0, chunk_size=600, overlap=80):
    chunks = []
    sentences = [s.strip() + ' ' for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 10]

    current_chunk = ''
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > chunk_size and len(current_chunk) > 0:
            if len(current_chunk.strip()) > 30:
                chunks.append(create_chunk(current_chunk, file_name, file_type, file_size, len(chunks), page_count))
            # overlap last 2 sentences
            last_sentences = current_chunk.split('. ')[-2:]
            current_chunk = '. '.join(last_sentences) + ' ' + sentence
        else:
            current_chunk += sentence

    if len(current_chunk.strip()) > 30:
        chunks.append(create_chunk(current_chunk, file_name, file_type, file_size, len(chunks), page_count))

    # Update totalChunks in metadata
    for idx, chunk in enumerate(chunks):
        chunk['metadata']['totalChunks'] = len(chunks)
        chunk['metadata']['chunkIndex'] = idx

    return chunks

def create_chunk(text, file_name, file_type, file_size, chunk_index, page_count):
    return {
        "text": text.strip(),
        "metadata": {
            "fileName": file_name,
            "fileType": file_type,
            "chunkIndex": chunk_index,
            "totalChunks": 0,
            "fileSize": file_size,
            "pageCount": page_count or 0,
            "uploadedAt": datetime.utcnow(),
            "chunkId": f"{file_name}-{chunk_index}-{int(time.time()*1000)}"
        }
    }
