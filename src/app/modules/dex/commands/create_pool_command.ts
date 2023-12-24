/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { commandSwapContext } from '../stores/context';
import { PoolStore } from '../stores/pool';
import { createPoolCommandSchema } from '../schema/commands/create_pool_command';
import { CreatePoolParams } from '../types';
import { verifyCreatePoolParam } from '../utils/verify';
import { inversePriceSqrt } from '../utils';

export class CreatePoolCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<CreatePoolParams>,
	): Promise<VerificationResult> {
		try {
			verifyCreatePoolParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<CreatePoolParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const {
			tokenA,
			tokenADecimal,
			tokenASymbol,
			tokenB,
			tokenBDecimal,
			tokenBSymbol,
			fee,
			sqrtPriceX96,
		} = _context.params;
		const pool = await poolStore.createPool(
			context,
			tokenA,
			tokenASymbol,
			tokenADecimal,
			tokenB,
			tokenBSymbol,
			tokenBDecimal,
			fee,
		);
		await pool.initialize(
			tokenA.compare(tokenB) >= 0 ? inversePriceSqrt(sqrtPriceX96) : sqrtPriceX96,
		);
	}

	public schema = createPoolCommandSchema;
}
