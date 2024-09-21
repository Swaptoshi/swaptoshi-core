/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as TickMath from '../../../../../../../src/app/modules/dex/stores/library/core/tick_math';
import { MutableSwapContext } from '../../../../../../../src/app/modules/dex/types';
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import { DEXPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import { Uint256String, Int256, Uint160, Int256String, Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { PoolStore } from '../../../../../../../src/app/modules/dex/stores/pool';
import { PoolAddress } from '../../../../../../../src/app/modules/dex/stores/library/periphery';

export const mockedSwapCallback = jest.fn();

export class TestRouter {
	public constructor(context: MutableSwapContext, module: DexModule) {
		this.module = module;
		this.context = context;
	}

	public async swapForExact0Multi(recipient: Buffer, poolInput: DEXPool, poolOutput: DEXPool, amount0Out: Uint256String) {
		const data = JSON.stringify({
			pool0: poolInput.address.toString('hex'),
			pool1: poolOutput.address.toString('hex'),
		});
		await poolOutput.swap(recipient, false, Int256.from(amount0Out).mul(-1).toString(), Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString(), data, this._swapCallback.bind(this));
	}

	public async swapForExact1Multi(recipient: Buffer, poolInput: DEXPool, poolOutput: DEXPool, amount1Out: Uint256String) {
		const data = JSON.stringify({
			pool0: poolInput.address.toString('hex'),
			pool1: poolOutput.address.toString('hex'),
		});
		await poolOutput.swap(recipient, true, Int256.from(amount1Out).mul(-1).toString(), Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString(), data, this._swapCallback.bind(this));
	}

	private async _swapCallback(amount0Delta: Int256String, amount1Delta: Int256String, data: string) {
		mockedSwapCallback(amount0Delta, amount1Delta);

		const { pool0, pool1 } = JSON.parse(data) as { pool0: string; pool1: string };

		const poolStore = this.module.stores.get(PoolStore);
		const { token0: pool0Token0, token1: pool0Token1, fee: pool0Fee } = PoolAddress.decodePoolAddress(Buffer.from(pool0, 'hex'));
		const pool0Inst = await poolStore.getMutablePool(this.context, pool0Token0, pool0Token1, pool0Fee);
		const { token0: pool1Token0, token1: pool1Token1, fee: pool1Fee } = PoolAddress.decodePoolAddress(Buffer.from(pool1, 'hex'));
		const pool1Inst = await poolStore.getMutablePool(this.context, pool1Token0, pool1Token1, pool1Fee);

		const tokenToBePaid: Buffer = Int256.from(amount0Delta).gt(0) ? pool1Inst.token0 : pool1Inst.token1;
		const amountToBePaid = Int256.from(amount0Delta).gt(0) ? amount0Delta : amount1Delta;

		const zeroForOne = tokenToBePaid.compare(pool0Inst.token1) === 0;
		await pool0Inst.swap(
			pool1Inst.address,
			zeroForOne,
			Int256.from(amountToBePaid).mul(-1).toString(),
			zeroForOne ? Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString() : Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString(),
			data,
			this._swapCallback2.bind(this),
		);
	}

	private async _swapCallback2(amount0Delta: Int256String, amount1Delta: Int256String, data: string) {
		mockedSwapCallback(amount0Delta, amount1Delta);

		const { pool0 } = JSON.parse(data) as { pool0: string; pool1: string };

		const poolStore = this.module.stores.get(PoolStore);
		const { token0: pool0Token0, token1: pool0Token1, fee: pool0Fee } = PoolAddress.decodePoolAddress(Buffer.from(pool0, 'hex'));
		const pool0Inst = await poolStore.getMutablePool(this.context, pool0Token0, pool0Token1, pool0Fee);

		if (Int256.from(amount0Delta).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool0Inst.address, pool0Inst.token0, Uint256.from(amount0Delta).toBigInt());
		} else {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool0Inst.address, pool0Inst.token1, Uint256.from(amount1Delta).toBigInt());
		}
	}

	context: MutableSwapContext;
	module: DexModule;
}
