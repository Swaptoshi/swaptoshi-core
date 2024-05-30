import { BlockExecuteContext, NamedRegistry } from 'klayr-sdk';
import { mutableBlockHookFactoryContext } from '../../stores/context';
import { VestingUnlockStore } from '../../stores/vesting_unlock';

export async function executeVestingUnlock(
	this: { stores: NamedRegistry; events: NamedRegistry },
	ctx: BlockExecuteContext,
) {
	const context = mutableBlockHookFactoryContext(ctx);
	const vesting = await this.stores.get(VestingUnlockStore).getInstance(context);
	await vesting.unlock();
}
