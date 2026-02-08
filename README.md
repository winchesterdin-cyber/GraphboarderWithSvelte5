# GraphboarderWithSvelte5

A Svelte 5 library for exploring and visualizing GraphQL endpoints.

## Features

- **GraphQL Explorer**: Connect to any GraphQL endpoint.
- **Visual Query Builder**: Build queries visually without writing code.
- **Data Visualization**: View results in tables and other formats.
- **Local Persistence**: Save your endpoints locally.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Documentation

For detailed guides, please check the [guides](./guides) folder:

- [Usage Guide](./guides/usage.md)
- [Setup Guide](./guides/setup.md)
- [Architecture Guide](./guides/architecture.md)
- [Project Structure](./guides/project_structure.md)
- [State Management](./guides/state_management.md)
- [Components Guide](./guides/components.md)
- [Utilities Guide](./guides/utilities.md)
- [Testing Guide](./guides/testing.md)
- [Useful Notes](./guides/useful_notes.md)
- [Documentation Update Log](./guides/updates_log.md)
- [Contribution Guide](./guides/contribution.md)

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the guides above for detailed development instructions.

### Debugging

We use `console.debug` for debugging critical paths like data fetching and pagination. These logs are visible in the browser console.

## Building

To build the library:

```sh
npm pack
```

To build the showcase app:

```sh
npm run build
```

## License

[MIT](LICENSE)
