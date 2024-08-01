/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
	BaseModule,
	BlockExecuteContext,
	FeeMethod,
	ModuleInitArgs,
	ModuleMetadata,
	TokenMethod,
	TransactionExecuteContext,
	TransactionVerifyContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { DexMethod } from '../dex/method';
import { FeeConversionMethod } from '../fee_conversion';
import { NFTMethod } from '../nft';
import { TokenFactoryInteroperableMethod } from './cc_method';
import { AirdropCreateCommand } from './commands/airdrop_create_command';
import { AirdropDistributeCommand } from './commands/airdrop_distribute_command';
import { AirdropEditRecipientsCommand } from './commands/airdrop_edit_recipients_command';
import { FactorySetAttributesCommand } from './commands/factory_set_attributes_command';
import { FactoryTransferOwnershipCommand } from './commands/factory_transfer_ownership_command';
import { IcoChangePriceCommand } from './commands/ico_change_price_command';
import { IcoCreateCommand } from './commands/ico_create_command';
import { IcoDepositCommand } from './commands/ico_deposit_command';
import { IcoExactInputCommand } from './commands/ico_exact_input_command';
import { IcoExactInputSingleCommand } from './commands/ico_exact_input_single_command';
import { IcoExactOutputCommand } from './commands/ico_exact_output_command';
import { IcoExactOutputSingleCommand } from './commands/ico_exact_output_single_command';
import { IcoTreasurifyCommand } from './commands/ico_treasurify_command';
import { IcoWithdrawCommand } from './commands/ico_withdraw_command';
import { TokenBurnCommand } from './commands/token_burn_command';
import { TokenCreateCommand } from './commands/token_create_command';
import { TokenMintCommand } from './commands/token_mint_command';
import { TokenFactoryEndpoint } from './endpoint';
import { AirdropCreatedEvent } from './events/airdrop_created';
import { AirdropDistributedEvent } from './events/airdrop_distributed';
import { AirdropRecipientsChangedEvent } from './events/airdrop_recipients_changed';
import { FactoryCreatedEvent } from './events/factory_created';
import { FactoryOwnerChangedEvent } from './events/factory_owner_changed';
import { FactorySetAttributesEvent } from './events/factory_set_attributes';
import { IcoCreatedEvent } from './events/ico_created';
import { IcoDepositEvent } from './events/ico_deposit';
import { IcoPriceChangedEvent } from './events/ico_price_changed';
import { IcoSwapEvent } from './events/ico_swap';
import { IcoTreasurifyEvent } from './events/ico_treasurify';
import { IcoWithdrawEvent } from './events/ico_withdraw';
import { VestedTokenLockedEvent } from './events/vested_token_locked';
import { VestedTokenUnlockedEvent } from './events/vested_token_unlocked';
import { executeBaseFee, executeSwapByTransfer, executeVestingUnlock, verifyBaseFee, verifyMinimumFee, verifySwapByTransfer, verifyValidTransfer } from './hooks';
import { TokenFactoryMethod } from './method';
import {
	getAirdropEndpointRequestSchema,
	getAirdropEndpointResponseSchema,
	getConfigEndpointRequestSchema,
	getConfigEndpointResponseSchema,
	getFactoryEndpointRequestSchema,
	getFactoryEndpointResponseSchema,
	getICOPoolEndpointRequestSchema,
	getICOPoolEndpointResponseSchema,
	getNextAvailableTokenIdEndpointRequestSchema,
	getNextAvailableTokenIdEndpointResponseSchema,
	getVestingUnlockEndpointRequestSchema,
	getVestingUnlockEndpointResponseSchema,
	quoteICOExactInputEndpointRequestSchema,
	quoteICOExactInputEndpointResponseSchema,
	quoteICOExactInputSingleEndpointRequestSchema,
	quoteICOExactInputSingleEndpointResponseSchema,
	quoteICOExactOutputEndpointRequestSchema,
	quoteICOExactOutputEndpointResponseSchema,
	quoteICOExactOutputSingleEndpointRequestSchema,
	quoteICOExactOutputSingleEndpointResponseSchema,
} from './schema';
import { AirdropStore } from './stores/airdrop';
import { FactoryStore } from './stores/factory';
import { ICOStore } from './stores/ico';
import { NextAvailableTokenIdStore } from './stores/next_available_token_id';
import { VestingUnlockStore } from './stores/vesting_unlock';
import { TokenFactoryModuleDependencies } from './types';
import { TokenFactoryGovernableConfig } from './config';
import { GovernanceMethod } from '../governance';

