/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { TokenBurnParams } from '../types';
import { tokenBurnCommandSchema } from '../schema';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class TokenBurnCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<TokenBurnParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores
				.get(FactoryStore)
				.getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyBurn(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<TokenBurnParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores
			.get(FactoryStore)
			.getMutableFactory(context, _context.params.tokenId);
		await factory.burn(_context.params, false);
	}

	public schema = tokenBurnCommandSchema;
}
