from luchii import LuchiiModel


def test_model_load():
    model = LuchiiModel.load("genesis-prime")
    assert model.config["model_name"] == "genesis-prime"
    assert model.backend_name == "template"


def test_model_generate():
    model = LuchiiModel.load()
    out = model.generate("Hello")
    assert "Hello" in out


def test_model_domain_methods():
    model = LuchiiModel.load()
    market = model.analyze_market("AAPL", "1h", "balanced")
    assert market["signal"] in {"long", "hold", "short"}
    assist = model.assist_rep("follow-up", "Customer asked about next steps")
    assert assist["tone"] == "professional"
