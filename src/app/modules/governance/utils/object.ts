import { Schema } from 'klayr-sdk';
import { ConfigPathKeys, ConfigPathType, UpdatedProperty } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type iSchema = Schema & { dataType: string; items: Schema & { dataType: string; items: any } };
type Primitive = string | number | bigint | boolean | null | undefined | object;

/**
 * Retrieves the schema definition for a given path.
 * @param schema - The root schema to start from.
 * @param path - The path to traverse in the schema.
 * @returns The schema definition at the specified path.
 * @throws Will throw an error if the schema path is not found.
 */
export function getSchemaByPath(schema: Schema, path: string): Schema {
	const pathParts = path.split('.').filter(Boolean); // Remove empty parts
	let currentSchema: Schema = schema;

	for (const part of pathParts) {
		if (currentSchema?.properties && currentSchema.properties[part]) {
			currentSchema = currentSchema.properties[part] as Schema;
		} else {
			throw new Error(`Schema not found for path: ${path}`);
		}
	}

	return currentSchema;
}

/**
 * Determines the array type from the schema definition.
 * @param schemaDef - The schema definition.
 * @returns The array type as a string.
 * @throws Will throw an error if the array type is unknown.
 */
export function getArrayTypeBySchema(schemaDef: iSchema): string {
	if (!schemaDef?.items) throw new Error('Unknown array type');
	if (schemaDef.items.dataType) return `${schemaDef.items.dataType}[]`;
	if (schemaDef.items.type && schemaDef.items.type !== 'array') return `${schemaDef.items.type}[]`;
	if (schemaDef.items.type === 'array' && schemaDef.items.items) return `${getArrayTypeBySchema(schemaDef.items)}[]`;
	throw new Error('Unknown array type');
}

/**
 * Converts a value to a string representation.
 * @param val - The value to convert.
 * @returns The string representation of the value.
 */
export function valueToString(val: Primitive): string {
	if (val === undefined) return '';
	if (typeof val === 'object' && val !== null) return JSON.stringify(val);
	return typeof val === 'bigint' ? val.toString() : String(val);
}

/**
 * Compares two objects and returns an array of updated properties based on the schema definition.
 * @param oldObject - The original object.
 * @param newObject - The updated object.
 * @param schema - The schema definition to use for comparison.
 * @returns An array of updated properties.
 */
export function getUpdatedProperties(oldObject: object, newObject: object, schema: Schema): UpdatedProperty[] {
	const updatedProperties: UpdatedProperty[] = [];

	/**
	 * Recursively compares two values and updates the list of updated properties.
	 * @param oldVal - The original value.
	 * @param newVal - The updated value.
	 * @param path - The current path in the object.
	 * @param schemaDef - The schema definition for the current path.
	 */
	function deepCompare(oldVal: Primitive, newVal: Primitive, path: string, schemaDef: Schema) {
		if (Array.isArray(oldVal) || Array.isArray(newVal)) {
			const oldStr = valueToString(oldVal);
			const newStr = JSON.stringify(newVal);
			if (oldStr !== newStr) {
				const type = getArrayTypeBySchema(schemaDef as iSchema);
				updatedProperties.push({ path, old: oldStr, new: newStr, type });
			}
			return;
		}

		if (typeof newVal === 'object' && newVal !== null) {
			const oldValue = typeof oldVal === 'object' && oldVal !== null ? oldVal : {};
			const keys = new Set([...Object.keys(oldValue), ...Object.keys(newVal)]);

			keys.forEach(key => {
				const newSchema = getSchemaByPath(schema, path ? `${path}.${key}` : key);
				deepCompare(oldValue[key] as Primitive, newVal[key] as Primitive, path ? `${path}.${key}` : key, newSchema);
			});
			return;
		}

		const oldStr = valueToString(oldVal);
		const newStr = valueToString(newVal);

		if (oldStr !== newStr) {
			let type: string;
			if ((schemaDef as iSchema)?.dataType) {
				type = (schemaDef as iSchema).dataType;
			} else if (schemaDef?.type === 'array') {
				type = getArrayTypeBySchema(schemaDef as iSchema);
			} else if (schemaDef?.type) {
				type = schemaDef.type;
			} else {
				throw new Error(`Unknown type for path: ${path}`);
			}
			updatedProperties.push({ path, old: oldStr, new: newStr, type });
		}
	}

	deepCompare(oldObject, newObject, '', schema);

	return updatedProperties;
}

/**
 * Retrieves the value from an object based on a given path.
 * @param obj - The object to retrieve the value from.
 * @param path - The path to the value.
 * @returns The value at the specified path.
 */
export function getValueFromPath<T extends object, P extends ConfigPathKeys<T>>(obj: T, path: P): ConfigPathType<T, P> {
	return path.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), obj) as ConfigPathType<T, P>;
}

/**
 * Updates the value in an object based on a given path and returns a new object with the updated value.
 * @param obj - The original object.
 * @param path - The path to the value to update.
 * @param value - The new value to set at the specified path.
 * @returns A new object with the updated value.
 */
export function updateValueFromPath<T extends object>(obj: T, path: string, value: unknown): T {
	const ret = { ...obj };
	const parts = path.split('.');
	let current: object = ret;

	for (let i = 0; i < parts.length - 1; i += 1) {
		const part = parts[i];
		if (!current[part] || typeof current[part] !== 'object') {
			current[part] = {};
		}
		current = current[part] as Record<string, unknown>;
	}

	current[parts[parts.length - 1]] = value;
	return ret;
}

/**
 * Checks if a given path exists in an object.
 * @param obj - The object to check.
 * @param path - The path to check for existence.
 * @returns True if the path exists, false otherwise.
 */
export function pathExists(obj: object, path: string): boolean {
	let current: unknown = obj;
	return path.split('.').every(part => {
		if (typeof current !== 'object' || current === null || !(part in current)) {
			return false;
		}
		current = current[part] as unknown;
		return true;
	});
}
