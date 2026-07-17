#!/usr/bin/env python3
"""
Creator pipeline for the new "cinematic hook" short-video format
(stock B-roll + bold centered text overlay, cloning the proven TikTok
formats logged in trend-scout-input.json rather than static graphic
slides).

Reads scripts/video-scripts-queue.json for entries not yet rendered,
sources stock B-roll per entry's footage_keywords from Pexels, cuts it
to size with ffmpeg, overlays each hook line at its timestamp, muxes
in an optional music track, and appends the finished file to
scripts/hook-videos-queue.json for the platform posters to pick up.

Runs locally (not on the droplet — video encoding is too heavy for
its 512MB/1vCPU), inside the dedicated .hookvideo-venv (this repo's
local ffmpeg build has no drawtext/freetype support, so text hooks
are rendered as PNG overlays via Pillow instead):

    ./.hookvideo-venv/bin/python scripts/create_hook_video.py
    ./.hookvideo-venv/bin/python scripts/create_hook_video.py --test   # no Pexels key needed;
                                                                        # verifies the ffmpeg
                                                                        # pipeline with placeholder clips
    ./.hookvideo-venv/bin/python scripts/create_hook_video.py --music path/to/track.mp3
    ./.hookvideo-venv/bin/python scripts/create_hook_video.py --use-movie-clips

One-time setup: python3 -m venv .hookvideo-venv && ./.hookvideo-venv/bin/pip install Pillow

Movie-clip B-roll (optional, --use-movie-clips): some of the best-
performing examples we scouted use real movie/show footage (Wolf of
Wall Street, Succession) instead of generic stock. Real clips carry
copyright/takedown risk, so per-topic use is manual and reviewed, not
part of the automated pipeline. To use it: drop your own sourced clip
files into stock-footage/movie-clips/ (gitignored — these files must
never be committed/pushed, they're for local rendering only) and add
entries to stock-footage/movie-clips/manifest.json:
    [{"tags": ["wall street office", "trading floor"],
      "file": "wolf-of-wall-street-office.mp4", "start": 12, "end": 16}]
"start"/"end" are the seconds within that source file to extract. With
--use-movie-clips, each footage_keyword is matched against "tags"
first (falling back to Pexels/placeholder if nothing matches).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_QUEUE = os.path.join(REPO, "scripts", "video-scripts-queue.json")
VIDEOS_QUEUE = os.path.join(REPO, "scripts", "hook-videos-queue.json")
OUTPUT_DIR = os.path.join(REPO, "public", "hook-videos")
MOVIE_CLIPS_DIR = os.path.join(REPO, "stock-footage", "movie-clips")
MOVIE_CLIPS_MANIFEST = os.path.join(MOVIE_CLIPS_DIR, "manifest.json")
WIDTH, HEIGHT = 1080, 1920
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


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


def pexels_search(query, api_key):
    url = f"https://api.pexels.com/videos/search?query={urllib.parse.quote(query)}&per_page=3&orientation=portrait"
    req = urllib.request.Request(url, headers={"Authorization": api_key})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.load(resp)
    videos = data.get("videos", [])
    if not videos:
        return None
    files = sorted(videos[0]["video_files"], key=lambda f: f.get("width", 0), reverse=True)
    return files[0]["link"] if files else None


def find_movie_clip(keyword, manifest):
    keyword_words = set(keyword.lower().split())
    for entry in manifest:
        for tag in entry.get("tags", []):
            tag_words = set(tag.lower().split())
            if keyword_words & tag_words:
                return entry
    return None


def extract_movie_clip_segment(entry, duration, dest):
    source = os.path.join(MOVIE_CLIPS_DIR, entry["file"])
    subprocess.run([
        "ffmpeg", "-y", "-ss", str(entry["start"]), "-i", source,
        "-t", str(duration), "-an", dest,
    ], check=True, capture_output=True)


def build_testsrc_clip(dest, duration, seed):
    """Deterministic colored placeholder clip — lets us verify the
    assembly/text-overlay pipeline without a real Pexels key."""
    color = ["0x1a2744", "0x2f1b3c", "0x14342b"][seed % 3]
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"color=c={color}:s={WIDTH}x{HEIGHT}:d={duration}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", dest,
    ], check=True, capture_output=True)


def render_text_png(text, path):
    """Bold centered text on a semi-transparent dark box, transparent
    elsewhere — composited onto the video with ffmpeg's overlay filter.
    (Our local ffmpeg build has no freetype/drawtext support, so text
    is rendered here instead of via ffmpeg's own text filter.)"""
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 64)

    # Wrap long lines to ~80% of frame width instead of overflowing it.
    words = text.split()
    lines, current = [], ""
    max_width = WIDTH * 0.8
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) > max_width and current:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)

    line_height = 78
    block_height = line_height * len(lines)
    pad = 30
    box_top = HEIGHT / 2 - block_height / 2 - pad
    box_bottom = HEIGHT / 2 + block_height / 2 + pad
    box_width = max(draw.textlength(l, font=font) for l in lines) + pad * 2
    box_left = WIDTH / 2 - box_width / 2
    box_right = WIDTH / 2 + box_width / 2
    draw.rounded_rectangle([box_left, box_top, box_right, box_bottom],
                            radius=18, fill=(0, 0, 0, 90))

    y = HEIGHT / 2 - block_height / 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((WIDTH / 2 - w / 2, y), line, font=font, fill=(255, 255, 255, 255))
        y += line_height

    img.save(path)


