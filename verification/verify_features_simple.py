from playwright.sync_api import sync_playwright
import time

def verify_features_simple():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173/endpoints")
            time.sleep(3)
            page.screenshot(path="verification/features_simple.png")
            print("Screenshot saved")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_features_simple()
