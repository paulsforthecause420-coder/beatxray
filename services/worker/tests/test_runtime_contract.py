from pathlib import Path


WORKER_ROOT = Path(__file__).resolve().parents[1]


def test_worker_dependency_compatibility_is_pinned() -> None:
    requirements = (WORKER_ROOT / "requirements.txt").read_text(encoding="utf-8")
    assert "numpy==1.26.4" in requirements
    assert "tensorflow==2.14.1" in requirements
    assert "basic-pitch==0.4.0" in requirements
    assert "torch==2.6.0" in requirements
    assert "torchaudio==2.6.0" in requirements


def test_worker_runtime_check_and_checkpoint_stages_are_present() -> None:
    runtime = (WORKER_ROOT / "beatxray" / "runtime.py").read_text(encoding="utf-8")
    worker = (WORKER_ROOT / "modal_app.py").read_text(encoding="utf-8")
    migration = (WORKER_ROOT.parents[1] / "supabase" / "migrations" / "003_checkpointed_jobs.sql").read_text(
        encoding="utf-8"
    )

    assert "REQUIRED_PYTHON = (3, 11)" in runtime
    assert "assert_runtime_compatibility" in worker
    assert "separate_stems_on_gpu" in worker
    assert "educational_analysis" in worker
    assert "artifacts_job_type_unique_idx" in migration
