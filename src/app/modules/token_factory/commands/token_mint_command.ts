/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { TokenMintParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';
import { tokenMintCommandSchema } from '../schema';

export class TokenMintCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<TokenMintParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyMint(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<TokenMintParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableFactory(context, _context.params.tokenId);
		await factory.mint(_context.params, false);
	}

	public schema = tokenMintCommandSchema;
}
