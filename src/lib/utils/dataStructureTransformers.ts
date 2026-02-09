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
 * Normalizes date-like inputs into ISO 8601 strings wrapped for GraphQL.
 *
 * Supports:
 * - ISO date strings (existing behavior)
 * - Date objects (new)
 * - numeric timestamps in milliseconds (new)
 */
export const ISO8601_transformer = (value: unknown): string | unknown => {
	const valueType = getPreciseType(value);
	let date: Date;

	if (valueType === 'string') {
		date = new Date(value as string);
	} else if (valueType === 'date') {
		console.info('ISO8601_transformer: normalizing Date input');
		date = value as Date;
	} else if (valueType === 'number') {
		console.info('ISO8601_transformer: normalizing numeric timestamp input');
		date = new Date(value as number);
	} else {
		console.warn('ISO8601_transformer: unsupported input type', value);
		return value;
	}

	if (Number.isNaN(date.getTime())) {
		// Explicitly handle invalid date strings instead of throwing.
		console.warn('ISO8601_transformer: invalid date input', value);
		return value;
	}
	const date_ISO8601 = date.toISOString();
	return string_transformer(date_ISO8601);
};

/**
 * Converts ISO 8601 inputs into the `YYYY-MM-DDTHH:mm` format used by datetime-local.
 *
 * Supports:
 * - ISO 8601 strings wrapped for GraphQL (existing behavior)
 * - Date objects (new)
 * - numeric timestamps in milliseconds (new)
 */
export const ISO8601_transformerREVERSE = (value: unknown): string => {
	const valueType = getPreciseType(value);
	let dateObject: Date;
	if (valueType === 'date') {
		console.info('ISO8601_transformerREVERSE: normalizing Date input');
		dateObject = value as Date;
	} else if (valueType === 'number') {
		console.info('ISO8601_transformerREVERSE: normalizing numeric timestamp input');
		dateObject = new Date(value as number);
	} else if (valueType === 'string') {
		const rawValue = string_transformerREVERSE(value, true);
		if (getPreciseType(rawValue) !== 'string') {
			console.warn('ISO8601_transformerREVERSE: unexpected unwrapped value', rawValue);
			return '';
		}
		dateObject = new Date(rawValue as string);
	} else {
		console.warn('ISO8601_transformerREVERSE: unsupported input type', value);
		return '';
	}

	if (Number.isNaN(dateObject.getTime())) {
		// Guard against invalid dates producing NaN components.
		console.warn('ISO8601_transformerREVERSE: invalid date input', value);
		return '';
	}
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
