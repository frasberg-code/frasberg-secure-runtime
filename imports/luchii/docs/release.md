# Luchii 1.0 Release

## Release Scope

Luchii 1.0 publishes the first unified software release for:
- The `luchii` model package
- The legacy `luchii_api` FastAPI surface
- The documentation site
- Container and cluster deployment scaffolding

## Published Surfaces

- Python package metadata in `pyproject.toml`
- Application entrypoint in `server.py`
- API service surface in `src/luchii_api/main.py`
- Model loading surface in `src/luchii/model.py`
- CI and release automation in `.github/workflows/`

## Backend Strategy

The model layer now supports:
- A real Transformers backend when `LUCHII_MODEL_SOURCE` points to a compatible model
- A template backend fallback when no model artifact is configured

This keeps the release runnable in local and CI environments while preserving a direct path to model publication.

## Release Checklist

1. Install runtime and dev dependencies.
2. Run `python -m pytest tests -q`.
3. Run `python -m mkdocs build --strict`.
4. Set `LUCHII_MODEL_SOURCE` to a published model artifact for production inference.
5. Tag and publish the release workflow.