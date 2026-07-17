#!/usr/bin/env python3
"""
Luxury carousel creator for Mr. Guy Invests.

Format B content (numbered listicles, real-artifact posts) is meant to
be an actual swipeable photo carousel, not a video — this renders it
that way. Reads scripts/carousel-scripts-queue.json (split out of the
video pipeline: create_hook_video.py handles Format A only), and for
each entry renders one slide per hook_lines beat: a luxury-aesthetic
still photo from Pexels (using that beat's matching footage_keyword —
these entries have a 1:1 hook_lines-to-footage_keywords count) with
the beat's text overlaid, same bold-white/black-outline style as the
video pipeline. Slides go into public/carousels/<id>/, and a new entry
is appended to scripts/instagram-queue.json (which instagram_poster.py
and facebook_poster.py both already read).

    ./.hookvideo-venv/bin/python scripts/create_carousel.py
    ./.hookvideo-venv/bin/python scripts/create_carousel.py --test   # placeholder color slides, no Pexels key needed
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAROUSEL_SCRIPTS_QUEUE = os.path.join(REPO, "scripts", "carousel-scripts-queue.json")
CAROUSEL_RENDERS = os.path.join(REPO, "scripts", "carousel-renders.json")
INSTAGRAM_QUEUE = os.path.join(REPO, "scripts", "instagram-queue.json")
CAROUSELS_DIR = os.path.join(REPO, "public", "carousels")
WIDTH, HEIGHT = 2160, 2700
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
HANDLE_FONT_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"
# Pexels sits behind Cloudflare, which blocks urllib's default User-Agent (error 1010).
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def load_env_local():
    path = os.path.join(REPO, ".env.local")
    if not os.path.exists(path):
        return
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def load(path, default):
    try:
        return json.load(open(path))
    except Exception:
        return default


def pexels_photo_search(query, api_key):
    url = f"https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page=3&orientation=portrait"
    req = urllib.request.Request(url, headers={"Authorization": api_key, "User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.load(resp)
    photos = data.get("photos", [])
    if not photos:
        return None
    return photos[0]["src"]["large2x"]


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp, open(dest, "wb") as f:
        f.write(resp.read())


def cover_resize(img):
    """Crop+scale to fill WIDTH x HEIGHT exactly, like CSS object-fit: cover."""
    src_ratio = img.width / img.height
    dst_ratio = WIDTH / HEIGHT
    if src_ratio > dst_ratio:
        new_height = HEIGHT
        new_width = int(new_height * src_ratio)
    else:
        new_width = WIDTH
        new_height = int(new_width / src_ratio)
    img = img.resize((new_width, new_height), Image.LANCZOS)
    left = (new_width - WIDTH) // 2
    top = (new_height - HEIGHT) // 2
    return img.crop((left, top, left + WIDTH, top + HEIGHT))


def wrap_text(draw, text, font, max_width):
    """Balanced 2-line wrap — picks the split point that minimizes the
    longest resulting line, instead of greedily filling the first line
    (which can strand a lone short word alone on the second line)."""
    words = text.split()
    if not words:
        return []
    if draw.textlength(" ".join(words), font=font) <= max_width:
        return [" ".join(words)]

    best_split, best_max = None, float("inf")
    for i in range(1, len(words)):
        line1, line2 = " ".join(words[:i]), " ".join(words[i:])
        w1, w2 = draw.textlength(line1, font=font), draw.textlength(line2, font=font)
        if w1 <= max_width and w2 <= max_width and max(w1, w2) < best_max:
            best_split, best_max = (line1, line2), max(w1, w2)
    if best_split:
        return list(best_split)

    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) > max_width and current:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def render_slide(photo_path, text, slide_num, total_slides, out_path):
    img = Image.open(photo_path).convert("RGB")
    img = cover_resize(img)
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype(FONT_PATH, 96)
    max_width = WIDTH * 0.85
    lines = wrap_text(draw, text, font, max_width)
    line_height = 116
    block_height = line_height * len(lines)
    y = HEIGHT / 2 - block_height / 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((WIDTH / 2 - w / 2, y), line, font=font, fill=(255, 255, 255, 255),
                   stroke_width=6, stroke_fill=(0, 0, 0, 255))
        y += line_height

    handle_font = ImageFont.truetype(HANDLE_FONT_PATH, 42)
    draw.text((60, HEIGHT - 100), f"@mrguyinvests", font=handle_font, fill=(255, 255, 255, 230),
               stroke_width=3, stroke_fill=(0, 0, 0, 200))
    page_label = f"{slide_num}/{total_slides}"
    pw = draw.textlength(page_label, font=handle_font)
    draw.text((WIDTH - 60 - pw, HEIGHT - 100), page_label, font=handle_font, fill=(255, 255, 255, 230),
               stroke_width=3, stroke_fill=(0, 0, 0, 200))

    img.save(out_path)


def build_testsrc_slide(dest, seed):
    color = [(26, 39, 68), (47, 27, 60), (20, 52, 43)][seed % 3]
    Image.new("RGB", (WIDTH, HEIGHT), color).save(dest)


def next_instagram_id(queue):
    return (max((s["id"] for s in queue), default=0)) + 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true",
                         help="use placeholder color slides instead of real Pexels photos")
    args = parser.parse_args()

    load_env_local()
    api_key = os.environ.get("PEXELS_API_KEY")
    if not args.test and not api_key:
        print("PEXELS_API_KEY not set in .env.local — run with --test to verify the "
              "pipeline without it, or grab a free key from pexels.com/api")
        sys.exit(1)

    scripts = load(CAROUSEL_SCRIPTS_QUEUE, [])
    rendered = load(CAROUSEL_RENDERS, [])
    done_ids = {r["script_id"] for r in rendered}
    pending = [s for s in scripts if s["id"] not in done_ids]

    if not pending:
        print("No pending carousel scripts to render.")
        return

    ig_queue = load(INSTAGRAM_QUEUE, [])

    for entry in pending:
        print(f"Rendering carousel for script #{entry['id']}...")
        hook_lines = entry["hook_lines"]
        keywords = entry["footage_keywords"]
        if len(keywords) < len(hook_lines):
            print(f"  SKIP #{entry['id']}: {len(hook_lines)} slides but only {len(keywords)} footage_keywords")
            continue

        ig_id = next_instagram_id(ig_queue)
        out_dir = os.path.join(CAROUSELS_DIR, f"{ig_id:02d}")
        os.makedirs(out_dir, exist_ok=True)

        image_names = []
        for i, line in enumerate(hook_lines):
            slide_path = os.path.join(out_dir, f"{i + 1:02d}.png")
            tmp_photo = os.path.join(out_dir, f"_src_{i + 1:02d}.jpg")
            keyword = keywords[i]
            link = None if args.test else pexels_photo_search(keyword, api_key)
            if link:
                download(link, tmp_photo)
                render_slide(tmp_photo, line["text"], i + 1, len(hook_lines), slide_path)
                os.remove(tmp_photo)
            else:
                if not args.test:
                    print(f"  no Pexels photo for '{keyword}', using placeholder")
                build_testsrc_slide(tmp_photo, i + entry["id"])
                render_slide(tmp_photo, line["text"], i + 1, len(hook_lines), slide_path)
                os.remove(tmp_photo)
            image_names.append(f"{ig_id:02d}/{i + 1:02d}.png")

        hashtags = " ".join(entry.get("hashtags", []))
        ig_queue.append({
            "id": ig_id,
            "images": image_names,
            "caption": f"{entry['caption']}\n\n{hashtags}".strip(),
        })
        json.dump(ig_queue, open(INSTAGRAM_QUEUE, "w"), indent=2)

        rendered.append({"script_id": entry["id"], "instagram_id": ig_id})
        json.dump(rendered, open(CAROUSEL_RENDERS, "w"), indent=2)
        print(f"  done -> public/carousels/{ig_id:02d}/ ({len(image_names)} slides), "
              f"added to instagram-queue.json as #{ig_id}")


if __name__ == "__main__":
    main()
