/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
	BaseInteroperableModule,
	BlockExecuteContext,
	FeeMethod,
	MainchainInteroperabilityMethod,
	ModuleInitArgs,
	ModuleMetadata,
	NFTMethod,
	SidechainInteroperabilityMethod,
	TokenMethod,
	TransactionExecuteContext,
	TransactionVerifyContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { BurnCommand } from './commands/burn_command';
import { CollectCommand } from './commands/collect_command';
import { CreatePoolCommand } from './commands/create_pool_command';
import { DecreaseLiquidityCommand } from './commands/decrease_liquidity_command';
import { ExactInputCommand } from './commands/exact_input_command';
import { ExactInputSingleCommand } from './commands/exact_input_single_command';
import { ExactOutputCommand } from './commands/exact_output_command';
import { ExactOutputSingleCommand } from './commands/exact_output_single_command';
import { IncreaseLiquidityCommand } from './commands/increase_liquidity_command';
import { MintCommand } from './commands/mint_command';
import { TreasurifyCommand } from './commands/treasurify_command';
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
import { DexMethod } from './method';
import {
	getPoolEndpointRequestSchema,
	getPoolEndpointResponseSchema,
} from './schema/endpoint/get_pool';
import {
	getPositionEndpointRequestSchema,
	getPositionEndpointResponseSchema,
} from './schema/endpoint/get_position';
import {
	getTokenURIEndpointRequestSchema,
	getTokenURIEndpointResponseSchema,
} from './schema/endpoint/get_token_uri';
import {
	observeEndpointRequestSchema,
	observeEndpointResponseSchema,
} from './schema/endpoint/observe';
import {
	quoteExactInputEndpointRequestSchema,
	quoteExactInputEndpointResponseSchema,
} from './schema/endpoint/quote_exact_input';
import {
	quoteExactInputSingleEndpointRequestSchema,
	quoteExactInputSingleEndpointResponseSchema,
} from './schema/endpoint/quote_exact_input_single';
import {
	quoteExactOutputEndpointRequestSchema,
	quoteExactOutputEndpointResponseSchema,
} from './schema/endpoint/quote_exact_output';
import {
	quoteExactOutputSingleEndpointRequestSchema,
	quoteExactOutputSingleEndpointResponseSchema,
} from './schema/endpoint/quote_exact_output_single';
import { ObservationStore } from './stores/observation';
import { PoolStore } from './stores/pool';
import { PositionInfoStore } from './stores/position_info';
import { PositionManagerStore } from './stores/position_manager';
import { TickBitmapStore } from './stores/tick_bitmap';
import { TickInfoStore } from './stores/tick_info';
import { TokenSymbolStore } from './stores/token_symbol';
import { DexModuleConfig } from './types';
import { verifyMinimumFee, verifySwapByTransfer, executeSwapByTransfer } from './hooks';
import { defaultConfig } from './constants';
import {
	getMetadataEndpointRequestSchema,
	getMetadataEndpointResponseSchema,
} from './schema/endpoint/get_metadata';
import { verifyFeeConversion } from './hooks/verifyFeeConversion';
import { executeFeeConversion } from './hooks/executeFeeConversion';
import { TreasurifyEvent } from './events/treasurify';
import {
	getPoolAddressFromCollectionIdEndpointRequestSchema,
	getPoolAddressFromCollectionIdEndpointResponseSchema,
} from './schema/endpoint/get_pool_address_from_collection_id';
import {
	quotePriceEndpointRequestSchema,
	quotePriceEndpointResponseSchema,
} from './schema/endpoint/quote_price';
import { TokenRegisteredEvent } from './events/token_registered';
import { SupportedTokenStore } from './stores/supported_token';
import { verifyValidTransfer } from './hooks/verifyValidTransfer';
import { DexInteroperableMethod } from './cc_method';

