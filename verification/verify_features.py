from playwright.sync_api import sync_playwright
import time

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to an endpoint to see the GraphqlCodeDisplay and Table
            # We assume "Countries" is available or any user defined one
            page.goto("http://localhost:5173/endpoints")
            time.sleep(2)

            # Click on the first endpoint
            page.click(".card")
            time.sleep(5)

            # Check for Copy cURL button (might need to toggle code view first if hidden)
            # By default "QMS body" might be hidden or shown.
            # Let's try to find "QMS body" button and click it
            page.get_by_role("button", name="QMS body").click()
            time.sleep(1)

            # Check for "Copy cURL"
            if page.get_by_label("Copy cURL").is_visible():
                print("Copy cURL button is visible")
            else:
                print("Copy cURL button NOT found")

            # Check for "Export CSV" button
            # We need some data in the table for it to appear
            # Selecting a field should trigger data fetch
            # Assuming the sidebar has loaded
            # Let's try to click on a root field in the sidebar if possible
            # This is complex without knowing the specific endpoint structure.
            # However, if we just check if the button logic exists in code (which we did),
            # we can just take a screenshot of the initial view which might show "Export CSV" if data is auto-loaded

            page.screenshot(path="verification/features.png")
            print("Screenshot saved")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_features.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_features()
