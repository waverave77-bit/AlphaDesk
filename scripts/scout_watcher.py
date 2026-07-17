#!/usr/bin/env python3
"""
Local trend-scouting watcher for Mr. Guy Invests.

Runs on the Mac (not the droplet) because TikTok blocks datacenter IPs
at the anti-bot/JS-challenge level — a residential connection like this
one gets through fine. Polls the droplet every 30s for a "run requested"
flag (set by the dashboard's Run button), and when present: reads the
pending-link inbox, scrapes each pending TikTok link for real (Playwright,
real stats straight from the page's own data, real caption, real audio
downloaded and transcribed with Whisper, AND real frames/carousel images
sent to Claude's vision API so it actually understands what's on
screen — the on-screen text overlay, the visual aesthetic, and which of
content-style-guide.md's two formats it matches), writes the results
into trend-scout-input.json (which the strategist agent reads), pushes
to git, flips those links from "pending" to "seen" on the droplet, and
clears the flag.

One-time setup (already done once, but if this is a fresh machine):
    python3 -m venv .scout-venv
    ./.scout-venv/bin/pip install playwright openai-whisper anthropic
    ./.scout-venv/bin/playwright install chromium
    (visual analysis reads ANTHROPIC_API_KEY from .env.local — already
    there since the Next.js app uses it too)

Run it:
    ./.scout-venv/bin/python scripts/scout_watcher.py            # poll loop, Ctrl-C to stop
    ./.scout-venv/bin/python scripts/scout_watcher.py --once      # single check-and-process, for testing

Instagram links are saved by the dashboard but NOT processed here yet —
Instagram's page structure and anti-bot behavior haven't been tested the
way TikTok's has. They stay "pending" until that's built.
"""
import argparse
import base64
import datetime
import glob
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SSH_KEY = os.path.expanduser("~/.ssh/droplet_access")
SSH_HOST = "root@167.172.147.89"
REMOTE_PENDING = "/root/pending-trend-links.json"
REMOTE_FLAG = "/root/scout-run-requested.json"
REMOTE_STATUS = "/root/scout-last-run.json"
TREND_FILE = os.path.join(REPO, "scripts", "trend-scout-input.json")
STYLE_GUIDE_FILE = os.path.join(REPO, "scripts", "content-style-guide.md")
MAX_TREND_ENTRIES = 20
MAX_VISUALS_PER_ITEM = 6
POLL_SECONDS = 30
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

_whisper_model = None
_anthropic_key = None


def log(msg):
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def get_anthropic_key():
    global _anthropic_key
    if _anthropic_key is None:
        env_path = os.path.join(REPO, ".env.local")
        for line in open(env_path):
            line = line.strip()
            if line.startswith("ANTHROPIC_API_KEY="):
                _anthropic_key = line.split("=", 1)[1].strip().strip('"')
                break
    return _anthropic_key


def ssh(cmd):
    result = subprocess.run(
        ["ssh", "-i", SSH_KEY, "-o", "ConnectTimeout=10", SSH_HOST, cmd],
        capture_output=True, text=True, timeout=30,
    )
    return result.returncode, result.stdout, result.stderr


def remote_file_exists(path):
    code, _, _ = ssh(f"test -f {path}")
    return code == 0


def remote_read_json(path, default):
    code, out, _ = ssh(f"cat {path} 2>/dev/null")
    if code != 0 or not out.strip():
        return default
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return default


def remote_write_json(path, data):
    payload = json.dumps(data, indent=2)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        f.write(payload)
        local_tmp = f.name
    subprocess.run(["scp", "-i", SSH_KEY, local_tmp, f"{SSH_HOST}:{path}"], check=True, capture_output=True)
    os.unlink(local_tmp)


def remote_delete(path):
    ssh(f"rm -f {path}")


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        log("loading Whisper model (first run only, cached after)...")
        _whisper_model = whisper.load_model("base")
    return _whisper_model


