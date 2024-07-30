/* eslint-disable @typescript-eslint/member-ordering */
import { BaseGovernableConfig } from './base_governable_config';

export class GovernableConfigRegistry {
	private readonly _registry = new Map<string, BaseGovernableConfig<Record<string, unknown>>>();

	public register(key: string, value: BaseGovernableConfig<Record<string, unknown>>): void {
		this._registry.set(key, value);
	}

	public get(key: string): BaseGovernableConfig<Record<string, unknown>> {
		const named = this._registry.get(key);
		if (!named) {
			throw new Error(`Governable config for module ${key} is not registered.`);
		}
		return named;
	}

	public keys() {
		return this._registry.keys();
	}

	public has(key: string): boolean {
		return this._registry.has(key);
	}

	public values(): BaseGovernableConfig<Record<string, unknown>>[] {
		const result: BaseGovernableConfig<Record<string, unknown>>[] = [];
		for (const klass of this._registry.values()) {
			result.push(klass);
		}
		return result;
	}
}
