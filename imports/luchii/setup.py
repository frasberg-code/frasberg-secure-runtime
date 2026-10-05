from setuptools import find_packages, setup


setup(
    name="luchii",
    version="1.0.0",
    description="FrasbergAI Genesis-Prime Cognitive Model",
    author="FrasbergAI",
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    install_requires=[
        "fastapi==0.110.0",
        "uvicorn==0.29.0",
        "pydantic==2.6.3",
        "httpx==0.27.0",
        "python-dotenv==1.0.1",
        "prometheus-client==0.20.0",
        "torch>=2.2.0",
        "numpy>=1.26.0",
        "transformers>=4.40.0",
        "sentencepiece>=0.1.99",
        "tqdm>=4.66.0",
        "pyyaml>=6.0.1",
        "rich>=13.7.0",
    ],
    python_requires=">=3.10",
    entry_points={
        "console_scripts": [
            "luchii-cli=luchii.cli:main",
        ]
    },
)
