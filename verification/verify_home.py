from playwright.sync_api import sync_playwright

def verify_endpoints():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to home page...")
            page.goto("http://localhost:5173")
            page.wait_for_load_state("networkidle")

            # Click Get Started
            print("Clicking Get Started...")
            page.get_by_role("link", name="Get Started").click()
            page.wait_for_url("**/endpoints")
            page.wait_for_load_state("networkidle")

            print("Taking screenshot of endpoints...")
            page.screenshot(path="verification/endpoints.png")
            print("Screenshot saved to verification/endpoints.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_endpoints()
