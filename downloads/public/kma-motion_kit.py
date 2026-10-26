"""motion_kit.py — MASSW 모션 그래픽 도우미 (Pillow + FFmpeg)
사용: from motion_kit import *  → Scene(초) 만들고 draw(t) 함수에서 그림 → render()로 mp4 저장
규격: 1080x1920, 30fps. 한글 굵은 글꼴 자동 탐색(Pretendard/NanumSquare/Noto Sans CJK).
"""
import math, subprocess, glob, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
TEAL, DEEP, CORAL, PEACH = (44, 95, 111), (37, 88, 102), (232, 148, 107), (244, 168, 142)
PAPER, MINT, INK, WHITE = (255, 248, 240), (227, 238, 236), (31, 41, 51), (255, 255, 255)
SAFE_TOP = int(H * 0.15)          # 위 15% 비움
SAFE_BOTTOM = int(H * 0.86)       # 하단 로고·자막 자리

# ---------- 글꼴 ----------
def _find_font():
    pats = ["**/Pretendard*Bold*.[ot]tf", "**/NanumSquare*B*.[ot]tf", "**/NanumGothicBold*.[ot]tf",
            "**/NotoSansCJK-Bold.ttc", "**/NotoSansKR*Bold*.[ot]tf", "**/malgunbd.ttf", "**/AppleSDGothicNeo*.ttc"]
    roots = ["/usr/share/fonts", "/usr/local/share/fonts", os.path.expanduser("~/.fonts"),
             "C:/Windows/Fonts", "/Library/Fonts", "/System/Library/Fonts"]
    for p in pats:
        for r in roots:
            f = glob.glob(os.path.join(r, p), recursive=True)
            if f: return f[0]
    raise RuntimeError("한글 굵은 글꼴을 찾지 못했습니다. Noto Sans KR Bold를 설치하세요.")
FONT_PATH = _find_font()
_fc = {}
def font(size):
    size = int(size)
    if size not in _fc:
        _fc[size] = ImageFont.truetype(FONT_PATH, size)
    return _fc[size]

# ---------- 이징·보간 ----------
def clamp(x, a=0, b=1): return max(a, min(b, x))
def prog(t, start, dur): return clamp((t - start) / dur)           # 0~1 진행률
def ease_out(p): return 1 - (1 - p) ** 3
def ease_in_out(p): return 3 * p * p - 2 * p * p * p
def back_out(p, s=1.70158): p -= 1; return p * p * ((s + 1) * p + s) + 1   # 살짝 튕김(overshoot)
def lerp(a, b, p): return a + (b - a) * p
def mix(c1, c2, p): return tuple(int(lerp(a, b, p)) for a, b in zip(c1, c2))

