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

function replacer(value: any, schema?: any, key?: string) {
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (value.type === 'Buffer') {
		if (schema && key) {
			const schemaForKey = getSchemaByPath(schema, key);
			if (schemaForKey && (schemaForKey as { dataType?: string }).dataType === 'string' && (schemaForKey as { format?: string }).format === 'klayr32') {
				return cryptography.address.getKlayr32AddressFromAddress(Buffer.from(value, 'hex'));
			}
		}
		return Buffer.from(value).toString('hex');
	}
	return value;
}
