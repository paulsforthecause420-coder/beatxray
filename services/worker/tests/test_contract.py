from pathlib import Path

def test_worker_uses_header_auth():
    text = Path('modal_app.py').read_text()
    assert 'Header(default="")' in text
    assert 'HTTPException(status_code=401' in text