export class TokenFactoryModule extends BaseModule {
	public _config: TokenFactoryGovernableConfig = new TokenFactoryGovernableConfig(this.name, 5);
	public _feeMethod: FeeMethod | undefined;
	public _feeConversionMethod: FeeConversionMethod | undefined;
	public _tokenMethod: TokenMethod | undefined;
	public _nftMethod: NFTMethod | undefined;
	public _dexMethod: DexMethod | undefined;
	public _governanceMethod: GovernanceMethod | undefined;
	public _tokenFactoryInteroperableMethod = new TokenFactoryInteroperableMethod(this.stores, this.events);

	public crossChainCommand = [];
	public crossChainMethod = this._tokenFactoryInteroperableMethod;

	public endpoint = new TokenFactoryEndpoint(this.stores, this.offchainStores);
	public method = new TokenFactoryMethod(this.stores, this.events);
	public commands = [
		new TokenCreateCommand(this.stores, this.events),
		new TokenMintCommand(this.stores, this.events),
		new TokenBurnCommand(this.stores, this.events),
		new FactoryTransferOwnershipCommand(this.stores, this.events),
		new FactorySetAttributesCommand(this.stores, this.events),
		new IcoCreateCommand(this.stores, this.events),
		new IcoChangePriceCommand(this.stores, this.events),
		new IcoDepositCommand(this.stores, this.events),
		new IcoWithdrawCommand(this.stores, this.events),
		new IcoTreasurifyCommand(this.stores, this.events),
		new IcoExactInputCommand(this.stores, this.events),
		new IcoExactInputSingleCommand(this.stores, this.events),
		new IcoExactOutputCommand(this.stores, this.events),
		new IcoExactOutputSingleCommand(this.stores, this.events),
		new AirdropCreateCommand(this.stores, this.events),
		new AirdropEditRecipientsCommand(this.stores, this.events),
		new AirdropDistributeCommand(this.stores, this.events),
	];

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(AirdropStore, new AirdropStore(this.name, 0, this.stores, this.events));
		this.stores.register(FactoryStore, new FactoryStore(this.name, 1, this.stores, this.events));
		this.stores.register(ICOStore, new ICOStore(this.name, 2, this.stores, this.events));
		this.stores.register(NextAvailableTokenIdStore, new NextAvailableTokenIdStore(this.name, 3));
		this.stores.register(VestingUnlockStore, new VestingUnlockStore(this.name, 4, this.stores, this.events));
		this.stores.register(TokenFactoryGovernableConfig, this._config); // index number 5

