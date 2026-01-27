# Usage Guide

This guide explains how to use the Graphboarder application to explore GraphQL endpoints.

## 1. Selecting an Endpoint

From the home page, click **"Get Started"** to navigate to the **Endpoint Picker** (at `/endpoints`). This displays a list of available GraphQL endpoints.

- **Select**: Click on an endpoint card to connect to it. Cards indicate if an endpoint is **"Maintained"** (built-in and verified) or **"User Defined"**.
- **Search**: Use the search bar to filter endpoints by name.
- **Add Endpoint**:
  - Click "Add Endpoint" to configure a new custom GraphQL endpoint.
  - **ID**: A unique name for your endpoint (saved locally).
  - **URL**: The GraphQL endpoint URL (must start with `http://` or `https://`).
  - **Description**: Optional description for the endpoint.
  - **Headers**: Optional JSON object for headers (e.g., `{"Authorization": "Bearer token"}`).
  - **Test Connection**: Use the "Test Connection" button to verify if the URL and headers are correct before saving.
- **Edit/Delete**: User-defined endpoints can be edited or deleted using the buttons on the card.
- **Duplicate**: Click the duplicate icon (copy) on any endpoint card to create a copy of its configuration. This is useful for creating variations of endpoints (e.g., Development vs. Production) without re-entering all details.
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
- **Copy Query**: Click the **"Copy"** button to copy the query string to your clipboard.
- **Copy cURL**: Click the **"Copy cURL"** button to copy a cURL command for the current query to your clipboard, allowing you to easily test it in your terminal.
- **Prettify**: Use the "Show Prettified" toggle to switch between raw and formatted views.

## 6. History & Favorites

- **Recent**: The sidebar includes a "Recent" tab that tracks your recently visited queries and mutations for quick access.
- **Favorites**:
  - You can save frequently used queries to your **Favorites** list.
  - Click the **"Save"** (star icon) button in the query code display toolbar.
  - Enter a name for your query.
  - Access your favorite queries from the "Favorites" tab in the sidebar.

## 7. Appearance

- **Theme Toggle**: Use the sun/moon icon at the bottom of the sidebar to switch between Light and Dark themes.
- **Download Schema**: Click the download icon (arrow pointing down) next to the theme toggle to download the current GraphQL schema as a JSON file. This is useful for offline analysis or for use with other tools.

## 8. Mutations

For mutations (creating/updating data):

1.  Select a Mutation from the sidebar.
2.  Fill in the required arguments in the form.
3.  Click **Submit** to execute the mutation.
4.  View the result (success/error) and returned data.

## 9. Troubleshooting & Debugging

- **Loading States**: If the application takes time to load an endpoint configuration, a loading spinner will appear. If it fails to load, an error message with a "Retry" button will be displayed.
- **Console Logs**: For advanced debugging, open your browser's developer console (F12). The application logs detailed information about data fetching, pagination logic, and configuration parsing using `console.debug`.
