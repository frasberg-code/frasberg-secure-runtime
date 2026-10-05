from pipelines.preprocess import preprocess
from pipelines.postprocess import postprocess


def test_preprocess():
    assert preprocess("  hi  ") == "hi"


def test_postprocess():
    assert postprocess("output") == "output"
