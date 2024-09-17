/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { ICOChangePriceParams } from '../types';
import { icoChangePriceCommandSchema } from '../schema';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { decodeICOPoolAddress } from '../stores/library';

export class IcoChangePriceCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<ICOChangePriceParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const pool = decodeICOPoolAddress(_context.params.poolAddress);
			const ico = await this.stores.get(ICOStore).getImmutableICOPool(context, pool.tokenIn, pool.tokenOut);
			await ico.verifyChangePrice(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ICOChangePriceParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const pool = decodeICOPoolAddress(_context.params.poolAddress);
		const ico = await this.stores.get(ICOStore).getMutableICOPool(context, pool.tokenIn, pool.tokenOut);
		await ico.changePrice(_context.params, false);
	}

	public schema = icoChangePriceCommandSchema;
}
