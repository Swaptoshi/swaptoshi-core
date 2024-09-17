/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { ICODepositParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { decodeICOPoolAddress } from '../stores/library';
import { icoDepositCommandSchema } from '../schema';

export class IcoDepositCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<ICODepositParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const pool = decodeICOPoolAddress(_context.params.poolAddress);
			const ico = await this.stores.get(ICOStore).getImmutableICOPool(context, pool.tokenIn, pool.tokenOut);
			await ico.verifyDeposit(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ICODepositParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const pool = decodeICOPoolAddress(_context.params.poolAddress);
		const ico = await this.stores.get(ICOStore).getMutableICOPool(context, pool.tokenIn, pool.tokenOut);
		await ico.deposit(_context.params, false);
	}

	public schema = icoDepositCommandSchema;
}
