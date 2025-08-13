import sys

import safety.filter as safety_filter


def _clear_log():
    log_path = safety_filter._LOG_PATH
    log_path.write_text("")
    return log_path


def _flush_logs():
    for handler in safety_filter.logger.handlers:
        handler.flush()


def test_logs_consent_denied(monkeypatch):
    log_path = _clear_log()
    monkeypatch.setattr(sys.stdin, "isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda prompt="": "n")

    text = "I am thinking about suicide"
    result = safety_filter.filter_output(text)
    expected = safety_filter.WARNING_TEMPLATE.format(rule="keyword 'suicide'")
    assert result == expected

    _flush_logs()
    content = log_path.read_text()
    assert "consent denied" in content
    assert "keyword 'suicide'" in content
    assert "blocked (keyword 'suicide')" in content


def test_logs_consent_granted(monkeypatch):
    log_path = _clear_log()
    monkeypatch.setattr(sys.stdin, "isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda prompt="": "y")

    text = "I am thinking about suicide"
    result = safety_filter.filter_output(text)
    assert result == text

    _flush_logs()
    content = log_path.read_text()
    assert "consent granted" in content
    assert "keyword 'suicide'" in content
