from playwright.sync_api import sync_playwright
import time

def verify_endpoints_list():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173/endpoints")
            time.sleep(2)
            page.screenshot(path="verification/endpoints_list.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_endpoints_list()