# ---------- 배경 ----------
def background(t, dur, kind="paper"):
    """kind: paper(아이보리+흐르는 블롭) / teal(딥틸 그라데이션+블롭)"""
    base = PAPER if kind == "paper" else DEEP
    img = Image.new("RGB", (W, H), base)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    cols = [(CORAL, 70), (TEAL, 55), (PEACH, 70)] if kind == "paper" else [(CORAL, 90), (TEAL, 140), (PEACH, 60)]
    for i, (c, a) in enumerate(cols):
        cx = W * (0.2 + 0.3 * i) + math.sin(t * 0.8 + i * 2) * 160
        cy = H * (0.25 + 0.25 * i) + math.cos(t * 0.6 + i) * 220
        r = 420 + 60 * math.sin(t + i)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c + (a,))
    ov = ov.filter(ImageFilter.GaussianBlur(120))
    img.paste(ov, (0, 0), ov)
    # 미세 줌인 (1.0→1.05)
    z = 1 + 0.05 * (t / max(dur, .1))
    if z > 1.001:
        w2, h2 = int(W / z), int(H / z)
        img = img.crop(((W - w2) // 2, (H - h2) // 2, (W + w2) // 2, (H + h2) // 2)).resize((W, H), Image.BILINEAR)
    return img

def dots_grid(img, t, color=TEAL, alpha=28, gap=90):
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    off = (t * 24) % gap
    for y in range(-gap, H + gap, gap):
        for x in range(-gap, W + gap, gap):
            d.ellipse([x + off - 4, y + off - 4, x + off + 4, y + off + 4], fill=color + (alpha,))
    img.paste(ov, (0, 0), ov)

# ---------- 글자 ----------
def text_size(s, size):
    b = font(size).getbbox(s); return b[2] - b[0], b[3] - b[1]

def draw_text(img, s, cx, cy, size, color=INK, scale=1.0, alpha=1.0, shadow=True):
    """가운데 기준 글자. scale/alpha로 팝업·페이드."""
    if alpha <= 0 or scale <= 0: return
    f = font(size); tw, th = text_size(s, size)
    layer = Image.new("RGBA", (tw + 80, th + 80), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    if shadow: d.text((44, 44 + 6), s, font=f, fill=(0, 0, 0, int(26 * alpha)), anchor="lt")
    d.text((40, 40), s, font=f, fill=color + (int(255 * alpha),), anchor="lt")
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.LANCZOS)
    img.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)

def word_pop(img, words, cx, cy, size, t, start=0.0, gap=0.18, color=INK, hi=None, hi_color=CORAL, line_gap=1.25):
    """단어가 차례로 뽁 팝업(0→110%→100%). words 리스트, 한 줄에 하나씩 쌓음. hi=강조 단어 인덱스 set"""
    hi = hi or set()
    for i, w in enumerate(words):
        p = prog(t, start + i * gap, 0.3)
        sc = back_out(p) if p < 1 else 1
        draw_text(img, w, cx, cy + (i - (len(words) - 1) / 2) * size * line_gap, size,
                  hi_color if i in hi else color, scale=sc, alpha=clamp(p * 3))

def typing(img, s, cx, cy, size, t, start=0.0, cps=14, color=INK, cursor=True):
    n = int(clamp((t - start) * cps, 0, len(s)))
    shown = s[:n]
    f = font(size); tw, _ = text_size(s, size)
    x0 = cx - tw / 2
    d = ImageDraw.Draw(img)
    d.text((x0 + 3, cy + 5), shown, font=f, fill=mix(PAPER, INK, .12), anchor="lm")
    d.text((x0, cy), shown, font=f, fill=color, anchor="lm")
    if cursor and (int(t * 3) % 2 == 0 or n < len(s)):
        sw = text_size(shown, size)[0] if shown else 0
        d.rectangle([x0 + sw + 8, cy - size * .55, x0 + sw + 8 + 8, cy + size * .55], fill=CORAL)

def counter(img, target, cx, cy, size, t, start=0.0, dur=1.0, suffix="", color=CORAL):
    p = ease_out(prog(t, start, dur))
    draw_text(img, f"{int(target * p):,}{suffix}", cx, cy, size, color, scale=1 + 0.08 * math.sin(p * math.pi))

# ---------- 도형·카드 ----------
def card(img, cx, cy, w, h, t, start, fr="left", fill=WHITE, border=TEAL, radius=44, label=None, size=64, lcolor=INK):
    """옆에서 슝 날아오는 카드(감속+튕김). fr: left/right/bottom/top"""
    p = prog(t, start, 0.45); q = back_out(p) if p < 1 else 1
    dx = {"left": -W, "right": W}.get(fr, 0) * (1 - q)
    dy = {"bottom": H, "top": -H}.get(fr, 0) * (1 - q) * 0.5
    x, y = cx + dx, cy + dy
    if p <= 0: return
    sh = Image.new("RGBA", (int(w) + 120, int(h) + 120), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([60, 74, 60 + w, 74 + h], radius, fill=(31, 41, 51, 50))
    sh = sh.filter(ImageFilter.GaussianBlur(18)); img.paste(sh, (int(x - w / 2 - 60), int(y - h / 2 - 60)), sh)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x - w / 2, y - h / 2, x + w / 2, y + h / 2], radius, fill=fill, outline=border, width=8)
    if label: draw_text(img, label, x, y, size, lcolor, shadow=False)

def circle_badge(img, cx, cy, r, t, start, color=TEAL, glyph=None, size=80, gcolor=WHITE):
    p = prog(t, start, 0.4); q = back_out(p) if p < 1 else 1
    if p <= 0: return
    rr = r * q; d = ImageDraw.Draw(img)
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=color)
    if glyph: draw_text(img, glyph, cx, cy, int(size * q), gcolor, shadow=False)

def arrow(img, x1, y1, x2, y2, t, start, dur=0.5, color=CORAL, width=14):
    """선이 점점 길어지고 끝에 화살촉이 톡"""
    p = ease_out(prog(t, start, dur))
    if p <= 0: return
    x, y = lerp(x1, x2, p), lerp(y1, y2, p); d = ImageDraw.Draw(img)
    d.line([x1, y1, x, y], fill=color, width=width)
    if p >= 0.98:
        a = math.atan2(y2 - y1, x2 - x1); L = 44
        pts = [(x2, y2), (x2 - L * math.cos(a - .5), y2 - L * math.sin(a - .5)), (x2 - L * math.cos(a + .5), y2 - L * math.sin(a + .5))]
        d.polygon(pts, fill=color)

