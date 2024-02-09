/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import { DEXPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import {
	Uint160String,
	Int256String,
	Uint256String,
	Uint256,
} from '../../../../../../../src/app/modules/dex/stores/library/int';
import { PoolAddress } from '../../../../../../../src/app/modules/dex/stores/library/periphery';
import { PoolStore } from '../../../../../../../src/app/modules/dex/stores/pool';
import { MutableSwapContext } from '../../../../../../../src/app/modules/dex/types';

export class TestSwapPay {
	public constructor(context: MutableSwapContext, module: DexModule) {
		this.module = module;
		this.context = context;
	}

	public async swap(
		pool: DEXPool,
		recipient: Buffer,
		zeroForOne: boolean,
		sqrtPriceX96: Uint160String,
		amountSpecified: Int256String,
		pay0: Uint256String,
		pay1: Uint256String,
	) {
		const data = JSON.stringify({
			pool: pool.address.toString('hex'),
			pay0,
			pay1,
		});
		await pool.swap(
			recipient,
			zeroForOne,
			amountSpecified,
			sqrtPriceX96,
			data,
			this._swapCallback.bind(this),
		);
	}

	private async _swapCallback(_1: Int256String, _2: Int256String, data: string) {
		const payload = JSON.parse(data) as { pool: string; pay0: string; pay1: string };

		const poolStore = this.module.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(payload.pool, 'hex'));
		const pool = await poolStore.getMutablePool(this.context, token0, token1, fee);

		if (Uint256.from(payload.pay0).gt(0)) {
			await this.module._tokenMethod!.transfer(
				this.context.context,
				this.context.senderAddress,
				pool.address,
				pool.token0,
				Uint256.from(payload.pay0).toBigInt(),
			);
		} else if (Uint256.from(payload.pay1).gt(0)) {
			await this.module._tokenMethod!.transfer(
				this.context.context,
				this.context.senderAddress,
				pool.address,
				pool.token1,
				Uint256.from(payload.pay1).toBigInt(),
			);
		}
	}

	context: MutableSwapContext;
	module: DexModule;
}
