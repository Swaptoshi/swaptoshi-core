/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { burnCommandSchema } from '../schema';
import { BurnParams } from '../types';
import { verifyBurnParam } from '../utils';

export class BurnCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<BurnParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyBurnParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<BurnParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
		await positionManager.burn(_context.params.tokenId);
	}

	public schema = burnCommandSchema;
}
