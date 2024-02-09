/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MutableSwapContext } from '../../../../../../../src/app/modules/dex/types';
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import { DEXPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import {
	Int256String,
	Uint160String,
	Int256,
	Uint256,
} from '../../../../../../../src/app/modules/dex/stores/library/int';
import { PoolAddress } from '../../../../../../../src/app/modules/dex/stores/library/periphery';
import { PoolStore } from '../../../../../../../src/app/modules/dex/stores/pool';

export const mockedTestSwapCallback = jest.fn();

export class SwapTest {
	public constructor(context: MutableSwapContext, module: DexModule) {
		this.module = module;
		this.context = context;
	}

	public async getSwapResult(
		pool: DEXPool,
		zeroForOne: boolean,
		amountSpecified: Int256String,
		sqrtPriceLimitX96: Uint160String,
	) {
		const [amount0Delta, amount1Delta] = await pool.swap(
			Buffer.alloc(0),
			zeroForOne,
			amountSpecified,
			sqrtPriceLimitX96,
			pool.address.toString('hex'),
			this._swapCallback.bind(this),
		);

		const { sqrtPriceX96 } = pool.slot0;
		return { amount0Delta, amount1Delta, nextSqrtRatio: sqrtPriceX96 };
	}

	public async _swapCallback(amount0Delta: Int256String, amount1Delta: Int256String, data: string) {
		mockedTestSwapCallback(amount0Delta, amount1Delta);

		const poolStore = this.module.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(data, 'hex'));
		const pool = await poolStore.getMutablePool(this.context, token0, token1, fee);

		if (Int256.from(amount0Delta).gt(0)) {
			await this.module._tokenMethod!.transfer(
				this.context.context,
				this.context.senderAddress,
				pool.address,
				pool.token0,
				Uint256.from(amount0Delta).toBigInt(),
			);
		} else {
			await this.module._tokenMethod!.transfer(
				this.context.context,
				this.context.senderAddress,
				pool.address,
				pool.token1,
				Uint256.from(amount1Delta).toBigInt(),
			);
		}
	}

	context: MutableSwapContext;
	module: DexModule;
}
