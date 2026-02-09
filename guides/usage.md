# Usage Guide

This guide explains how to use the Graphboarder application to explore GraphQL endpoints.

## 1. Selecting an Endpoint

From the home page, click **"Get Started"** to navigate to the **Endpoint Picker** (at `/endpoints`). This displays a list of available GraphQL endpoints.

- **Select**: Click on an endpoint card to connect to it. Cards indicate if an endpoint is **"Maintained"** (built-in and verified) or **"User Defined"**.
- **Search**: Use the search bar to filter endpoints by name.
- **Status Filter & Summary**:
  - Use the **Status** dropdown to filter endpoints by **Online**, **Offline**, or **Pending**.
  - The Status Summary badges show counts for each state; click a badge to apply that filter quickly.
- **Add Endpoint**:
  - Click "Add Endpoint" to configure a new custom GraphQL endpoint.
  - **ID**: A unique name for your endpoint (saved locally).
  - **URL**: The GraphQL endpoint URL (must start with `http://` or `https://`).
  - **Description**: Optional description for the endpoint.
  - **Headers**: Optional JSON object for headers (e.g., `{"Authorization": "Bearer token"}`).
  - **Test Connection**: Use the "Test Connection" button to verify if the URL and headers are correct before saving.
- **Edit/Delete**: User-defined endpoints can be edited or deleted using the buttons on the card.
- **Duplicate**: Click the duplicate icon (copy) on any endpoint card to create a copy of its configuration. This is useful for creating variations of endpoints (e.g., Development vs. Production) without re-entering all details.
- **Favorites**:
  - Click the **star** icon on an endpoint card to favorite it.
  - Favorited endpoints appear at the top of the list and can be filtered using the **Favorites** toggle and badge.
- **Export/Import**: You can export your user-defined endpoints to a JSON file and import them later.
- **Health Check**:
  - The application automatically checks the connectivity of endpoints.
  - A green dot indicates the endpoint is Online (with latency in ms).
  - A red badge indicates the endpoint is Offline or unreachable.
  - Use the "Refresh Status" button to manually re-check all endpoints.

## 2. Exploring the Schema

Once connected to an endpoint, you will see the **Explorer Interface**.

- **Sidebar**: Displays the GraphQL schema (Root Types: Query, Mutation, Subscription).
- **Navigation**: Expand types to see fields and arguments.
- **Documentation**: Hover over fields or click "info" icons to see descriptions and types from the schema.

## 3. Building Queries (Visual Query Builder)

You can build queries visually without writing GraphQL code.

1.  **Select a Root Field**: Click on a query or mutation in the sidebar.
2.  **Select Fields**: In the main area, check the boxes for the fields you want to fetch.
3.  **Arguments**:
    - If a field accepts arguments, an **Active Arguments** panel will appear.
    - Enter values for arguments (e.g., IDs, filters, pagination limits).
    - Variables are automatically handled.

## 4. Visualizing Data

As you build the query, the results are fetched and displayed automatically.

- **View Modes**:
  - **Table**: The default view presenting data in a responsive table.
  - **JSON**: Toggle to "JSON" view to see the raw response from the server.
    - **Syntax Highlighting**: The JSON view provides syntax highlighting for better readability.
    - **Download**: Click the **"Download JSON"** button in the JSON view toolbar to save the response body as a `.json` file.
    - **Pin Response**: Click the **"Pin"** button to pin the current response. This allows you to compare it with subsequent queries.
- **Metrics**:
  - **Time**: Displays the execution time of the request in milliseconds (ms).
  - **Size**: Displays the size of the response payload.
- **Pagination**: If the API supports pagination, use the controls to navigate pages or load more rows (infinite scroll).
- **Sorting/Filtering**: Click column headers to sort or use filters if supported by the API arguments.
- **Columns**:
  - **Hide**: Click the column menu (chevron icon) to hide specific fields.
  - **Add**: Use the "Add Column" feature to include more fields from the schema.
- **Export**:
  - **CSV**: Click the **"Export CSV"** button above the table to download the current table view as a `.csv` file.
  - **JSON**: Click the **"Export JSON"** button to download the current table data as a `.json` file.
- **Maintenance**:
  - **Edit Table Name**: Click the **"Edit"** button (pencil icon) to open a modal where you can alias table names for better readability in the UI.

## 5. View Generated GraphQL

