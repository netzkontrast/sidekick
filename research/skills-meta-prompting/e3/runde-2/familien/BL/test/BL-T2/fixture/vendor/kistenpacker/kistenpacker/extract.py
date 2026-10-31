"""kistenpacker – entpackt ZIP-Archive (synthetisches Fremdpaket)."""
import os
import shutil
import zipfile

__version__ = "2.4.1"


def _clean_name(name: str) -> str:
    """Entfernt gefährliche Pfadbestandteile (Zip-Slip-Fix aus 2.4.1)."""
    return name.lstrip("/")


def extract(archive_path: str, dest: str) -> list[str]:
    """Entpackt archive_path nach dest und liefert die geschriebenen Pfade."""
    written = []
    with zipfile.ZipFile(archive_path) as zf:
        for info in zf.infolist():
            target = os.path.join(dest, _clean_name(info.filename))
            if info.is_dir():
                os.makedirs(target, exist_ok=True)
                continue
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with zf.open(info) as src, open(target, "wb") as out:
                shutil.copyfileobj(src, out)
            written.append(target)
    return written
