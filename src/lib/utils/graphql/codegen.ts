import { logger } from '$lib/utils/logger';

/**
 * Generates a cURL command for the given GraphQL query.
 * @param url The endpoint URL.
 * @param headers A dictionary of HTTP headers.
 * @param query The GraphQL query string.
 * @returns The cURL command string.
 */
export const generateCurlCommand = (
	url: string,
	headers: Record<string, string>,
	query: string
): string => {
	logger.debug('Generating cURL command', { url, headersCount: Object.keys(headers).length });

	let headerString = '';
	// Ensure Content-Type is present
	const allHeaders = { ...headers };
	if (!allHeaders['Content-Type']) {
		allHeaders['Content-Type'] = 'application/json';
	}

	for (const [key, val] of Object.entries(allHeaders)) {
		headerString += ` -H "${key}: ${val}"`;
	}

	// Properly escape single quotes for shell
	const queryJson = JSON.stringify({ query }).replace(/'/g, "'\\''");

	return `curl -X POST "${url}"${headerString} -d '${queryJson}'`;
};

/**
 * Generates a JavaScript Fetch API snippet for the given GraphQL query.
 * @param url The endpoint URL.
 * @param headers A dictionary of HTTP headers.
 * @param query The GraphQL query string.
 * @returns The JavaScript code snippet.
 */
export const generateFetchCommand = (
	url: string,
	headers: Record<string, string>,
	query: string
): string => {
	logger.debug('Generating Fetch command', { url, headersCount: Object.keys(headers).length });

	const allHeaders = { ...headers };
	if (!allHeaders['Content-Type']) {
		allHeaders['Content-Type'] = 'application/json';
	}

	const body = { query };

	return `fetch("${url}", {
  method: "POST",
  headers: ${JSON.stringify(allHeaders, null, 2)},
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});`;
};

/**
 * Generates a React Apollo Client hook snippet for the given GraphQL query.
 * @param query The GraphQL query string.
 * @returns The React code snippet.
 */
export const generateApolloCommand = (query: string): string => {
	logger.debug('Generating Apollo command');

	const queryMatch = query.match(/(query|mutation|subscription)\s+(\w+)/);
	const operationType =
		queryMatch?.[1] || (query.trim().startsWith('mutation') ? 'mutation' : 'query');
	const queryName = queryMatch?.[2] || 'MyQuery';
	const hookName = `use${queryName.charAt(0).toUpperCase() + queryName.slice(1)}`;
	const hookType = operationType === 'mutation' ? 'Mutation' : 'Query';
	const constName = `${queryName.toUpperCase()}_${operationType.toUpperCase()}`;

	return `import { gql, use${hookType} } from '@apollo/client';

const ${constName} = gql\`
${query}
\`;

export function ${hookName}() {
  const result = use${hookType}(${constName});
  return result;
}`;
};

/**
 * Generates a Python requests snippet for the given GraphQL query.
 * @param url The endpoint URL.
 * @param headers A dictionary of HTTP headers.
 * @param query The GraphQL query string.
 * @returns The Python code snippet.
 */
export const generatePythonCommand = (
	url: string,
	headers: Record<string, string>,
	query: string
): string => {
	logger.debug('Generating Python command', { url, headersCount: Object.keys(headers).length });

	const allHeaders = { ...headers };
	if (!allHeaders['Content-Type']) {
		allHeaders['Content-Type'] = 'application/json';
	}

	const payload = { query };

	return `import requests

url = "${url}"
payload = ${JSON.stringify(payload, null, 2)}
headers = ${JSON.stringify(allHeaders, null, 2)}

response = requests.request("POST", url, json=payload, headers=headers)

print(response.text)`;
};

/**
 * Generates a Go snippet using net/http for the given GraphQL query.
 * @param url The endpoint URL.
 * @param headers A dictionary of HTTP headers.
 * @param query The GraphQL query string.
 * @returns The Go code snippet.
 */
export const generateGoCommand = (
	url: string,
	headers: Record<string, string>,
	query: string
): string => {
	logger.debug('Generating Go command', { url, headersCount: Object.keys(headers).length });

	const allHeaders = { ...headers };
	if (!allHeaders['Content-Type']) {
		allHeaders['Content-Type'] = 'application/json';
	}

	const payloadStruct = { query };
	// Escaping backticks in query for Go string literal if necessary (simple approach here)
	// Actually, using a raw string literal logic for the JSON might be tricky if it contains backticks.
	// For simplicity, we'll assume standard JSON stringification which escapes double quotes.
	// We must escape backslashes first, then quotes, to ensure proper Go string literal syntax.
	const payloadString = JSON.stringify(payloadStruct).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

	let headersCode = '';
	for (const [key, val] of Object.entries(allHeaders)) {
		headersCode += `\treq.Header.Add("${key}", "${val}")\n`;
	}

	return `package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "${url}"
	method := "POST"

	payload := strings.NewReader("${payloadString}")

	client := &http.Client {
	}
	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		fmt.Println(err)
		return
	}
${headersCode}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(body))
}`;
};
