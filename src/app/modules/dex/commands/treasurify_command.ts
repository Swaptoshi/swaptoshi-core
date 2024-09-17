/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { verifyTreasurifyParam } from '../utils';
import { TreasurifyParams } from '../types';
import { treasurifyCommandSchema } from '../schema';
import { PoolStore } from '../stores/pool';

export class TreasurifyCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<TreasurifyParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyTreasurifyParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<TreasurifyParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		await poolStore.releaseTokenToProtocolTreasury(_context, _context.params);
	}

	public schema = treasurifyCommandSchema;
}
