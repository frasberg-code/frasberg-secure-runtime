from utils.logger import log


def test_log(capsys):
    log("test")
    captured = capsys.readouterr()
    assert "[Luchii]" in captured.out