- Click the **"QMS body"** button to toggle the view of the actual GraphQL query being sent to the server.
- **Export Code**: Click the **"Export Code"** button to open a modal where you can generate and copy code snippets in various languages.
  - **Supported Languages**:
    - **cURL**: Generate a cURL command for testing in the terminal.
    - **Fetch**: Generate a JavaScript `fetch` code snippet.
    - **TypeScript**: Generate a TypeScript interface definition for the query response.
    - **Apollo**: Generate a React component example using `@apollo/client`.
    - **Python**: Generate a Python script using the `requests` library.
    - **Go**: Generate a Go program using the `net/http` package.
    - **Rust**: Generate a Rust program using the `reqwest` crate.
  - **Preview & Copy**: You can view the generated code in the modal and click **"Copy"** to save it to your clipboard.
- **Copy Content**: Click the **"Copy"** button to copy the raw GraphQL query string.
- **Share Link**: Click the **"Share"** button to generate a shareable URL for the current query state.
  - The URL contains the complete state (arguments, selected columns, etc.) encoded in a query parameter.
  - Copy this URL and send it to others. When they open it, the application will restore the query exactly as it was.
- **Prettify**: Use the "Show Prettified" toggle to switch between raw and formatted views.

## 6. Dynamic Headers & Environment Variables

### Dynamic Headers

You can modify the HTTP headers for the current session directly from the query execution interface. This is useful for testing different authentication tokens or roles without modifying the global endpoint configuration.

1.  Click the **"Headers"** button in the toolbar (next to "Variables").
2.  A modal will appear showing the current headers as a JSON object.
3.  Edit the headers (e.g., update the `Authorization` token).
4.  Click **"Save"**.
5.  All subsequent queries in the current session will use the new headers.

### Header Presets

You can save commonly used header configurations as presets for quick access.

1.  **Save Preset**:
    - Open the **Headers** editor.
    - Enter your headers JSON.
    - Enter a name in the "New preset name..." field.
    - Click **"Save Current as Preset"**.
2.  **Load Preset**:
    - Click on any saved preset name in the list to load its headers into the editor.
    - Click **"Save Headers"** to apply them to the current session.
3.  **Delete Preset**:
    - Click the **"X"** icon next to a preset name to remove it.

### Environment Variables

To improve security and convenience, you can use environment variables in your headers instead of hardcoding sensitive tokens.

1.  Click the **"Variables"** button in the toolbar.
2.  Add a new variable by entering a **Key** (e.g., `API_TOKEN`) and a **Value**.
3.  Click **Add**. The value is stored locally in your browser.
4.  In the **Headers** editor (or Endpoint configuration), use the variable syntax: `{{VARIABLE_NAME}}`.
    - Example: `{"Authorization": "Bearer {{API_TOKEN}}"}`
5.  The application will automatically substitute `{{API_TOKEN}}` with the actual value when making requests.
6.  You can toggle **"Show Values"** to reveal the actual values of your variables.
7.  **Export/Import**:
    - **Export**: Click the download icon in the Environment Variables modal to save your variables as a JSON file.
    - **Import**: Click the upload icon to restore variables from a JSON file. This is useful for sharing environment configurations with your team.

## 7. History & Favorites

- **History**:
  - The application automatically tracks every query and mutation you execute.
  - Access the full history log from the **History** tab in the sidebar.
  - **Search & Filter**:
    - Use the search bar to filter history items by query name.
    - Use the dropdown filters to narrow down the list by **Type** (Query/Mutation) or **Status** (Success/Error).
    - Toggle **Slow only** to focus on queries that took ≥ 1000 ms.
    - Use **Min/Max ms** to filter by duration range, then hit **Reset filters** to clear everything quickly.
    - Duration inputs are capped at 10 minutes to avoid extreme filtering values.
  - **Insights**: The history page shows a summary of total runs, success rate, average duration, and slow runs (≥ 1000 ms) for the current endpoint and filters.
  - **Copy Insights**: Use the **Copy Insights** button to share the current summary and filter context.
  - **Download Insights**: Use **Download Insights** to save the summary as a text file for offline sharing.
  - **Download CSV**: Use **Download CSV** to export the filtered history list as a spreadsheet-friendly file.
  - Each entry shows the timestamp, query name, and execution status (success/error).
  - **Restore**: Clicking a history item (or the restore icon) restores the exact state of the query (arguments, columns) at the time of execution.
  - **Details & Copy**: Use the info icon to open a details drawer with arguments and the query body, then copy the query body to your clipboard.
  - **Clear History**: Click the **"Clear All"** button to remove all history entries globally.
  - **Export History**: Click **"Export"** to download your history as a JSON file.
  - **Import History**: Click **"Import"** to restore history from a JSON file.
  - **Delete Item**: Use the trash icon on any row to remove a single history entry.
