/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { InternalLiquidPosMethod } from './internal_method';
import { serializer } from './utils';
import { LiquidPosModuleConfig } from './types';

export class LiquidPosEndpoint extends BaseEndpoint {
	private _config: LiquidPosModuleConfig | undefined;
	private _internalMethod: InternalLiquidPosMethod | undefined;

	public init(config: LiquidPosModuleConfig) {
		this._config = config;
	}

	public getConfig(_context: ModuleEndpointContext) {
		if (!this._config) throw new Error('config not initialized');
		return serializer(this._config);
	}

	public addDependencies(internalMethod: InternalLiquidPosMethod) {
		this._internalMethod = internalMethod;
	}

	public getLSTTokenID(_context: ModuleEndpointContext) {
		if (!this._internalMethod) throw new Error('LiquidPosEndpoint dependencies is not configured');
		const lstTokenId = this._internalMethod.getLstTokenID();

		if (lstTokenId === undefined) throw new Error('retrieve undefined lst token id');

		return serializer({ tokenID: lstTokenId });
	}
}
