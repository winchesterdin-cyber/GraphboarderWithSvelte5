# Usage Guide

This guide explains how to use the Graphboarder application to explore GraphQL endpoints.

## 1. Selecting an Endpoint

On the home page, you will see the **Endpoint Picker**. This displays a list of available GraphQL endpoints.

- **Select**: Click on an endpoint card to connect to it.
- **Search**: Use the search bar to filter endpoints by name.
- **Add Endpoint**:
  - Click "Add Endpoint" to configure a new custom GraphQL endpoint.
  - **ID**: A unique name for your endpoint (saved locally).
  - **URL**: The GraphQL endpoint URL (must start with `http://` or `https://`).
  - **Headers**: Optional JSON object for headers (e.g., `{"Authorization": "Bearer token"}`).
- **Edit/Delete**: User-defined endpoints can be edited or deleted using the buttons on the card.
- **Export/Import**: You can export your user-defined endpoints to a JSON file and import them later.

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

- **Table View**: Data is presented in a responsive table.
- **Pagination**: If the API supports pagination, use the controls to navigate pages or load more rows (infinite scroll).
- **Sorting/Filtering**: Click column headers to sort or use filters if supported by the API arguments.
- **Columns**:
    - **Hide**: Click the column menu (chevron icon) to hide specific fields.
    - **Add**: Use the "Add Column" feature to include more fields from the schema.
- **Export**:
    - **CSV**: Click the **"Copy CSV"** button (clipboard icon) to copy the current table view to your clipboard.
- **Maintenance**:
    - **Edit Table Name**: Click the **"Edit"** button (pencil icon) to alias table names for better readability in the UI.

## 5. View Generated GraphQL

- Click the **"QMS body"** button to toggle the view of the actual GraphQL query being sent to the server.
- You can copy this query for use in other tools.

## 6. Mutations

For mutations (creating/updating data):

1.  Select a Mutation from the sidebar.
2.  Fill in the required arguments in the form.
3.  Click **Submit** to execute the mutation.
4.  View the result (success/error) and returned data.