def scrape_tiktok(url, tmp_dir):
    """Returns a dict with real caption/stats/author/audio_transcript/visual
    frames or images, or {'error': ...}.
    Video posts render their item data inline (a __UNIVERSAL_DATA_FOR_REHYDRATION__
    script tag with a 'webapp.video-detail' key) — no follow-up request needed.
    Photo/carousel posts DON'T include that key inline; they fetch the same
    item data lazily via an /api/item/detail/ XHR instead. We try the inline
    tag first (covers videos, no need to wait on a network round-trip) and
    fall back to intercepting the XHR (covers photos) if that key is missing."""
    from playwright.sync_api import sync_playwright

    captured = {}

    def on_response(response):
        if "/api/item/detail/" in response.url and "data" not in captured:
            try:
                captured["data"] = response.json()
            except Exception:
                pass

    visual_paths = []
    post_type = "video"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=USER_AGENT)
        page.on("response", on_response)
        try:
            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            page.wait_for_timeout(5000)
            script_content = page.evaluate(
                "() => { const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__'); return el ? el.textContent : null; }"
            )

            item = None
            if script_content:
                try:
                    inline_data = json.loads(script_content)
                    item = inline_data["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
                except (KeyError, TypeError, json.JSONDecodeError):
                    item = None
            if item is None and "data" in captured:
                try:
                    item = captured["data"]["itemInfo"]["itemStruct"]
                except (KeyError, TypeError):
                    item = None
            if item is None:
                return {"error": "could not find item data via either the inline page data or the item/detail XHR — TikTok may have changed something, or this is a challenge/blocked response"}

            image_post = item.get("imagePost")
            if image_post:
                post_type = "carousel"
                for i, img in enumerate((image_post.get("images") or [])[:MAX_VISUALS_PER_ITEM]):
                    url_list = (img.get("imageURL") or {}).get("urlList", [])
                    if not url_list:
                        continue
                    try:
                        resp = page.request.get(url_list[0], headers={"Referer": "https://www.tiktok.com/"})
                        if resp.status == 200:
                            path = os.path.join(tmp_dir, f"slide_{i:02d}.jpg")
                            open(path, "wb").write(resp.body())
                            visual_paths.append(path)
                    except Exception as e:
                        log(f"  couldn't fetch carousel slide {i} (non-fatal): {e}")
            else:
                video_url = (item.get("video") or {}).get("playAddr")
                if video_url:
                    try:
                        resp = page.request.get(video_url, headers={"Referer": "https://www.tiktok.com/"})
                        if resp.status == 200:
                            video_path = os.path.join(tmp_dir, "video.mp4")
                            open(video_path, "wb").write(resp.body())
                            frame_pattern = os.path.join(tmp_dir, "frame_%02d.jpg")
                            subprocess.run(
                                ["ffmpeg", "-y", "-i", video_path, "-vf", "fps=1/3", frame_pattern],
                                check=True, capture_output=True, timeout=30,
                            )
                            visual_paths = sorted(glob.glob(os.path.join(tmp_dir, "frame_*.jpg")))[:MAX_VISUALS_PER_ITEM]
                    except Exception as e:
                        log(f"  couldn't extract video frames (non-fatal): {e}")
        finally:
            browser.close()

    stats = item.get("stats") or item.get("statsV2") or {}
    result = {
        "account": item.get("author", {}).get("uniqueId", "?"),
        "caption": item.get("desc", ""),
        "post_type": post_type,
        "visual_paths": visual_paths,
        "stats": {
            "likes": int(stats.get("diggCount", 0) or 0),
            "saves": int(stats.get("collectCount", 0) or 0),
            "shares": int(stats.get("shareCount", 0) or 0),
            "comments": int(stats.get("commentCount", 0) or 0),
            "plays": int(stats.get("playCount", 0) or 0),
        },
    }

    audio_url = (item.get("music") or {}).get("playUrl")
    transcript = None
    if audio_url:
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                audio_path = f.name
            req = urllib.request.Request(audio_url, headers={"User-Agent": USER_AGENT, "Referer": "https://www.tiktok.com/"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                with open(audio_path, "wb") as out:
                    out.write(resp.read())
            model = get_whisper_model()
            transcribed = model.transcribe(audio_path)
            transcript = transcribed.get("text", "").strip()
            os.unlink(audio_path)
        except Exception as e:
            transcript = None
            log(f"  audio transcription failed (non-fatal): {e}")

    result["audio_note"] = (
        f'spoken audio, transcribed: "{transcript}"' if transcript
        else "instrumental/music or no clear speech detected"
    )
    return result


def analyze_visuals(visual_paths, post_type, audio_note, caption):
    """Sends real frames/carousel images to Claude's vision API to get an
    actual understanding of the content — on-screen text, visual aesthetic,
    and which of the two proven formats (from content-style-guide.md) this
    matches. Returns None (caller falls back to a placeholder) if anything
    goes wrong — this is enrichment, not a required step."""
    api_key = get_anthropic_key()
    if not api_key or not visual_paths:
        return None
    try:
        import anthropic
    except ImportError:
        return None

    style_guide = ""
    if os.path.exists(STYLE_GUIDE_FILE):
        style_guide = open(STYLE_GUIDE_FILE).read()[:4000]

    prompt = f"""You're analyzing a scraped TikTok {post_type} for a financial-literacy content strategy pipeline. Attached are real frames (if a video) or real carousel slide images (if a carousel).

Real audio transcript: {audio_note}
Real caption: {caption}

Here's our content style guide defining the two proven formats — use it to classify this post, don't invent a third category:
---
{style_guide}
---

Look at the actual images and respond with ONLY a JSON object, no other text, no markdown fences:
{{"on_screen_text": "the exact on-screen text overlay if a video, or a summary of each slide's text if a carousel", "visual_description": "what's actually shown - backgrounds, objects, aesthetic, cuts, colors", "format_classification": "which of Format A or Format B this matches and why, 1-2 sentences", "why_it_works": "1 sentence grounded in what you actually see plus the stats"}}"""

    content = [{"type": "text", "text": prompt}]
    for path in visual_paths:
        with open(path, "rb") as f:
            img_b64 = base64.standard_b64encode(f.read()).decode()
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64}})

    try:
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(model="claude-sonnet-5", max_tokens=500, messages=[{"role": "user", "content": content}])
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        log(f"  visual analysis failed (non-fatal): {e}")
        return None


