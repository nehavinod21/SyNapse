"""Generate minimal PWA icon PNGs for SyNAPSE."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, size: int, r: int, g: int, b: int) -> None:
    raw = b""
    for _y in range(size):
        raw += b"\x00" + bytes([r, g, b] * size)
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", compressed)
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    # theme #1a3a5c
    for name, size in [
        ("pwa-192.png", 192),
        ("pwa-512.png", 512),
        ("apple-touch-icon.png", 180),
    ]:
        write_png(PUBLIC / name, size, 0x1A, 0x3A, 0x5C)
    # minimal 16x16 favicon.ico (single PNG embedded is enough for vite; use tiny png as ico substitute)
    write_png(PUBLIC / "favicon.ico", 32, 0x1A, 0x3A, 0x5C)
    print("Wrote icons to", PUBLIC)


if __name__ == "__main__":
    main()
