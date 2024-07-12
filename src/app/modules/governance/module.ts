/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, BlockAfterExecuteContext, ModuleInitArgs, ModuleMetadata, TokenMethod, utils } from 'klayr-sdk';
import { GovernanceEndpoint } from './endpoint';
import { GovernanceMethod } from './method';
import { GovernanceInternalMethod } from './internal_method';
import { GovernanceModuleConfig } from './types';
import { defaultConfig } from './constants';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tex';

export class GovernanceModule extends BaseModule {
	public endpoint = new GovernanceEndpoint(this.stores, this.offchainStores);
	public method = new GovernanceMethod(this.stores, this.events);
	public commands = [];

	private _config: GovernanceModuleConfig | undefined;
	private _internalMethod = new GovernanceInternalMethod(this.stores, this.events);

	public constructor() {
		super();
		this.events.register(TreasuryMintEvent, new TreasuryMintEvent(this.name));
		this.events.register(TreasuryBlockRewardTaxEvent, new TreasuryBlockRewardTaxEvent(this.name));
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [],
			assets: [],
		};
	}

	public async init(args: ModuleInitArgs): Promise<void> {
		this._config = utils.objects.mergeDeep({}, defaultConfig, { treasuryReward: { tokenID: `${args.genesisConfig.chainID}00000000` } }, args.moduleConfig) as GovernanceModuleConfig;
		this._internalMethod.init(this._config);
	}

	public addDependencies(token: TokenMethod) {
		this._internalMethod.addDependencies(token);
	}

	public async afterTransactionsExecute(context: BlockAfterExecuteContext): Promise<void> {
		await this._internalMethod.addTreasuryReward(context);
	}
}
