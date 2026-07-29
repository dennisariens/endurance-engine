#!/usr/bin/env python3
from pathlib import Path
import math
import struct
import zlib

root = Path(__file__).resolve().parents[1]
build = root / 'build'
iconset = build / 'AERION.iconset'
build.mkdir(exist_ok=True)
iconset.mkdir(exist_ok=True)

BASE = (3, 6, 11, 255)
ICE = (125, 211, 252, 255)
CYAN = (56, 189, 248, 255)
WHITE = (229, 238, 252, 255)
PINK = (244, 63, 94, 245)
AMBER = (245, 158, 11, 210)

def blend(dst, src):
    sr, sg, sb, sa = src
    dr, dg, db, da = dst
    a = sa / 255
    ia = 1 - a
    return (int(sr * a + dr * ia), int(sg * a + dg * ia), int(sb * a + db * ia), 255)

def inside_round(x, y, n, r):
    if r <= x < n-r or r <= y < n-r:
        return True
    cx = r if x < r else n-r-1
    cy = r if y < r else n-r-1
    return (x-cx)**2 + (y-cy)**2 <= r*r

def point_in_poly(x, y, pts):
    inside = False
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi):
            inside = not inside
        j = i
    return inside

def dist_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    x, y = ax + t * dx, ay + t * dy
    return math.hypot(px - x, py - y)

def draw_icon(n):
    radius = int(n * 0.205)
    pixels = [(0, 0, 0, 0)] * (n * n)
    cx1, cy1, r1 = n * .30, n * .05, n * .75
    cx2, cy2, r2 = n * .86, n * .84, n * .54
    bands = []
    for off, col in [(-.17, ICE), (0, WHITE), (.17, PINK)]:
        w = .09
        bands.append(([(.25+off, .91), (.25+off+w, .91), (.75+off+w, .09), (.75+off, .09)], col))
    a_left = [(0.25, 0.78), (0.42, 0.22), (0.52, 0.22), (0.36, 0.78)]
    a_right = [(0.48, 0.22), (0.58, 0.22), (0.76, 0.78), (0.62, 0.78)]
    a_cross = [(0.39, 0.56), (0.61, 0.56), (0.64, 0.66), (0.36, 0.66)]
    plus_h = [(0.64, 0.68), (0.78, 0.68), (0.78, 0.73), (0.64, 0.73)]
    plus_v = [(0.685, 0.635), (0.735, 0.635), (0.735, 0.775), (0.685, 0.775)]

    for y in range(n):
        for x in range(n):
            if not inside_round(x, y, n, radius):
                continue
            color = BASE
            # soft glows
            d1 = math.hypot(x - cx1, y - cy1) / r1
            if d1 < 1:
                alpha = int((1 - d1) ** 2 * 62)
                color = blend(color, (56, 189, 248, alpha))
            d2 = math.hypot(x - cx2, y - cy2) / r2
            if d2 < 1:
                alpha = int((1 - d2) ** 2 * 46)
                color = blend(color, (244, 63, 94, alpha))
            # diagonal bands
            fx, fy = x / n, y / n
            for pts, col in bands:
                if point_in_poly(fx, fy, pts):
                    color = blend(color, col)
            # telemetry ring
            rcx, rcy = n * .5, n * .5
            rr = n * .30
            dist = math.hypot(x - rcx, y - rcy)
            if abs(dist - rr) < max(1, n * .012):
                color = blend(color, (125, 211, 252, 95))
            angle = (math.degrees(math.atan2(y - rcy, x - rcx)) + 360) % 360
            if abs(dist - rr) < max(2, n * .022) and (angle > 215 or angle < 32):
                color = blend(color, CYAN)
            # A mark polygons
            if point_in_poly(fx, fy, a_left) or point_in_poly(fx, fy, a_right) or point_in_poly(fx, fy, a_cross):
                color = blend(color, WHITE)
            if point_in_poly(fx, fy, plus_h) or point_in_poly(fx, fy, plus_v):
                color = blend(color, ICE)
            pixels[y*n+x] = color
    return pixels

def write_png(path, n, pixels):
    raw = b''.join(b'\x00' + bytes(v for px in pixels[y*n:(y+1)*n] for v in px) for y in range(n))
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)

for size in [16, 32, 64, 128, 256, 512, 1024]:
    pixels = draw_icon(size)
    if size <= 512:
        write_png(iconset / f'icon_{size}x{size}.png', size, pixels)
    if size * 2 <= 1024:
        pixels2 = draw_icon(size * 2)
        write_png(iconset / f'icon_{size}x{size}@2x.png', size * 2, pixels2)
write_png(build / 'icon.png', 1024, draw_icon(1024))
print(iconset)
