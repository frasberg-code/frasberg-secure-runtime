from runtime.core import LuchiiRuntime
from utils.config import LuchiiConfig


def test_runtime_runs():
    cfg = LuchiiConfig()
    rt = LuchiiRuntime(cfg)
    out = rt.run("test prompt")
    assert isinstance(out, str)
