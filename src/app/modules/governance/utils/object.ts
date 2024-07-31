import { Schema } from 'klayr-sdk';
import { ConfigPathKeys, ConfigPathType, UpdatedProperty } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type iSchema = Schema & { dataType: string; items: Schema & { dataType: string; items: any } };
type Primitive = string | number | bigint | boolean | null | undefined;

export function getUpdatedProperties(oldObject: object, newObject: object, schema: Schema): UpdatedProperty[] {
	const updatedProperties: UpdatedProperty[] = [];

	function deepCompare(oldVal: Primitive | object, newVal: Primitive | object, path: string, schemaDef: Schema) {
		if (Array.isArray(oldVal) && Array.isArray(newVal)) {
			const oldStr = JSON.stringify(oldVal);
			const newStr = JSON.stringify(newVal);
			const type = determineArrayType(schemaDef as iSchema);
			if (oldStr !== newStr) {
				updatedProperties.push({ path, old: oldStr, new: newStr, type });
			}
		} else if (Array.isArray(newVal)) {
			const oldStr = oldVal !== undefined ? JSON.stringify(oldVal) : '';
			const newStr = JSON.stringify(newVal);
			const type = determineArrayType(schemaDef as iSchema);
			if (oldStr !== newStr) {
				updatedProperties.push({ path, old: oldStr, new: newStr, type });
			}
		} else if (typeof newVal === 'object' && newVal !== null) {
			if (typeof oldVal === 'object' && oldVal !== null) {
				const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
				keys.forEach(key => {
					const newSchema = schemaDef?.properties ? (schemaDef.properties[key] as Schema) : undefined;
					if (!newSchema) {
						throw new Error(`Schema not found for path: ${path}.${key}`);
					}
					deepCompare(oldVal[key] as Primitive | object, newVal[key] as Primitive | object, path ? `${path}.${key}` : key, newSchema);
				});
			} else {
				Object.keys(newVal).forEach(key => {
					const newSchema = schemaDef?.properties ? (schemaDef.properties[key] as Schema) : undefined;
					if (!newSchema) {
						throw new Error(`Schema not found for path: ${path}.${key}`);
					}
					deepCompare(undefined, newVal[key] as Primitive | object, path ? `${path}.${key}` : key, newSchema);
				});
			}
		} else {
			let oldStr = '';
			let newStr = '';
			let type: string;

			if (oldVal !== undefined) {
				oldStr = typeof oldVal === 'bigint' ? oldVal.toString() : String(oldVal);
			}

			if (newVal !== undefined) {
				newStr = typeof newVal === 'bigint' ? newVal.toString() : String(newVal);
			}

			if (oldStr !== newStr) {
				if ((schemaDef as iSchema)?.dataType) {
					type = (schemaDef as iSchema).dataType;
				} else if (schemaDef && schemaDef.type === 'array') {
					type = determineArrayType(schemaDef as iSchema);
				} else if (schemaDef?.type) {
					type = schemaDef.type;
				} else {
					throw new Error(`Unknown type for path: ${path}`);
				}

				updatedProperties.push({ path, old: oldStr, new: newStr, type });
			}
		}
	}

	function determineArrayType(schemaDef: iSchema): string {
		if (!schemaDef?.items) throw new Error('Unknown array type');
		if (schemaDef.items.dataType) return `${schemaDef.items.dataType}[]`;
		if (schemaDef.items.type && schemaDef.items.type !== 'array') return `${schemaDef.items.type}[]`;
		if (schemaDef.items.type && schemaDef.items.type === 'array' && schemaDef.items.items) return `${determineArrayType(schemaDef.items)}[]`;
		throw new Error('Unknown array type');
	}

	deepCompare(oldObject, newObject, '', schema);

	return updatedProperties;
}

export function getValueFromPath<T extends object, P extends ConfigPathKeys<T>>(obj: T, path: P): ConfigPathType<T, P> {
	return path.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), obj) as ConfigPathType<T, P>;
}

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
