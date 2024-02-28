/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { ICOChangePriceParams } from '../types';
import { icoChangePriceCommandSchema } from '../schema';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { decodeICOPoolAddress } from '../stores/library';

export class IcoChangePriceCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<ICOChangePriceParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const pool = decodeICOPoolAddress(_context.params.poolAddress);
			const ico = await this.stores
				.get(ICOStore)
				.getImmutableICOPool(context, pool.tokenIn, pool.tokenOut);
			await ico.verifyChangePrice(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ICOChangePriceParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const pool = decodeICOPoolAddress(_context.params.poolAddress);
		const ico = await this.stores
			.get(ICOStore)
			.getMutableICOPool(context, pool.tokenIn, pool.tokenOut);
		await ico.changePrice(_context.params, false);
	}

	public schema = icoChangePriceCommandSchema;
}
