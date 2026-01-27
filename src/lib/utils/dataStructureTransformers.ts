import { getPreciseType } from './typeUtils';

//In the future use terms like processString_transformer and unprocessString_transformer,and also use chd_processedValue and chd_unprocessedValue instead of chd_rawValue and chd_dispatchValue

/**
 * Transforms a stringified QMS object value into a clean string by removing quotes and unescaping characters.
 * Useful for processing raw string values from the QMS system.
 *
 * @param value - The input value, expected to be a string.
 * @returns The cleaned string or the original value if input is not a string.
 */
export const stringToQMSString_transformer = (value: unknown): string | unknown => {
	//the input value is the result of a stringified QMS object, so we need to parse it
	if (getPreciseType(value) !== 'string') {
		console.warn('stringToQMSString_transformer: value is not a string', value);
		return value;
	}
	const modifiedValue = (value as string)
		.replace(/"/g, '')
		.replace(/'/g, `"`)
		.replace(/&Prime;/g, `\\"`)
		.replace(/&prime;/g, `'`)
		.replace(/\\/g, '')
		.slice(1, -1);

	return modifiedValue;
};
/**
 * Wraps a string value in single quotes and escapes existing quotes for GraphQL usage.
 *
 * @param value - The string to transform.
 * @returns The transformed string suitable for GraphQL arguments.
 */
export const string_transformer = (value: unknown): string | unknown => {
	if (getPreciseType(value) !== 'string') {
		console.warn('string_transformer: value is not a string', value);
		return value;
	}
	return `'${(value as string).replaceAll(`"`, `&Prime;`).replaceAll(`'`, `&prime;`)}'`;
};

/**
 * Reverses the transformation applied by `string_transformer`.
 *
 * @param value - The transformed string.
 * @param onlySingleQuotes - If true, only removes single quotes wrapping the string.
 * @returns The original string value.
 */
export const string_transformerREVERSE = (
	value: unknown,
	onlySingleQuotes?: boolean
): string | unknown => {
	if (getPreciseType(value) !== 'string') {
		console.warn('string_transformer: value is not a string', value);
		return value;
	}
	if (onlySingleQuotes) {
		return (value as string).replaceAll(`'`, ``);
	}
	return (value as string).replaceAll(`&Prime;`, `"`).replaceAll(`&prime;`, `'`);
};

export const number_transformer = (value: unknown): number | unknown => {
	if (getPreciseType(value) !== 'number') {
		console.warn('number_transformer: value is not a number', value);
		return value;
	}
	//value * 1 removes leadin zeros: 0001 becomes 1, 0001.5 becomes 1.5
	return (value as number) * 1;
};
export const ISO8601_transformerGETDEFAULTVAl = (): string => {
	return ISO8601_transformerREVERSE(string_transformer(new Date().toISOString()));
};
/**
 * Transforms a date string into an ISO 8601 format wrapped for GraphQL.
 *
 * @param value - The date string.
 * @returns The ISO 8601 string transformed for GraphQL.
 */
export const ISO8601_transformer = (value: string): string | unknown => {
	const date_ISO8601 = new Date(value).toISOString();
	return string_transformer(date_ISO8601);
};

/**
 * Reverses the ISO 8601 transformation to return a `YYYY-MM-DDTHH:mm` string.
 *
 * @param value - The transformed ISO string.
 * @returns A date string formatted as `YYYY-MM-DDTHH:mm`.
 */
export const ISO8601_transformerREVERSE = (value: unknown): string => {
	// Convert ISO 8601 string to Date object
	const dateObject = new Date(string_transformerREVERSE(value, true) as string);
	// Extract individual components
	const year = dateObject.getFullYear().toString().padStart(4, '0');
	const preMonth = dateObject.getMonth() + 1; // Months are zero-indexed
	const month = preMonth.toString().padStart(2, '0');
	const day = dateObject.getDate().toString().padStart(2, '0');
	const hour = dateObject.getHours().toString().padStart(2, '0');
	const minute = dateObject.getMinutes().toString().padStart(2, '0');
	//const second = dateObject.getSeconds().toString().padStart(2, '0');
	return `${year}-${month}-${day}T${hour}:${minute}`;
};

export interface GeoJSONGeometry {
	type: string;
	coordinates: number[] | number[][] | number[][][];
}

export interface GeoJSONFeature {
	geometry: GeoJSONGeometry;
	type: string;
	properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
	features: GeoJSONFeature[];
	type: string;
}

export const geojson_transformer = (
	value: GeoJSONFeatureCollection
): GeoJSONGeometry | GeoJSONGeometry[] => {
	const featuresLength = value.features.length;
	const geojson = value.features.map((feature) => {
		const geometry = JSON.parse(JSON.stringify(feature.geometry));
		geometry.type = string_transformer(geometry.type);
		return geometry;
	});
	if (featuresLength == 1) {
		return geojson[0];
	}
	return geojson; //this line (return geojson;) is useful in case the endpoint supports multi-polygon or multi-geometry in general...
};
export const geojson_transformerREVERSE = (
	value: GeoJSONGeometry | GeoJSONGeometry[]
): GeoJSONFeatureCollection => {
	const valueType = getPreciseType(value);
	let features: GeoJSONGeometry[];

	if (valueType == 'object') {
		features = [value as GeoJSONGeometry];
	} else {
		features = value as GeoJSONGeometry[];
	}

	const jsonFeatures = JSON.parse(
		string_transformerREVERSE(JSON.stringify(features), true) as string
	);

	return {
		features: jsonFeatures.map((feature: GeoJSONGeometry) => {
			return { geometry: feature, type: 'Feature', properties: {} };
		}),
		type: 'FeatureCollection'
	};
};
export const boolean_transformer = (value: unknown): boolean => {
	if (value == undefined) {
		return false;
	}
	return value as boolean;
};
const escapeAllSigngleAndDoubleQuotes = (str: string): string => {
	return str.replace(/["']/g, (match) => {
		return `\\${match}`;
	});
};