		this.events.register(AirdropCreatedEvent, new AirdropCreatedEvent(this.name));
		this.events.register(AirdropDistributedEvent, new AirdropDistributedEvent(this.name));
		this.events.register(AirdropRecipientsChangedEvent, new AirdropRecipientsChangedEvent(this.name));
		this.events.register(FactoryCreatedEvent, new FactoryCreatedEvent(this.name));
		this.events.register(FactorySetAttributesEvent, new FactorySetAttributesEvent(this.name));
		this.events.register(FactoryOwnerChangedEvent, new FactoryOwnerChangedEvent(this.name));
		this.events.register(IcoCreatedEvent, new IcoCreatedEvent(this.name));
		this.events.register(IcoDepositEvent, new IcoDepositEvent(this.name));
		this.events.register(IcoPriceChangedEvent, new IcoPriceChangedEvent(this.name));
		this.events.register(IcoSwapEvent, new IcoSwapEvent(this.name));
		this.events.register(IcoTreasurifyEvent, new IcoTreasurifyEvent(this.name));
		this.events.register(IcoWithdrawEvent, new IcoWithdrawEvent(this.name));
		this.events.register(VestedTokenLockedEvent, new VestedTokenLockedEvent(this.name));
		this.events.register(VestedTokenUnlockedEvent, new VestedTokenUnlockedEvent(this.name));
	}

	public addDependencies(dependencies: TokenFactoryModuleDependencies) {
		const airdropStore = this.stores.get(AirdropStore);
		const factoryStore = this.stores.get(FactoryStore);
		const icoStore = this.stores.get(ICOStore);
		const vestingUnlockStore = this.stores.get(VestingUnlockStore);

		airdropStore.addDependencies(dependencies);
		factoryStore.addDependencies(dependencies);
		icoStore.addDependencies(dependencies);
		vestingUnlockStore.addDependencies(dependencies);

		this._feeMethod = dependencies.feeMethod;
		this._tokenMethod = dependencies.tokenMethod;
		this._nftMethod = dependencies.nftMethod;
		this._governanceMethod = dependencies.governanceMethod;

		this._tokenFactoryInteroperableMethod.addDependencies(dependencies.interoperabilityMethod, dependencies.tokenMethod, dependencies.nftMethod);
		this._config.addDependencies(this.stores, dependencies.dexMethod, dependencies.feeConversionMethod);

		if (dependencies.dexMethod) {
			this._dexMethod = dependencies.dexMethod;
		}

		if (dependencies.feeConversionMethod) {
			this._feeConversionMethod = dependencies.feeConversionMethod;
			this._feeConversionMethod.addDependencies(dependencies.tokenMethod, dependencies.feeMethod);
		}
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getConfig.name,
					request: getConfigEndpointRequestSchema,
					response: getConfigEndpointResponseSchema,
				},
				{
					name: this.endpoint.getICOPool.name,
					request: getICOPoolEndpointRequestSchema,
					response: getICOPoolEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteICOExactInput.name,
					request: quoteICOExactInputEndpointRequestSchema,
					response: quoteICOExactInputEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteICOExactInputSingle.name,
					request: quoteICOExactInputSingleEndpointRequestSchema,
					response: quoteICOExactInputSingleEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteICOExactOutput.name,
					request: quoteICOExactOutputEndpointRequestSchema,
					response: quoteICOExactOutputEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteICOExactOutputSingle.name,
					request: quoteICOExactOutputSingleEndpointRequestSchema,
					response: quoteICOExactOutputSingleEndpointResponseSchema,
				},
				{
					name: this.endpoint.getAirdrop.name,
					request: getAirdropEndpointRequestSchema,
					response: getAirdropEndpointResponseSchema,
				},
				{
					name: this.endpoint.getFactory.name,
					request: getFactoryEndpointRequestSchema,
					response: getFactoryEndpointResponseSchema,
				},
				{
					name: this.endpoint.getNextAvailableTokenId.name,
					request: getNextAvailableTokenIdEndpointRequestSchema,
					response: getNextAvailableTokenIdEndpointResponseSchema,
				},
				{
					name: this.endpoint.getVestingUnlock.name,
					request: getVestingUnlockEndpointRequestSchema,
					response: getVestingUnlockEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async init(_args: ModuleInitArgs): Promise<void> {
		const airdropStore = this.stores.get(AirdropStore);
		const factoryStore = this.stores.get(FactoryStore);
		const icoStore = this.stores.get(ICOStore);
		const vestingUnlockStore = this.stores.get(VestingUnlockStore);

		airdropStore.init(_args.genesisConfig, this._config);
		factoryStore.init(_args.genesisConfig, this._config);
		icoStore.init(_args.genesisConfig, this._config);
		vestingUnlockStore.init(_args.genesisConfig, this._config);

		if (this._governanceMethod) {
			this._governanceMethod.registerGovernableConfig(_args, this.name, this._config);
		}

		if (!this._feeMethod || !this._tokenMethod || !this._nftMethod) {
			throw new Error('token_factory module dependencies is not configured, make sure TokenFactoryModule.addDependencies() is called before module registration');
		}
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyTransaction(_context: TransactionVerifyContext): Promise<VerificationResult> {
		try {
			await verifyMinimumFee.bind(this)(_context);
			await verifyBaseFee.bind(this)(_context);
			await verifyValidTransfer.bind(this)(_context);
			await verifySwapByTransfer.bind(this)(_context);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async beforeCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await verifyMinimumFee.bind(this)(_context);
		await verifyBaseFee.bind(this)(_context);
		await verifyValidTransfer.bind(this)(_context);
		await verifySwapByTransfer.bind(this)(_context);
		await executeBaseFee.bind(this)(_context);
	}

	public async afterCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await executeSwapByTransfer.bind(this)(_context);
	}

	public async beforeTransactionsExecute(_context: BlockExecuteContext): Promise<void> {
		await executeVestingUnlock.bind(this)(_context);
	}
}
