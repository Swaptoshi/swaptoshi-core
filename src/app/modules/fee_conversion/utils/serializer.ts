/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { cryptography } from 'klayr-sdk';
import { getSchemaByPath } from './object';

export function serializer<T extends Record<any, any>>(data: T, schema?: any): T {
	if (data === undefined) return data;
	return JSON.parse(
		JSON.stringify(data, (key, value) => {
			if (Array.isArray(value)) {
				return value.map(item => replacer(item, schema, key));
			}
			return replacer(value, schema, key);
		}),
	);
}

function replacer(value: any, schema?: any, key?: string, parentPath = ''): any {
	const currentPath = parentPath && key ? `${parentPath}.${key}` : key;

	if (typeof value === 'bigint') {
		return value.toString();
	}

	if (Buffer.isBuffer(value)) {
		if (schema && currentPath) {
			const schemaForKey = getSchemaByPath(schema, currentPath);
			if (schemaForKey && (schemaForKey as { dataType?: string }).dataType === 'string' && (schemaForKey as { format?: string }).format === 'klayr32') {
				return cryptography.address.getKlayr32AddressFromAddress(value);
			}
		}
		return value.toString('hex');
	}

	if (Array.isArray(value)) {
		return value.map((item, index) => replacer(item, schema, index.toString(), currentPath));
	}

	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([nestedKey, nestedValue]) => [nestedKey, replacer(nestedValue, schema, nestedKey, currentPath)]));
	}

	if (typeof value === 'string' && value.length === 40) {
		if (schema && currentPath) {
			const schemaForKey = getSchemaByPath(schema, currentPath);
			if (schemaForKey && (schemaForKey as { dataType?: string }).dataType === 'string' && (schemaForKey as { format?: string }).format === 'klayr32') {
				return cryptography.address.getKlayr32AddressFromAddress(Buffer.from(value, 'hex'));
			}
		}
		return value;
	}

	return value;
}
