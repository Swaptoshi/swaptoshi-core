/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { Modules, StateMachine } from 'klayr-sdk';
import { FeeConversionMethod } from '../fee_conversion';
import { GovernanceMethod } from '../governance';
import { TokenFactoryMethod } from '../token_factory/method';
import { DexInteroperableMethod } from './cc_method';
import { BurnCommand } from './commands/burn_command';
import { CollectCommand } from './commands/collect_command';
import { CollectTreasuryCommand } from './commands/collect_treasury_command';
import { CreatePoolCommand } from './commands/create_pool_command';
import { DecreaseLiquidityCommand } from './commands/decrease_liquidity_command';
import { ExactInputCommand } from './commands/exact_input_command';
import { ExactInputSingleCommand } from './commands/exact_input_single_command';
import { ExactOutputCommand } from './commands/exact_output_command';
import { ExactOutputSingleCommand } from './commands/exact_output_single_command';
import { IncreaseLiquidityCommand } from './commands/increase_liquidity_command';
import { MintCommand } from './commands/mint_command';
import { TreasurifyCommand } from './commands/treasurify_command';
import { DexGovernableConfig } from './config';
import { DexEndpoint } from './endpoint';
import { BurnEvent } from './events/burn';
import { CollectEvent } from './events/collect';
import { CollectPositionEvent } from './events/collect_position';
import { CollectProtocolEvent } from './events/collect_protocol';
import { DecreaseLiquidityEvent } from './events/decrease_liquidity';
import { FlashEvent } from './events/flash';
import { IncreaseLiquidityEvent } from './events/increase_liquidity';
import { IncreaseObservationCardinalityNextEvent } from './events/increase_observation_cardinality_next';
import { MintEvent } from './events/mint';
import { PoolCreatedEvent } from './events/pool_created';
import { PoolInitializedEvent } from './events/pool_initialized';
import { SwapEvent } from './events/swap';
import { TokenURICreatedEvent } from './events/tokenuri_created';
import { TokenURIDestroyedEvent } from './events/tokenuri_destroyed';
import { TokenRegisteredEvent } from './events/token_registered';
import { TreasurifyEvent } from './events/treasurify';
import { executeBaseFee, executeSwapByTransfer, verifyBaseFee, verifyMinimumFee, verifySwapByTransfer, verifyValidTransfer } from './hooks';
import { DexMethod } from './method';
import {
	getConfigEndpointRequestSchema,
	getConfigEndpointResponseSchema,
	getMetadataEndpointRequestSchema,
	getMetadataEndpointResponseSchema,
	getPoolAddressFromCollectionIdEndpointRequestSchema,
	getPoolAddressFromCollectionIdEndpointResponseSchema,
	getPoolEndpointRequestSchema,
	getPoolEndpointResponseSchema,
	getPositionEndpointRequestSchema,
	getPositionEndpointResponseSchema,
	getTokenURIEndpointRequestSchema,
	getTokenURIEndpointResponseSchema,
	observeEndpointRequestSchema,
	observeEndpointResponseSchema,
	quoteExactInputEndpointRequestSchema,
	quoteExactInputEndpointResponseSchema,
	quoteExactInputSingleEndpointRequestSchema,
	quoteExactInputSingleEndpointResponseSchema,
	quoteExactOutputEndpointRequestSchema,
	quoteExactOutputEndpointResponseSchema,
	quoteExactOutputSingleEndpointRequestSchema,
	quoteExactOutputSingleEndpointResponseSchema,
	quotePriceEndpointRequestSchema,
	quotePriceEndpointResponseSchema,
} from './schema';
import { ObservationStore } from './stores/observation';
import { PoolStore } from './stores/pool';
import { PositionInfoStore } from './stores/position_info';
import { PositionManagerStore } from './stores/position_manager';
import { SupportedTokenStore } from './stores/supported_token';
import { TickBitmapStore } from './stores/tick_bitmap';
import { TickInfoStore } from './stores/tick_info';
import { TokenSymbolStore } from './stores/token_symbol';
import { DexModuleDependencies, FeeMethod, TokenMethod } from './types';

