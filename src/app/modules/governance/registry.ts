/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseGovernableConfig } from './base_governable_config';

export class GovernableConfigRegistry {
	private readonly _registry = new Map<string, BaseGovernableConfig<Record<string, unknown>>>();

	public register(key: string, value: BaseGovernableConfig<Record<string, unknown>>): void {
		this._registry.set(key, value);
	}

	public unregister(key: string): boolean {
		if (!this._registry.has(key)) {
			return false;
		}

		this._registry.delete(key);
		return true;
	}

	public get<T extends Record<string, unknown>>(key: string): BaseGovernableConfig<T> {
		const named = this._registry.get(key);
		if (!named) {
			throw new Error(`Governable config for module ${key} is not registered.`);
		}
		return named as BaseGovernableConfig<T>;
	}

	public keys() {
		return this._registry.keys();
	}

	public has(key: string): boolean {
		return this._registry.has(key);
	}

	public values<T extends Record<string, unknown>>(): BaseGovernableConfig<T>[] {
		const result: BaseGovernableConfig<T>[] = [];
		for (const klass of this._registry.values()) {
			result.push(klass as BaseGovernableConfig<T>);
		}
		return result;
	}
}
