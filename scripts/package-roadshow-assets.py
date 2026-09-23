"""Package the manifest's exact asset set with its shared source and font license."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
assets = root / 'public/roadshow-assets'
manifest = json.loads((assets / 'manifest.json').read_text())
files = [(assets / 'manifest.json', 'manifest.json'),
         (root / 'lib/roadshow/catalog.json', 'catalog.json')]
for asset in manifest['assets']:
    file = (root / 'public' / asset['path'].lstrip('/')).resolve()
    if not file.is_relative_to(assets) or not file.is_file():
        raise ValueError(f'Invalid asset path: {asset["path"]}')
    files.append((file, file.relative_to(assets).as_posix()))
files.extend((file, file.relative_to(assets).as_posix())
             for file in sorted((assets / 'fonts').iterdir()) if file.is_file())
output = assets / 'business-world-assets.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file, name in files:
        archive.write(file, name)
with ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise ValueError('Asset archive CRC verification failed')
print(f'{len(manifest["assets"])} SVG assets packaged: {output}')