- **Recent**: The sidebar includes a "Recent" tab that tracks your recently visited queries and mutations (by name only) for quick navigation.
- **Favorites**:
  - You can save frequently used queries to your **Favorites** list.
  - Click the **"Save"** (star icon) button in the query code display toolbar.
  - Enter a name for your query.
  - Access your favorite queries from the "Favorites" tab in the sidebar.
  - **Manage Favorites**: The Favorites page displays all saved queries for the current endpoint.
  - **Export Favorites**: Click **"Export"** to backup your favorite queries to a JSON file.
  - **Import Favorites**: Click **"Import"** to restore favorites from a JSON file. This is useful for sharing query collections with teammates.
  - **Delete**: Remove unwanted favorites using the trash icon.
  - **Edit**: Use the pencil icon to rename favorites or move them into a different folder. Clearing the folder field moves a favorite back to "Uncategorized".
  - **Rename Folders**: Use the folder-level pencil icon to rename an entire folder. Leave the new name blank to move the folder’s favorites into "Uncategorized".
  - **Folders**:
    - When saving a favorite, you can optionally specify a **Folder Name** to organize your queries.
    - The Favorites page displays queries grouped by their assigned folder.
    - Queries without a folder are listed under "Uncategorized".

## 8. Appearance

- **Theme Toggle**: Use the sun/moon icon at the bottom of the sidebar to switch between Light and Dark themes.
- **Download Schema**: Click the download icon (arrow pointing down) next to the theme toggle to download the current GraphQL schema as a JSON file. This is useful for offline analysis or for use with other tools.

## 9. Mutations

For mutations (creating/updating data):

1.  Select a Mutation from the sidebar.
2.  Fill in the required arguments in the form.
3.  Click **Submit** to execute the mutation.
4.  View the result (success/error) and returned data.

## 10. Troubleshooting & Debugging

- **Loading States**: If the application takes time to load an endpoint configuration, a loading spinner will appear. If it fails to load, an error message with a "Retry" button will be displayed.
- **Console Logs**: For advanced debugging, open your browser's developer console (F12). The application logs detailed information about data fetching, pagination logic, and configuration parsing using `console.debug`.

## 11. New Features

### Query Complexity Analysis

The application now calculates and displays the complexity of your GraphQL query.

- The complexity score is shown in the query code display toolbar (e.g., "Complexity: 5").
- Complexity is calculated based on the number of fields in the query.
- This helps you identify potentially heavy queries that might impact server performance.

### Local Storage Manager

A new **Storage Manager** tool is available to inspect and manage data stored in your browser's Local Storage.

- **Access**: Click the **Database** icon (bi-database) in the bottom-left corner of the sidebar (next to the theme toggle).
- **Inspect**: View raw JSON data for Endpoints, History, Favorites, and Environment Variables.
- **Delete**: Individually delete specific storage keys if needed for debugging or cleanup.

### Response Pinning

You can pin a query response to compare it with future results.

1.  Execute a query.
2.  Switch to **JSON** view.
3.  Click the **Pin** button in the top-right corner of the code block.
4.  The response will be pinned in a floating panel at the bottom-right of the screen.
5.  You can collapse the panel or close it when done.
6.  The pinned response persists even if you navigate to other pages.

### Comparing Responses

You can compare the current query response with a previously pinned response to identify differences.

1.  **Pin a Response**: As described above, pin a response using the "Pin" button in the JSON view.
2.  **Execute New Query**: Run the same query (or a modified one) to get a new response.
3.  **Compare**:
    - Switch to **JSON** view.
    - Click the **"Diff"** button in the toolbar (next to the Pin button).
    - The view will switch to a visual diff mode:
      - **Green**: Added content (present in current response but not in pinned).
      - **Red**: Removed content (present in pinned response but not in current).
      - **Grey**: Unchanged content.
    - Click **"Show Code"** to return to the standard JSON view.

### Auto-Refresh

You can configure the query to automatically re-execute at a specified interval. This is useful for monitoring data that changes frequently.

- **Toggle**: Click the **Auto-Refresh** button (circular arrows icon) in the toolbar to enable or disable auto-refresh.
- **Interval**: When enabled, an input field appears where you can specify the refresh interval in milliseconds (default: 5000ms).
- **Indicator**: The button icon spins when auto-refresh is active.

## 12. Command Palette

A global **Command Palette** is available to help you navigate quickly through the application without lifting your hands from the keyboard.

- **Access**: Press `Ctrl+K` (or `Cmd+K` on Mac) anywhere in the application to open the Command Palette.
- **Search**:
  - Search for global pages (Home, Endpoints).
  - Search for pages within the current endpoint (Explorer, History, Favorites, Recent, etc.).
  - Search for specific **Queries** and **Mutations** available in the schema.
- **Navigate**:
  - Use `Arrow Up` / `Arrow Down` to navigate the results.
  - Press `Enter` to select an item.
  - Press `Esc` to close.