def frame_draw(img, cx, cy, w, h, t, start, dur=0.7, color=TEAL, width=10):
    """테두리가 한 모서리부터 그려짐(둘레를 따라)"""
    p = ease_in_out(prog(t, start, dur))
    if p <= 0: return
    x0, y0, x1, y1 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
    per = 2 * (w + h); L = per * p; d = ImageDraw.Draw(img)
    segs = [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]
    for (a, b) in segs:
        sl = math.dist(a, b)
        if L <= 0: break
        k = min(1, L / sl)
        d.line([a, (lerp(a[0], b[0], k), lerp(a[1], b[1], k))], fill=color, width=width)
        L -= sl

def highlighter(img, x0, x1, y, t, start, dur=0.4, color=PEACH, height=34):
    """형광펜 밑줄이 그어짐 (글자 아래 y)"""
    p = ease_out(prog(t, start, dur))
    if p <= 0: return
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.rounded_rectangle([x0, y, lerp(x0, x1, p), y + height], 16, fill=color + (170,))
    img.paste(ov, (0, 0), ov)

def bar_chart(img, values, labels, cx, base_y, t, start, max_h=560, bw=150, gap=60, colors=(TEAL, CORAL), label_size=48):
    n = len(values); total = n * bw + (n - 1) * gap; x = cx - total / 2; d = ImageDraw.Draw(img); mx = max(values)
    for i, v in enumerate(values):
        p = ease_out(prog(t, start + i * 0.15, 0.7)); h = max_h * (v / mx) * p
        d.rounded_rectangle([x, base_y - h, x + bw, base_y], 22, fill=colors[i % 2])
        if p > 0.3: draw_text(img, f"{int(v * p)}", x + bw / 2, base_y - h - 44, 56, colors[i % 2], shadow=False)
        draw_text(img, labels[i], x + bw / 2, base_y + 52, label_size, INK, shadow=False)
        x += bw + gap
    d.line([cx - total / 2 - 30, base_y, cx + total / 2 + 30, base_y], fill=INK, width=6)

def gauge(img, pct, cx, cy, r, t, start, dur=1.0, color=CORAL, track=MINT, width=46):
    p = ease_out(prog(t, start, dur)); d = ImageDraw.Draw(img)
    box = [cx - r, cy - r, cx + r, cy + r]
    d.arc(box, -90, 270, fill=track, width=width)
    if p > 0: d.arc(box, -90, -90 + 360 * pct / 100 * p, fill=color, width=width)
    draw_text(img, f"{int(pct * p)}%", cx, cy, int(r * .62), color, shadow=False)

def people_row(img, n_fill, n_total, cx, cy, t, start, size=80, fill=CORAL, empty=MINT):
    """사람 픽토그램 n_total개 중 n_fill개가 차례로 색이 채워짐"""
    d = ImageDraw.Draw(img); gap = size * 1.45; x0 = cx - gap * (n_total - 1) / 2
    for i in range(n_total):
        on = i < n_fill and t > start + i * 0.12
        c = fill if on else empty; x = x0 + i * gap
        d.ellipse([x - size * .28, cy - size * .62, x + size * .28, cy - size * .06], fill=c)
        d.rounded_rectangle([x - size * .42, cy, x + size * .42, cy + size * .75], int(size * .3), fill=c)

def check(img, cx, cy, s, t, start, color=TEAL, width=18):
    p = prog(t, start, 0.35)
    if p <= 0: return
    pts = [(cx - s * .5, cy), (cx - s * .12, cy + s * .4), (cx + s * .55, cy - s * .45)]
    d = ImageDraw.Draw(img)
    if p < .5: d.line([pts[0], (lerp(pts[0][0], pts[1][0], p * 2), lerp(pts[0][1], pts[1][1], p * 2))], fill=color, width=width, joint="curve")
    else:
        q = (p - .5) * 2; d.line([pts[0], pts[1], (lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q))], fill=color, width=width, joint="curve")

def flash(img, t, at, dur=0.15):
    """짧은 흰 플래시(전환)"""
    p = 1 - abs(prog(t, at - dur, dur * 2) * 2 - 1)
    if p > 0:
        ov = Image.new("RGB", (W, H), WHITE); return Image.blend(img, ov, p * .8)
    return img

# ---------- 렌더 ----------
def render(draw_fn, dur, out="scene.mp4", crf=20):
    """draw_fn(t, dur) -> PIL.Image(RGB 1080x1920). 프레임을 FFmpeg로 바로 보내 mp4 저장(무음)."""
    n = int(round(dur * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        img = draw_fn(i / FPS, dur)
        p.stdin.write(img.convert("RGB").tobytes())
    p.stdin.close(); p.wait()
    return out

def save_frame(draw_fn, t, dur, out="frame.png"):
    draw_fn(t, dur).convert("RGB").save(out); return out