export class DexModule extends BaseInteroperableModule {
	public _config: DexModuleConfig | undefined;
	public _feeMethod: FeeMethod | undefined;
	public _tokenMethod: TokenMethod | undefined;
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
	];

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(PoolStore, new PoolStore(this.name, 0, this.stores, this.events));
		this.stores.register(
			PositionManagerStore,
			new PositionManagerStore(this.name, 1, this.stores, this.events),
		);

		this.stores.register(ObservationStore, new ObservationStore(this.name, 2));
		this.stores.register(PositionInfoStore, new PositionInfoStore(this.name, 3));
		this.stores.register(TickBitmapStore, new TickBitmapStore(this.name, 4));
		this.stores.register(TickInfoStore, new TickInfoStore(this.name, 5));
		this.stores.register(TokenSymbolStore, new TokenSymbolStore(this.name, 6, this.events));
		this.stores.register(SupportedTokenStore, new SupportedTokenStore(this.name, 7));

		this.events.register(BurnEvent, new BurnEvent(this.name));
		this.events.register(CollectPositionEvent, new CollectPositionEvent(this.name));
		this.events.register(CollectProtocolEvent, new CollectProtocolEvent(this.name));
		this.events.register(CollectEvent, new CollectEvent(this.name));
		this.events.register(DecreaseLiquidityEvent, new DecreaseLiquidityEvent(this.name));
		this.events.register(FlashEvent, new FlashEvent(this.name));
		this.events.register(IncreaseLiquidityEvent, new IncreaseLiquidityEvent(this.name));
		this.events.register(
			IncreaseObservationCardinalityNextEvent,
			new IncreaseObservationCardinalityNextEvent(this.name),
		);
		this.events.register(MintEvent, new MintEvent(this.name));
		this.events.register(PoolCreatedEvent, new PoolCreatedEvent(this.name));
		this.events.register(PoolInitializedEvent, new PoolInitializedEvent(this.name));
		this.events.register(SwapEvent, new SwapEvent(this.name));
		this.events.register(TokenURICreatedEvent, new TokenURICreatedEvent(this.name));
		this.events.register(TokenURIDestroyedEvent, new TokenURIDestroyedEvent(this.name));
		this.events.register(TreasurifyEvent, new TreasurifyEvent(this.name));
		this.events.register(TokenRegisteredEvent, new TokenRegisteredEvent(this.name));
	}

	public addDependencies(
		tokenMethod: TokenMethod,
		nftMethod: NFTMethod,
		feeMethod: FeeMethod,
		interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod,
	) {
		const poolStore = this.stores.get(PoolStore);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const supportManagerStore = this.stores.get(SupportedTokenStore);

		poolStore.addDependencies(tokenMethod);
		positionManagerStore.addDependencies(tokenMethod, nftMethod);
		supportManagerStore.addDependencies(tokenMethod);

		this._feeMethod = feeMethod;
		this._tokenMethod = tokenMethod;
		this._dexInteroperableMethod.addDependencies(interoperabilityMethod, tokenMethod, nftMethod);
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
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
	public async init(_args: ModuleInitArgs): Promise<void> {
		this._config = { ...defaultConfig, ..._args.moduleConfig };
		const poolStore = this.stores.get(PoolStore);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const supportedTokenStore = this.stores.get(SupportedTokenStore);

		poolStore.init(this._config);
		positionManagerStore.init(Buffer.from(_args.genesisConfig.chainID, 'hex'));
		supportedTokenStore.init(this._config);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyTransaction(_context: TransactionVerifyContext): Promise<VerificationResult> {
		try {
			await verifyMinimumFee(_context, this._config!);
			await verifyValidTransfer.bind(this)(_context);
			await verifySwapByTransfer.bind(this)(_context);
			await verifyFeeConversion.bind(this)(_context);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async beforeCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await verifyMinimumFee(_context, this._config!);
		await verifyValidTransfer.bind(this)(_context);
		await verifySwapByTransfer.bind(this)(_context);
		await executeFeeConversion.bind(this)(_context);
	}

	public async afterCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await executeSwapByTransfer.bind(this)(_context);
	}

	public async beforeTransactionsExecute(context: BlockExecuteContext): Promise<void> {
		await this.stores.get(SupportedTokenStore).apply(context);
	}
}
