/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { FeeConversionMethodRegistry } from './registry';
import { FeeConversionModuleConfig, RegisteredMethod, RegisteredMethodResponse } from './types';
import { serializer } from './utils';

export class FeeConversionEndpoint extends BaseEndpoint {
	protected _handler: FeeConversionMethodRegistry | undefined;
	protected _config: FeeConversionModuleConfig | undefined;

	public async init(handler: FeeConversionMethodRegistry, config: FeeConversionModuleConfig) {
		this._handler = handler;
		this._config = config;
	}

	public getConfig(_context: ModuleEndpointContext) {
		if (!this._config) throw new Error('config not initialized');
		return serializer(this._config);
	}

	public getRegisteredHandlers(_context: ModuleEndpointContext): RegisteredMethodResponse {
		if (!this._handler) throw new Error('FeeConversionEndpoint is not initialized');
		const handlers: RegisteredMethod[] = [];
		const keys = this._handler.keys();

		for (const key of keys) {
			handlers.push({ module: key, method: this._handler.get(key).map(t => t.name) });
		}

		return { handlers };
	}
}
