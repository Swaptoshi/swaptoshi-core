/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { airdropCreateCommandSchema } from '../schema';
import { AirdropCreateParams } from '../types';
import { AirdropStore } from '../stores/airdrop';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';

export class AirdopCreateCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<AirdropCreateParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const airdrop = await this.stores.get(AirdropStore).getImmutableEmptyAirdrop(context);
			await airdrop.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<AirdropCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const airdrop = await this.stores.get(AirdropStore).getMutableEmptyAirdrop(context);
		await airdrop.create(_context.params, false);
	}

	public schema = airdropCreateCommandSchema;
}
