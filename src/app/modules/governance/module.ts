/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, BlockAfterExecuteContext, BlockExecuteContext, ModuleInitArgs, ModuleMetadata, TokenMethod } from 'klayr-sdk';
import { GovernanceEndpoint } from './endpoint';
import { GovernanceMethod } from './method';
import { GovernanceInternalMethod } from './internal_method';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tex';
import { ConfigUpdatedEvent } from './events/config_updated';
import { GovernableConfigRegistry } from './registry';
import { GovernanceGovernableConfig } from './config';

export class GovernanceModule extends BaseModule {
	public endpoint = new GovernanceEndpoint(this.stores, this.offchainStores);
	public method = new GovernanceMethod(this.stores, this.events);
	public commands = [];

	private _config = new GovernanceGovernableConfig(this.name, 0);
	private _governableConfig = new GovernableConfigRegistry();
	private _internalMethod = new GovernanceInternalMethod(this.stores, this.events);

	public constructor() {
		super();
		this.stores.register(GovernanceGovernableConfig, this._config);

		this.events.register(TreasuryMintEvent, new TreasuryMintEvent(this.name));
		this.events.register(ConfigUpdatedEvent, new ConfigUpdatedEvent(this.name));
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
		this.method.init(this._governableConfig);
		this.method.registerGovernableConfig(args, this.name, this._config);
	}

	public addDependencies(token: TokenMethod) {
		this._internalMethod.addDependencies(token, this._governableConfig);
	}

	public async afterTransactionsExecute(context: BlockAfterExecuteContext): Promise<void> {
		await this._internalMethod.addTreasuryReward(context);
	}

	public async beforeTransactionsExecute(context: BlockExecuteContext): Promise<void> {
		await this._internalMethod.initializeGovernableConfig(context);
	}
}
