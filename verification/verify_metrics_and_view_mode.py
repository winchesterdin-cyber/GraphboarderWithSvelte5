from playwright.sync_api import sync_playwright
import time

def verify_metrics_and_view_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # We need to reach a page where EndpointsList is active.
            # This happens when we click on an endpoint card.
            page.goto("http://localhost:5173/endpoints")
            time.sleep(2)

            # Click on an endpoint card (e.g., 'countries' or any first one)
            # Assuming cards are clickable links or divs with role='button'
            page.click(".card")
            time.sleep(5) # Wait for schema/query to load

            # At this point, EndpointsList should be rendered.
            # We look for "Table" and "JSON" buttons.

            table_btn = page.get_by_role("button", name="Table")
            json_btn = page.get_by_role("button", name="JSON")

            if table_btn.is_visible() and json_btn.is_visible():
                print("View mode toggle buttons found.")
            else:
                print("View mode toggle buttons NOT found.")

            # We can't easily trigger a query without selecting fields,
            # but if the page loads a default query or if we select something, metrics might appear.
            # If no query runs, metrics won't show.
            # Let's try to verify the buttons existence primarily.

            # Click JSON view
            json_btn.click()
            time.sleep(1)
            page.screenshot(path="verification/json_view.png")
            print("Switched to JSON view.")

            # Click Table view
            table_btn.click()
            time.sleep(1)
            page.screenshot(path="verification/table_view.png")
            print("Switched to Table view.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_metrics.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_metrics_and_view_mode()
