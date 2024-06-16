/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { FeeConversionMethodRegistry } from './registry';
import { RegisteredMethod, RegisteredMethodResponse } from './types';

export class FeeConversionEndpoint extends BaseEndpoint {
	protected _handler: FeeConversionMethodRegistry | undefined;

	public async init(handler: FeeConversionMethodRegistry) {
		this._handler = handler;
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