export class DexModule extends Modules.Interoperability.BaseInteroperableModule {
	public _config: DexGovernableConfig = new DexGovernableConfig(this.name, 8);
	public _feeMethod: FeeMethod | undefined;
	public _feeConversionMethod: FeeConversionMethod | undefined;
	public _tokenMethod: TokenMethod | undefined;
	public _tokenFactoryMethod: TokenFactoryMethod | undefined;
	public _governanceMethod: GovernanceMethod | undefined;
	public _dexInteroperableMethod = new DexInteroperableMethod(this.stores, this.events);

	public crossChainCommand = [];
	public crossChainMethod = this._dexInteroperableMethod;

	public endpoint = new DexEndpoint(this.stores, this.offchainStores);
	public method = new DexMethod(this.stores, this.events);
	public commands = [
		new CreatePoolCommand(this.stores, this.events),
		new MintCommand(this.stores, this.events),
		new IncreaseLiquidityCommand(this.stores, this.events),
		new DecreaseLiquidityCommand(this.stores, this.events),
		new CollectCommand(this.stores, this.events),
		new BurnCommand(this.stores, this.events),
		new ExactInputCommand(this.stores, this.events),
		new ExactInputSingleCommand(this.stores, this.events),
		new ExactOutputCommand(this.stores, this.events),
		new ExactOutputSingleCommand(this.stores, this.events),
		new TreasurifyCommand(this.stores, this.events),
		new CollectTreasuryCommand(this.stores, this.events),
	];

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(PoolStore, new PoolStore(this.name, 0, this.stores, this.events));
		this.stores.register(PositionManagerStore, new PositionManagerStore(this.name, 1, this.stores, this.events));

		this.stores.register(ObservationStore, new ObservationStore(this.name, 2));
		this.stores.register(PositionInfoStore, new PositionInfoStore(this.name, 3));
		this.stores.register(TickBitmapStore, new TickBitmapStore(this.name, 4));
		this.stores.register(TickInfoStore, new TickInfoStore(this.name, 5));
		this.stores.register(TokenSymbolStore, new TokenSymbolStore(this.name, 6, this.events));
		this.stores.register(SupportedTokenStore, new SupportedTokenStore(this.name, 7));
		this.stores.register(DexGovernableConfig, this._config); // index number is 8

