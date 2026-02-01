from playwright.sync_api import Page, expect, sync_playwright
import os

def test_features(page: Page):
    # 1. Arrange: Go to the homepage.
    page.goto("http://localhost:5173")

    # 2. Click "Get Started" to go to /endpoints
    page.get_by_role("link", name="Get Started").click()

    # 3. Select "RickAndMorty" endpoint.
    # It might be a card. We click on the text "rickandmortyapi" inside a card.
    # Use text match.
    page.get_by_role("heading", name="rickandmortyapi").click()

    # Wait for navigation to endpoint dashboard/explorer
    # It might redirect to /explorer
    page.wait_for_url("**/endpoints/rickandmortyapi/explorer", timeout=30000)

    # 4. Navigate to Favorites
    # Sidebar should have Favorites link.
    page.get_by_role("link", name="Favorites").click()
    page.wait_for_url("**/endpoints/rickandmortyapi/favorites")

    # Verify Favorites page content
    expect(page.get_by_role("heading", name="Favorites")).to_be_visible()
    expect(page.get_by_text("No favorites saved for this endpoint yet")).to_be_visible()
    expect(page.get_by_role("button", name="Export")).to_be_visible()
    expect(page.get_by_role("button", name="Import")).to_be_visible()

    # 5. Navigate to History
    page.get_by_role("link", name="History").click()
    page.wait_for_url("**/endpoints/rickandmortyapi/history")

    # Verify History page content
    expect(page.get_by_role("heading", name="History")).to_be_visible()
    # There might be no history initially
    expect(page.get_by_text("No history for this endpoint")).to_be_visible()
    expect(page.get_by_role("button", name="Export")).to_be_visible()
    expect(page.get_by_role("button", name="Import")).to_be_visible()

    # Take screenshot
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_features(page)
        finally:
            browser.close()