def assemble(clip_paths, hook_lines, music_path, out_path):
    total_duration = max(l["end"] for l in hook_lines)
    with tempfile.TemporaryDirectory() as tmp:
        seg_duration = total_duration / len(clip_paths)
        normalized = []
        for i, clip in enumerate(clip_paths):
            norm = os.path.join(tmp, f"norm_{i}.mp4")
            subprocess.run([
                "ffmpeg", "-y", "-i", clip, "-t", str(seg_duration),
                "-vf", f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT}",
                "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", norm,
            ], check=True, capture_output=True)
            normalized.append(norm)

        concat_list = os.path.join(tmp, "concat.txt")
        with open(concat_list, "w") as f:
            for n in normalized:
                f.write(f"file '{n}'\n")
        concatenated = os.path.join(tmp, "concat.mp4")
        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
            "-c", "copy", concatenated,
        ], check=True, capture_output=True)

        png_paths = []
        for i, line in enumerate(hook_lines):
            png_path = os.path.join(tmp, f"text_{i}.png")
            render_text_png(line["text"], png_path)
            png_paths.append(png_path)

        cmd = ["ffmpeg", "-y", "-i", concatenated]
        for png in png_paths:
            cmd += ["-i", png]
        if music_path:
            cmd += ["-i", music_path]

        filter_parts = []
        last_label = "0:v"
        for i, line in enumerate(hook_lines):
            out_label = f"v{i}"
            filter_parts.append(
                f"[{last_label}][{i + 1}:v]overlay=enable='between(t,{line['start']},{line['end']})'[{out_label}]"
            )
            last_label = out_label
        filter_complex = ";".join(filter_parts)

        cmd += ["-filter_complex", filter_complex, "-map", f"[{last_label}]"]
        if music_path:
            audio_idx = len(png_paths) + 1
            fade_start = max(total_duration - 1.2, 0)
            cmd += [
                "-map", f"{audio_idx}:a", "-shortest",
                "-af", f"afade=t=in:d=0.4,afade=t=out:st={fade_start}:d=1.2",
            ]
        cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p"]
        if music_path:
            cmd += ["-c:a", "aac"]
        cmd += [out_path]
        subprocess.run(cmd, check=True, capture_output=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true",
                         help="use placeholder color clips instead of real Pexels footage")
    parser.add_argument("--music", help="optional path to a local music track to mux in")
    parser.add_argument("--use-movie-clips", action="store_true",
                         help="prefer local stock-footage/movie-clips/ over Pexels when a tag matches")
    args = parser.parse_args()

    load_env_local()
    movie_manifest = load(MOVIE_CLIPS_MANIFEST, []) if args.use_movie_clips else []
    api_key = os.environ.get("PEXELS_API_KEY")
    if not args.test and not api_key:
        print("PEXELS_API_KEY not set in .env.local — run with --test to verify the "
              "pipeline without it, or grab a free key from pexels.com/api")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scripts = load(SCRIPTS_QUEUE, [])
    videos = load(VIDEOS_QUEUE, [])
    done_ids = {v["id"] for v in videos}
    pending = [s for s in scripts if s["id"] not in done_ids]

    if not pending:
        print("No pending scripts to render.")
        return

    for entry in pending:
        print(f"Rendering script #{entry['id']}...")
        with tempfile.TemporaryDirectory() as tmp:
            clip_paths = []
            for i, keyword in enumerate(entry["footage_keywords"]):
                dest = os.path.join(tmp, f"clip_{i}.mp4")
                movie_clip = find_movie_clip(keyword, movie_manifest) if args.use_movie_clips else None
                if movie_clip:
                    print(f"  using movie clip for '{keyword}': {movie_clip['file']}")
                    extract_movie_clip_segment(movie_clip, 4, dest)
                    clip_paths.append(dest)
                    continue
                link = None if args.test else pexels_search(keyword, api_key)
                if link:
                    urllib.request.urlretrieve(link, dest)
                else:
                    if not args.test:
                        print(f"  no Pexels result for '{keyword}', using placeholder")
                    build_testsrc_clip(dest, 4, i + entry["id"])
                clip_paths.append(dest)

            out_name = f"hook-{entry['id']:02d}.mp4"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            assemble(clip_paths, entry["hook_lines"], args.music, out_path)

        videos.append({
            "id": entry["id"],
            "video": out_name,
            "caption": entry["caption"],
            "hashtags": entry.get("hashtags", []),
            "based_on_format": entry.get("based_on_format", ""),
            "platform_targets": entry.get("platform_targets", []),
        })
        json.dump(videos, open(VIDEOS_QUEUE, "w"), indent=2)
        print(f"  done -> public/hook-videos/{out_name}")


if __name__ == "__main__":
    main()
