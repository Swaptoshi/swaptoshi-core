/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { TokenMintParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';
import { tokenMintCommandSchema } from '../schema';

export class TokenMintCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<TokenMintParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores
				.get(FactoryStore)
				.getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyMint(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<TokenMintParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores
			.get(FactoryStore)
			.getMutableFactory(context, _context.params.tokenId);
		await factory.mint(_context.params, false);
	}

	public schema = tokenMintCommandSchema;
}
