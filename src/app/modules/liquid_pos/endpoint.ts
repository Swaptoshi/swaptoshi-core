/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { InternalLiquidPosMethod } from './internal_method';
import { serializer } from './utils';

export class LiquidPosEndpoint extends BaseEndpoint {
	private _internalMethod: InternalLiquidPosMethod | undefined;

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
