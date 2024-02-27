/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { ICODepositParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { decodeICOPoolAddress } from '../stores/library';
import { icoDepositCommandSchema } from '../schema';

export class IcoDepositCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<ICODepositParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const pool = decodeICOPoolAddress(_context.params.poolAddress);
			const ico = await this.stores
				.get(ICOStore)
				.getImmutableICOPool(context, pool.tokenIn, pool.tokenOut);
			await ico.verifyDeposit(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ICODepositParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const pool = decodeICOPoolAddress(_context.params.poolAddress);
		const ico = await this.stores
			.get(ICOStore)
			.getMutableICOPool(context, pool.tokenIn, pool.tokenOut);
		await ico.deposit(_context.params, false);
	}

	public schema = icoDepositCommandSchema;
}