def process_one(entry):
    url = entry["url"]
    log(f"scraping {url} ...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        scraped = scrape_tiktok(url, tmp_dir)
        if "error" in scraped:
            log(f"  FAILED: {scraped['error']}")
            return None
        log(f"  got: @{scraped['account']} — {scraped['stats']['likes']} likes, {scraped['stats']['saves']} saves, {scraped['post_type']}, {len(scraped['visual_paths'])} visual(s) captured")

        analysis = analyze_visuals(scraped["visual_paths"], scraped["post_type"], scraped["audio_note"], scraped["caption"])

    if analysis:
        log("  visual analysis: " + analysis.get("format_classification", "")[:100])
        return {
            "platform": "tiktok",
            "account": scraped["account"],
            "post_type": scraped["post_type"],
            "format": analysis.get("format_classification", "not classified"),
            "hook_text": analysis.get("on_screen_text") or scraped["caption"] or "(no caption)",
            "visual_description": analysis.get("visual_description", ""),
            "audio_note": scraped["audio_note"],
            "stats": {
                "likes": scraped["stats"]["likes"],
                "saves": scraped["stats"]["saves"],
                "shares": scraped["stats"]["shares"],
            },
            "why_it_works": analysis.get("why_it_works", "not analyzed"),
        }

    log("  (visual analysis unavailable — saving with raw data only)")
    return {
        "platform": "tiktok",
        "account": scraped["account"],
        "post_type": scraped["post_type"],
        "format": "not yet classified — visual analysis unavailable this run, review before use",
        "hook_text": scraped["caption"] or "(no caption)",
        "audio_note": scraped["audio_note"],
        "stats": {
            "likes": scraped["stats"]["likes"],
            "saves": scraped["stats"]["saves"],
            "shares": scraped["stats"]["shares"],
        },
        "why_it_works": "not yet analyzed",
    }


def run_once():
    if not remote_file_exists(REMOTE_FLAG):
        log("no run requested, nothing to do")
        return

    log("run requested — starting")
    pending = remote_read_json(REMOTE_PENDING, [])
    to_process = [p for p in pending if p.get("status") == "pending" and p.get("platform") == "tiktok"]
    skipped_instagram = [p for p in pending if p.get("status") == "pending" and p.get("platform") != "tiktok"]

    if not to_process:
        log("no pending TikTok links to process")
        remote_delete(REMOTE_FLAG)
        remote_write_json(REMOTE_STATUS, {
            "completed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "processed_count": 0,
            "skipped_instagram_count": len(skipped_instagram),
            "errors": [],
        })
        return

    new_entries = []
    processed_urls = []
    errors = []
    for entry in to_process:
        result = process_one(entry)
        if result:
            new_entries.append(result)
            processed_urls.append(entry["url"])
        else:
            errors.append(entry["url"])
        time.sleep(3)  # be a reasonable neighbor, not a hammer

    if new_entries:
        trend = json.load(open(TREND_FILE)) if os.path.exists(TREND_FILE) else {"entries": []}
        trend["collected_at"] = datetime.date.today().isoformat()
        trend["entries"] = (trend.get("entries", []) + new_entries)[-MAX_TREND_ENTRIES:]
        json.dump(trend, open(TREND_FILE, "w"), indent=2)

        subprocess.run(["git", "-C", REPO, "add", "scripts/trend-scout-input.json"], check=True, capture_output=True)
        commit = subprocess.run(
            ["git", "-C", REPO, "commit", "-q", "-m",
             f"Add {len(new_entries)} scouted TikTok link(s) via scout_watcher\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"],
            capture_output=True, text=True,
        )
        if commit.returncode == 0:
            pull = subprocess.run(["git", "-C", REPO, "pull", "--no-edit", "origin", "main"], capture_output=True, text=True)
            push = subprocess.run(["git", "-C", REPO, "push", "origin", "main"], capture_output=True, text=True)
            if push.returncode != 0:
                log(f"  WARNING: git push failed: {push.stderr[:300]}")
                errors.append(f"git push failed: {push.stderr[:200]}")
        else:
            log(f"  WARNING: git commit failed (maybe no repo changes?): {commit.stderr[:300]}")

    if processed_urls:
        for p in pending:
            if p.get("url") in processed_urls:
                p["status"] = "seen"
                p["processed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        remote_write_json(REMOTE_PENDING, pending)

    remote_delete(REMOTE_FLAG)
    remote_write_json(REMOTE_STATUS, {
        "completed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "processed_count": len(processed_urls),
        "skipped_instagram_count": len(skipped_instagram),
        "errors": errors,
    })
    log(f"done — {len(processed_urls)} processed, {len(errors)} failed, {len(skipped_instagram)} instagram link(s) skipped (not yet supported)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="check once and exit, instead of polling forever")
    args = parser.parse_args()

    if args.once:
        run_once()
        return

    log(f"watching for run requests every {POLL_SECONDS}s — Ctrl-C to stop")
    while True:
        try:
            run_once()
        except Exception as e:
            log(f"unexpected error (will retry next poll): {e}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
