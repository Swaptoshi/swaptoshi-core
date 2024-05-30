/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { ICOWithdrawParams } from '../types';
import { icoWithdrawCommandSchema } from '../schema';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { decodeICOPoolAddress } from '../stores/library';
import { ICOStore } from '../stores/ico';

export class IcoWithdrawCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<ICOWithdrawParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const pool = decodeICOPoolAddress(_context.params.poolAddress);
			const ico = await this.stores
				.get(ICOStore)
				.getImmutableICOPool(context, pool.tokenIn, pool.tokenOut);
			await ico.verifyWithdraw(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ICOWithdrawParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const pool = decodeICOPoolAddress(_context.params.poolAddress);
		const ico = await this.stores
			.get(ICOStore)
			.getMutableICOPool(context, pool.tokenIn, pool.tokenOut);
		await ico.withdraw(_context.params, false);
	}

	public schema = icoWithdrawCommandSchema;
}
