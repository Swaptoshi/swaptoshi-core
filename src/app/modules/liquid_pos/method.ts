/* eslint-disable */
import { BaseMethod, MethodContext } from 'klayr-sdk';
import { InternalLiquidPosMethod } from './internal_method';

export class LiquidPosMethod extends BaseMethod {
	private _internalMethod: InternalLiquidPosMethod | undefined;

	public addDependencies(internalMethod: InternalLiquidPosMethod) {
		this._internalMethod = internalMethod;
	}

	public getLSTTokenID() {
		if (!this._internalMethod) throw new Error('LiquidPosMethod dependencies is not configured');
		const lstTokenId = this._internalMethod.getLstTokenID();

		if (lstTokenId === undefined) throw new Error('retrieve undefined lst token id');

		return lstTokenId;
	}

	public async mint(context: MethodContext, address: Buffer, amount: bigint) {
		if (!this._internalMethod) throw new Error('LiquidPosMethod dependencies is not configured');
		await this._internalMethod.mint(context, address, amount);
	}

	public async burn(context: MethodContext, address: Buffer, amount: bigint) {
		if (!this._internalMethod) throw new Error('LiquidPosMethod dependencies is not configured');
		await this._internalMethod.burn(context, address, amount);
	}
}