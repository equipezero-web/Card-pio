#!/usr/bin/env python3
"""Gera QR Code para URL pública da versão publicada do cardápio."""
import argparse
from pathlib import Path
from urllib.parse import urlparse
try:
    import qrcode
except ImportError:
    raise SystemExit('Instale a dependência: pip install qrcode[pil]')

parser = argparse.ArgumentParser(description='Gera QR Code do cardápio 3D hospedado')
parser.add_argument('url', help='Endereço público HTTPS do cardápio, ex.: https://empresa.github.io/cardapio/')
parser.add_argument('--saida', default='qr-cardapio.png', help='Nome do PNG de saída')
args = parser.parse_args()
url = args.url.strip()
if urlparse(url).scheme != 'https' or not urlparse(url).netloc:
    raise SystemExit('Para a experiência AR, informe a URL pública começando com https://')
qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=13, border=4)
qr.add_data(url)
qr.make(fit=True)
img = qr.make_image(fill_color='#232724', back_color='white').convert('RGB')
path = Path(args.saida)
img.save(path)
print(f'QR Code criado: {path.resolve()}')
print(f'Destino: {url}')
