import { createServer } from 'node:http';
import { graphql, buildSchema } from 'graphql';
import Database from 'better-sqlite3';

export interface MockGraphqlServer {
	url: string;
	close: () => Promise<void>;
}

const schema = buildSchema(`
	type Item {
		id: ID!
		name: String!
		createdAt: String!
	}

	type Query {
		items: [Item!]!
		item(id: ID!): Item
	}

	type Mutation {
		addItem(name: String!): Item!
	}
`);

const createDatabase = () => {
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
		INSERT INTO items (name, created_at) VALUES
			('Alpha', '2024-01-01T00:00:00.000Z'),
			('Beta', '2024-01-02T00:00:00.000Z');
	`);
	return db;
};

export const startMockGraphqlServer = async (): Promise<MockGraphqlServer> => {
	const db = createDatabase();
	const server = createServer(async (req, res) => {
		if (req.method !== 'POST') {
			res.writeHead(405, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ errors: [{ message: 'Method Not Allowed' }] }));
			return;
		}

		let body = '';
		req.on('data', (chunk) => {
			body += chunk;
		});

		req.on('end', async () => {
			try {
				const { query, variables } = JSON.parse(body);
				const rootValue = {
					items: () =>
						db.prepare('SELECT id, name, created_at as createdAt FROM items ORDER BY id ASC').all(),
					item: ({ id }: { id: string }) =>
						db.prepare('SELECT id, name, created_at as createdAt FROM items WHERE id = ?').get(id),
					addItem: ({ name }: { name: string }) => {
						const createdAt = new Date().toISOString();
						const info = db
							.prepare('INSERT INTO items (name, created_at) VALUES (?, ?)')
							.run(name, createdAt);
						return { id: info.lastInsertRowid.toString(), name, createdAt };
					}
				};

				const result = await graphql({
					schema,
					source: query,
					rootValue,
					variableValues: variables
				});

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(result));
			} catch (error) {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ errors: [{ message: (error as Error).message }] }));
			}
		});
	});

	await new Promise<void>((resolve) => {
		server.listen(0, '127.0.0.1', resolve);
	});

	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Failed to start mock GraphQL server');
	}

	const url = `http://127.0.0.1:${address.port}`;

	return {
		url,
		close: async () => {
			db.close();
			await new Promise<void>((resolve, reject) => {
				server.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		}
	};
};
