/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { InternalLiquidPosMethod } from './internal_method';
import { serializer } from './utils';
import { LiquidPosGovernableConfig } from './config';
import { getConfigEndpointResponseSchema, getLSTTokenIDEndpointResponseSchema } from './schema';

export class LiquidPosEndpoint extends BaseEndpoint {
	private _internalMethod: InternalLiquidPosMethod | undefined;

	public addDependencies(internalMethod: InternalLiquidPosMethod) {
		this._internalMethod = internalMethod;
	}

	public async getConfig(_context: ModuleEndpointContext) {
		const configStore = this.stores.get(LiquidPosGovernableConfig);
		const config = await configStore.getConfig(_context);
		return serializer(config, getConfigEndpointResponseSchema);
	}

	public getLSTTokenID(_context: ModuleEndpointContext) {
		if (!this._internalMethod) throw new Error('LiquidPosEndpoint dependencies is not configured');
		const lstTokenId = this._internalMethod.getLstTokenID();

		if (lstTokenId === undefined) throw new Error('retrieve undefined lst token id');

		return serializer({ tokenID: lstTokenId }, getLSTTokenIDEndpointResponseSchema);
	}
}
