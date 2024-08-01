/* eslint-disable @typescript-eslint/member-ordering */
import { BaseFeeConversionMethod } from './base_fc_method';

export class FeeConversionMethodRegistry {
	private readonly _registry = new Map<string, BaseFeeConversionMethod[]>();

	public register(key: string, value: BaseFeeConversionMethod): void {
		if (this._registry.has(key)) {
			const methods = this._registry.get(key);
			const index = methods?.findIndex(method => method.name === value.name);
			if (index !== undefined && index !== -1 && methods) {
				methods.splice(index, 1, value);
			} else {
				methods?.push(value);
			}
		} else {
			this._registry.set(key, [value]);
		}
	}

	public unregister(key: string, value: BaseFeeConversionMethod): boolean {
		if (!this._registry.has(key)) {
			return false;
		}

		const methods = this._registry.get(key);
		if (!methods) {
			return false;
		}

		const index = methods.findIndex(method => method.name === value.name);
		if (index === -1) {
			return false;
		}

		methods.splice(index, 1);

		if (methods.length === 0) {
			this._registry.delete(key);
		} else {
			this._registry.set(key, methods);
		}

		return true;
	}

	public get(key: string): BaseFeeConversionMethod[] {
		const named = this._registry.get(key);
		if (!named) {
			throw new Error(`Fee conversion handler for ${key} is not registered.`);
		}
		return named;
	}

	public keys() {
		return this._registry.keys();
	}

	public has(key: string): boolean {
		return this._registry.has(key);
	}

	public values(): string[][] {
		const result: string[][] = [];
		for (const klass of this._registry.values()) {
			result.push(klass.map(t => t.name));
		}
		return result;
	}
}
