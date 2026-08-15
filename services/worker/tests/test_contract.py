from pathlib import Path

def test_worker_uses_header_auth() -> None:
    worker_file = Path(__file__).resolve().parents[1] / "modal_app.py"
    text = worker_file.read_text(encoding="utf-8")
    assert 'Header(default="")' in text
    assert "HTTPException(status_code=401" in text
