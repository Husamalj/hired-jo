"""
scrape_jobs.py — Jordan job scraper with fallback to seed data.
Run: python scripts/scrape_jobs.py
Output: data/jobs.json
"""
import json
import time
import sys
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "jobs.json")

try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False
    print("requests/bs4 not installed. Using seed data. Run: pip install requests beautifulsoup4")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def scrape_akhtaboot():
    jobs = []
    try:
        url = "https://www.akhtaboot.com/en/jordan/jobs"
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        for i, card in enumerate(soup.select(".job-listing-container, .job-item, [class*='job-card']")[:70]):
            title_el = card.select_one("h2, h3, .job-title, [class*='title']")
            company_el = card.select_one(".company-name, [class*='company']")
            city_el = card.select_one(".location, [class*='location'], [class*='city']")
            if not title_el:
                continue
            jobs.append({
                "id": f"akh-scraped-{i}",
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "city": city_el.get_text(strip=True) if city_el else "Amman",
                "sector": "Tech",
                "seniority": "Junior",
                "skills": [],
                "description": card.get_text(" ", strip=True)[:500],
                "postedAt": "2026-05-10",
                "source": "Akhtaboot",
            })
        print(f"Akhtaboot: {len(jobs)} jobs")
    except Exception as e:
        print(f"Akhtaboot failed: {e}")
    return jobs


def scrape_bayt():
    jobs = []
    try:
        url = "https://www.bayt.com/en/jordan/jobs/"
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        for i, card in enumerate(soup.select("[data-job-id], .has-pointer-d")[:70]):
            title_el = card.select_one("h2 a, .jb-title, [class*='title']")
            company_el = card.select_one("[class*='company'], [class*='employer']")
            if not title_el:
                continue
            jobs.append({
                "id": f"bayt-scraped-{i}",
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "city": "Amman",
                "sector": "Tech",
                "seniority": "Junior",
                "skills": [],
                "description": card.get_text(" ", strip=True)[:500],
                "postedAt": "2026-05-10",
                "source": "Bayt",
            })
        print(f"Bayt: {len(jobs)} jobs")
    except Exception as e:
        print(f"Bayt failed: {e}")
    return jobs


def load_existing():
    """Load the committed seed jobs.json as fallback."""
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            data = json.load(f)
        print(f"Loaded {len(data)} jobs from existing data/jobs.json")
        return data
    return []


def main():
    if not SCRAPING_AVAILABLE:
        print("Keeping existing jobs.json — no scraping libraries.")
        return

    jobs = []
    jobs += scrape_akhtaboot()
    time.sleep(2)
    jobs += scrape_bayt()

    if not jobs:
        print("All scrapers failed. Keeping seed data.")
        return

    # Merge with existing seed to keep enriched jobs
    existing = load_existing()
    existing_ids = {j["id"] for j in existing}
    new_jobs = [j for j in jobs if j["id"] not in existing_ids]
    merged = existing + new_jobs

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(merged)} total jobs to {OUT}")


if __name__ == "__main__":
    main()
