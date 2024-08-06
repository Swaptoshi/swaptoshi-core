/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, BlockAfterExecuteContext, BlockExecuteContext, GenesisBlockExecuteContext, ModuleInitArgs, ModuleMetadata, TokenMethod } from 'klayr-sdk';
import { GovernanceEndpoint } from './endpoint';
import { GovernanceMethod } from './method';
import { GovernanceInternalMethod } from './internal_method';
import { TreasuryMintEvent } from './events/treasury_mint';
import { TreasuryBlockRewardTaxEvent } from './events/treasury_block_reward_tax';
import { ConfigUpdatedEvent } from './events/config_updated';
import { GovernableConfigRegistry } from './registry';
import { GovernanceGovernableConfig } from './config';
import { DelegatedVoteRevokedEvent } from './events/delegated_vote_revoked';
import { ProposalCreatedEvent } from './events/proposal_created';
import { ProposalOutcomeEvent } from './events/proposal_outcome';
import { ProposalQuorumCheckedEvent } from './events/proposal_quorum_checked';
import { ProposalSetAttributesEvent } from './events/proposal_set_attributes';
import { ProposalVotedEvent } from './events/proposal_voted';
import { VoteBoostedEvent } from './events/vote_boosted';
import { VoteDelegatedEvent } from './events/vote_delegated';

export class GovernanceModule extends BaseModule {
	public endpoint = new GovernanceEndpoint(this.stores, this.offchainStores);
	public method = new GovernanceMethod(this.stores, this.events);
	public commands = [];

	private readonly _config = new GovernanceGovernableConfig(this.name, 0);
	private readonly _governableConfig = new GovernableConfigRegistry();
	private readonly _internalMethod = new GovernanceInternalMethod(this.stores, this.events);

	public constructor() {
		super();
		this.stores.register(GovernanceGovernableConfig, this._config);

		this.events.register(ConfigUpdatedEvent, new ConfigUpdatedEvent(this.name));
		this.events.register(DelegatedVoteRevokedEvent, new DelegatedVoteRevokedEvent(this.name));
		this.events.register(ProposalCreatedEvent, new ProposalCreatedEvent(this.name));
		this.events.register(ProposalOutcomeEvent, new ProposalOutcomeEvent(this.name));
		this.events.register(ProposalQuorumCheckedEvent, new ProposalQuorumCheckedEvent(this.name));
		this.events.register(ProposalSetAttributesEvent, new ProposalSetAttributesEvent(this.name));
		this.events.register(ProposalVotedEvent, new ProposalVotedEvent(this.name));
		this.events.register(TreasuryBlockRewardTaxEvent, new TreasuryBlockRewardTaxEvent(this.name));
		this.events.register(TreasuryMintEvent, new TreasuryMintEvent(this.name));
		this.events.register(VoteBoostedEvent, new VoteBoostedEvent(this.name));
		this.events.register(VoteDelegatedEvent, new VoteDelegatedEvent(this.name));

		this.method.init(this._governableConfig);
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [],
			assets: [],
		};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async init(args: ModuleInitArgs): Promise<void> {
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

	public async initGenesisState(context: GenesisBlockExecuteContext): Promise<void> {
		await this._internalMethod.verifyGovernableConfig(context);
	}
}
