from kistenpacker.extract import _clean_name


def test_rejects_traversal():
    # Pfade aus dem Archiv dürfen nicht außerhalb des Zielordners landen.
    assert _clean_name("/etc/passwd") == "etc/passwd"
    assert _clean_name("//srv/app/config.py") == "srv/app/config.py"
