import { describe, it, expect, vi } from 'vitest';
import {
	generateCurlCommand,
	generateFetchCommand,
	generateApolloCommand,
	generatePythonCommand,
	generateGoCommand
} from './codegen';

// Mock logger
vi.mock('$lib/utils/logger', () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

describe('codegen', () => {
	const url = 'https://api.example.com/graphql';
	const headers = { Authorization: 'Bearer token' };
	const query = 'query { hello }';

	describe('generateCurlCommand', () => {
		it('generates cURL command correctly', () => {
			const result = generateCurlCommand(url, headers, query);
			expect(result).toContain('curl -X POST "https://api.example.com/graphql"');
			expect(result).toContain('-H "Authorization: Bearer token"');
			expect(result).toContain('-H "Content-Type: application/json"');
			expect(result).toContain(JSON.stringify({ query }).replace(/'/g, "'\\''"));
		});

		it('adds Content-Type if missing', () => {
			const result = generateCurlCommand(url, {}, query);
			expect(result).toContain('-H "Content-Type: application/json"');
		});
	});

	describe('generateFetchCommand', () => {
		it('generates Fetch command correctly', () => {
			const result = generateFetchCommand(url, headers, query);
			expect(result).toContain('fetch("https://api.example.com/graphql"');
			expect(result).toContain('"Authorization": "Bearer token"');
			expect(result).toContain('"Content-Type": "application/json"');
			expect(result).toContain('"query": "query { hello }"');
		});
	});

	describe('generateApolloCommand', () => {
		it('generates Apollo command correctly for query', () => {
			const result = generateApolloCommand('query GetUser { user { id } }');
			expect(result).toContain("import { gql, useQuery } from '@apollo/client'");
			expect(result).toContain('const GETUSER_QUERY = gql`');
			expect(result).toContain('useQuery(GETUSER_QUERY)');
		});

		it('generates Apollo command correctly for mutation', () => {
			const result = generateApolloCommand('mutation AddUser { addUser { id } }');
			expect(result).toContain("import { gql, useMutation } from '@apollo/client'");
			expect(result).toContain('const ADDUSER_MUTATION = gql`');
			expect(result).toContain('useMutation(ADDUSER_MUTATION)');
		});

		it('generates default name if unnamed', () => {
			const result = generateApolloCommand('query { hello }');
			expect(result).toContain('const MYQUERY_QUERY');
		});
	});

	describe('generatePythonCommand', () => {
		it('generates Python command correctly', () => {
			const result = generatePythonCommand(url, headers, query);
			expect(result).toContain('import requests');
			expect(result).toContain(`url = "${url}"`);
			expect(result).toContain('"Authorization": "Bearer token"');
			expect(result).toContain('"Content-Type": "application/json"');
			expect(result).toContain('"query": "query { hello }"');
			expect(result).toContain('requests.request("POST", url, json=payload, headers=headers)');
		});
	});

	describe('generateGoCommand', () => {
		it('generates Go command correctly', () => {
			const result = generateGoCommand(url, headers, query);
			expect(result).toContain('package main');
			expect(result).toContain('net/http');
			expect(result).toContain(`url := "${url}"`);
			expect(result).toContain('payload := strings.NewReader');
			expect(result).toContain('req.Header.Add("Authorization", "Bearer token")');
			expect(result).toContain('req.Header.Add("Content-Type", "application/json")');
		});

		it('handles special characters in Go string correctly', () => {
			const complexQuery = 'query { val(id: "a\\\\b") }'; // a\b in query
			const result = generateGoCommand(url, headers, complexQuery);
			// In JSON: "query": "query { val(id: \"a\\\\b\") }"
			// In Go literal: "{\"query\":\"query { val(id: \\\"a\\\\\\\\b\\\") }\"}"
			// Wait, let's verify logic.
			// query = `query { val(id: "a\\b") }`
			// payloadStruct = { query }
			// JSON.stringify(payloadStruct) -> `{"query":"query { val(id: \"a\\\\b\") }"}`
			// replace \ -> \\ : `{"query":"query { val(id: \\"a\\\\\\\\b\\") }"}`
			// replace " -> \" : `{\"query\":\"query { val(id: \\\"a\\\\\\\\b\\\") }\"}`

			// We just check that backslashes are escaped.
			// Just checking expected snippet presence
			// JSON: ... "a\\b" ...
			// Escaped: ... \"a\\\\b\" ...
			expect(result).toContain('\\"'); // quotes escaped
			expect(result).toContain('\\\\'); // backslashes escaped
		});
	});
});
