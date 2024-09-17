/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { commandSwapContext } from '../stores/context';
import { PoolStore } from '../stores/pool';
import { createPoolCommandSchema } from '../schema';
import { CreatePoolParams } from '../types';
import { verifyCreatePoolParam, inversePriceSqrt } from '../utils';

export class CreatePoolCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<CreatePoolParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyCreatePoolParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<CreatePoolParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const { tokenA, tokenADecimal, tokenASymbol, tokenB, tokenBDecimal, tokenBSymbol, fee, sqrtPriceX96 } = _context.params;
		const pool = await poolStore.createPool(context, tokenA, tokenASymbol, tokenADecimal, tokenB, tokenBSymbol, tokenBDecimal, fee);
		await pool.initialize(tokenA.compare(tokenB) >= 0 ? inversePriceSqrt(sqrtPriceX96) : sqrtPriceX96);
	}

	public schema = createPoolCommandSchema;
}
