import { ConfigPathKeys, ConfigPathType } from '../types';

export interface UpdatedProperty {
	path: string;
	old: string;
	new: string;
	type: 'string' | 'number' | 'bigint';
}

type Primitive = string | number | bigint | null | undefined;

export function getUpdatedProperties(oldObject: object, newObject: object): UpdatedProperty[] {
	const updatedProperties: UpdatedProperty[] = [];

	function deepCompare(oldVal: Primitive | object, newVal: Primitive | object, path: string) {
		if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
			const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
			keys.forEach(key => {
				deepCompare(oldVal[key] as Primitive | Record<string, unknown>, newVal[key] as Primitive | Record<string, unknown>, path ? `${path}.${key}` : key);
			});
		} else {
			let oldStr = '';
			let newStr = '';
			let type: 'string' | 'number' | 'bigint' = 'string';

			if (oldVal !== undefined) {
				if (typeof oldVal === 'bigint') {
					oldStr = oldVal.toString();
				} else {
					oldStr = String(oldVal);
				}
			}

			if (newVal !== undefined) {
				if (typeof newVal === 'bigint') {
					newStr = newVal.toString();
					type = 'bigint';
				} else {
					newStr = String(newVal);
					type = typeof newVal === 'string' || typeof newVal === 'number' ? (typeof newVal as 'string' | 'number') : 'string';
				}
			}

			if (oldStr !== newStr) {
				updatedProperties.push({ path, old: oldStr, new: newStr, type });
			}
		}
	}

	deepCompare(oldObject, newObject, '');

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