		this.events.register(BurnEvent, new BurnEvent(this.name));
		this.events.register(CollectPositionEvent, new CollectPositionEvent(this.name));
		this.events.register(CollectProtocolEvent, new CollectProtocolEvent(this.name));
		this.events.register(CollectEvent, new CollectEvent(this.name));
		this.events.register(DecreaseLiquidityEvent, new DecreaseLiquidityEvent(this.name));
		this.events.register(FlashEvent, new FlashEvent(this.name));
		this.events.register(IncreaseLiquidityEvent, new IncreaseLiquidityEvent(this.name));
		this.events.register(IncreaseObservationCardinalityNextEvent, new IncreaseObservationCardinalityNextEvent(this.name));
		this.events.register(MintEvent, new MintEvent(this.name));
		this.events.register(PoolCreatedEvent, new PoolCreatedEvent(this.name));
		this.events.register(PoolInitializedEvent, new PoolInitializedEvent(this.name));
		this.events.register(SwapEvent, new SwapEvent(this.name));
		this.events.register(TokenURICreatedEvent, new TokenURICreatedEvent(this.name));
		this.events.register(TokenURIDestroyedEvent, new TokenURIDestroyedEvent(this.name));
		this.events.register(TreasurifyEvent, new TreasurifyEvent(this.name));
		this.events.register(TokenRegisteredEvent, new TokenRegisteredEvent(this.name));
	}

	public addDependencies(dependencies: DexModuleDependencies) {
		const poolStore = this.stores.get(PoolStore);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const supportManagerStore = this.stores.get(SupportedTokenStore);

		poolStore.addDependencies(dependencies.tokenMethod);
		positionManagerStore.addDependencies(dependencies.tokenMethod, dependencies.nftMethod);
		supportManagerStore.addDependencies(dependencies.tokenMethod);

		this._feeMethod = dependencies.feeMethod;
		this._tokenMethod = dependencies.tokenMethod;
		this._governanceMethod = dependencies.governanceMethod;
		this._dexInteroperableMethod.addDependencies(dependencies.interoperabilityMethod, dependencies.tokenMethod, dependencies.nftMethod);
		this._config.addDependencies(this.stores, dependencies.feeConversionMethod);

		if (dependencies.feeConversionMethod) {
			this._feeConversionMethod = dependencies.feeConversionMethod;
			this._feeConversionMethod.addDependencies(dependencies.tokenMethod, dependencies.feeMethod);
		}
	}

	public metadata(): Modules.ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getConfig.name,
					request: getConfigEndpointRequestSchema,
					response: getConfigEndpointResponseSchema,
				},
				{
					name: this.endpoint.getPool.name,
					request: getPoolEndpointRequestSchema,
					response: getPoolEndpointResponseSchema,
				},
				{
					name: this.endpoint.getPosition.name,
					request: getPositionEndpointRequestSchema,
					response: getPositionEndpointResponseSchema,
				},
				{
					name: this.endpoint.getTokenURI.name,
					request: getTokenURIEndpointRequestSchema,
					response: getTokenURIEndpointResponseSchema,
				},
				{
					name: this.endpoint.getPoolAddressFromCollectionId.name,
					request: getPoolAddressFromCollectionIdEndpointRequestSchema,
					response: getPoolAddressFromCollectionIdEndpointResponseSchema,
				},
				{
					name: this.endpoint.getMetadata.name,
					request: getMetadataEndpointRequestSchema,
					response: getMetadataEndpointResponseSchema,
				},
				{
					name: this.endpoint.observe.name,
					request: observeEndpointRequestSchema,
					response: observeEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteExactInput.name,
					request: quoteExactInputEndpointRequestSchema,
					response: quoteExactInputEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteExactInputSingle.name,
					request: quoteExactInputSingleEndpointRequestSchema,
					response: quoteExactInputSingleEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteExactOutput.name,
					request: quoteExactOutputEndpointRequestSchema,
					response: quoteExactOutputEndpointResponseSchema,
				},
				{
					name: this.endpoint.quoteExactOutputSingle.name,
					request: quoteExactOutputSingleEndpointRequestSchema,
					response: quoteExactOutputSingleEndpointResponseSchema,
				},
				{
					name: this.endpoint.quotePrice.name,
					request: quotePriceEndpointRequestSchema,
					response: quotePriceEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async init(_args: Modules.ModuleInitArgs): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const supportedTokenStore = this.stores.get(SupportedTokenStore);
		const tokenSymbolStore = this.stores.get(TokenSymbolStore);

		poolStore.init(this._config);
		positionManagerStore.init(_args.genesisConfig, this._config);
		supportedTokenStore.init(this._config);
		tokenSymbolStore.init(_args.genesisConfig, this._config);

		if (this._governanceMethod) {
			this._governanceMethod.registerGovernableConfig(_args, this.name, this._config);
		} else {
			this._config.init(_args);
		}

		if (!this._tokenMethod || !this._feeMethod) {
			throw new Error('dex module dependencies is not configured, make sure DexModule.addDependencies() is called before module registration');
		}
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyTransaction(_context: StateMachine.TransactionVerifyContext): Promise<StateMachine.VerificationResult> {
		try {
			await verifyMinimumFee.bind(this)(_context);
			await verifyBaseFee.bind(this)(_context);
			await verifyValidTransfer.bind(this)(_context);
			await verifySwapByTransfer.bind(this)(_context);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async beforeCommandExecute(_context: StateMachine.TransactionExecuteContext): Promise<void> {
		await verifyMinimumFee.bind(this)(_context);
		await verifyBaseFee.bind(this)(_context);
		await verifyValidTransfer.bind(this)(_context);
		await verifySwapByTransfer.bind(this)(_context);
		await executeBaseFee.bind(this)(_context);
	}

	public async afterCommandExecute(_context: StateMachine.TransactionExecuteContext): Promise<void> {
		await executeSwapByTransfer.bind(this)(_context);
	}

	public async beforeTransactionsExecute(context: StateMachine.BlockExecuteContext): Promise<void> {
		await this.stores.get(SupportedTokenStore).apply(context);
	}
}
