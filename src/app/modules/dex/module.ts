/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { codec, Modules, StateMachine, validator } from 'klayr-sdk';
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
	dexGenesisStoreSchema,
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
import { DexGenesisStore, DexModuleDependencies, FeeMethod, TokenMethod } from './types';

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
			assets: [
				{
					version: 0,
					data: dexGenesisStoreSchema,
				},
			],
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

	public async initGenesisState(context: StateMachine.GenesisBlockExecuteContext): Promise<void> {
		const assetBytes = context.assets.getAsset(this.name);
		// if there is no asset, do not initialize
		if (!assetBytes) return;

		const genesisStore = codec.decode<DexGenesisStore>(dexGenesisStoreSchema, assetBytes);
		validator.validator.validate(dexGenesisStoreSchema, genesisStore);

		const observationStore = this.stores.get(ObservationStore);

		// create copied object to verify sorting
		const copiedObservationStore = [...genesisStore.observationSubstore];
		copiedObservationStore.sort((a, b) => {
			// First, sort by poolAddress
			if (!a.poolAddress.equals(b.poolAddress)) return a.poolAddress.compare(b.poolAddress);

			// If poolAddress is the same, sort by index (convert to number to ensure correct numerical sorting)
			return parseInt(a.index, 10) - parseInt(b.index, 10);
		});

		for (let i = 0; i < genesisStore.observationSubstore.length; i += 1) {
			const observationData = genesisStore.observationSubstore[i];

			// Validate sorting of observationSubstore
			if (!observationData.poolAddress.equals(copiedObservationStore[i].poolAddress) || observationData.index !== copiedObservationStore[i].index) {
				throw new Error('observationSubstore must be sorted by poolAddress and index.');
			}

			// set state
			await observationStore.set(context, observationStore.getKey(observationData.poolAddress, observationData.index), observationData);
		}

		const poolStore = this.stores.get(PoolStore);

		// create copies object to verify sorting
		const copiedPoolStore = [...genesisStore.poolSubstore];
		copiedPoolStore.sort((a, b) => {
			// First, sort by token0
			if (!a.token0.equals(b.token0)) return a.token0.compare(b.token0);

			// If token0 is the same, sort by token1
			if (!a.token1.equals(b.token1)) return a.token1.compare(b.token1);

			// If both token0 and token1 are the same, sort by fee (convert to number if necessary)
			return parseInt(a.fee, 10) - parseInt(b.fee, 10);
		});

		for (let i = 0; i < genesisStore.poolSubstore.length; i += 1) {
			const poolData = genesisStore.poolSubstore[i];

			// Validate sorting of poolSubstore
			if (!poolData.token0.equals(copiedPoolStore[i].token0) || !poolData.token1.equals(copiedPoolStore[i].token1) || poolData.fee !== copiedPoolStore[i].fee) {
				throw new Error('poolSubstore must be sorted by token0, token1, and fee');
			}

			// set state
			const poolAddress = poolStore.getKey(poolData.token0, poolData.token1, poolData.fee);
			await poolStore.set(context, poolAddress, poolData);
		}

		const positionInfoStore = this.stores.get(PositionInfoStore);

		// create copied object to verify sorting
		const copiedPositionInfoSubstore = [...genesisStore.positionInfoSubstore];
		copiedPositionInfoSubstore.sort((a, b) => {
			// First, sort by poolAddress
			if (!a.poolAddress.equals(b.poolAddress)) return a.poolAddress.compare(b.poolAddress);

			// If both poolAddress are the same, sort by key
			if (!a.key.equals(b.key)) return a.key.compare(b.key);

			// default
			return 0;
		});

		for (let i = 0; i < genesisStore.positionInfoSubstore.length; i += 1) {
			const positionInfoData = genesisStore.positionInfoSubstore[i];

			// Validate sorting of positionInfoSubstore
			if (!positionInfoData.poolAddress.equals(copiedPositionInfoSubstore[i].poolAddress) || !positionInfoData.key.equals(copiedPositionInfoSubstore[i].key)) {
				throw new Error('positionInfoSubstore must be sorted by poolAddress and key.');
			}

			// set state
			await positionInfoStore.set(context, positionInfoStore.getKey(positionInfoData.poolAddress, positionInfoData.key), positionInfoData);
		}

		const positionManagerStore = this.stores.get(PositionManagerStore);

		// create copied object to verify sorting
		const copiedPositionManagerSubstore = [...genesisStore.positionManagerSubstore];
		copiedPositionManagerSubstore.sort((a, b) => a.poolAddress.compare(b.poolAddress));

		for (let i = 0; i < genesisStore.positionManagerSubstore.length; i += 1) {
			const positionManagerData = genesisStore.positionManagerSubstore[i];

			// validate sorting of positionManagerSubstore
			if (!positionManagerData.poolAddress.equals(copiedPositionManagerSubstore[i].poolAddress)) {
				throw new Error('positionManagerSubstore must be sorted by poolAddress.');
			}

			// set state
			await positionManagerStore.set(context, positionManagerStore.getKey(positionManagerData.poolAddress), positionManagerData);
		}

		const supportedTokenStore = this.stores.get(SupportedTokenStore);

		// verify supportedTokenSubstore
		const { supportedTokenSubstore } = genesisStore;
		if (supportedTokenSubstore.length > 0 && supportedTokenSubstore.length !== 1) {
			throw new Error('supportedTokenSubstore must have one element, if specified');
		}

		if (supportedTokenSubstore.length === 1) {
			const supportedTokenData = supportedTokenSubstore[0];
			const copiedSupportedTokenList = [...supportedTokenData.supported];
			copiedSupportedTokenList.sort((a, b) => a.compare(b));

			for (let i = 0; i < supportedTokenData.supported.length; i += 1) {
				if (!supportedTokenData.supported[i].equals(copiedSupportedTokenList[i])) {
					throw new Error('supportedTokenSubstore.supported must be sorted');
				}
			}
			await supportedTokenStore.set(context, Buffer.alloc(0), supportedTokenData);
		}

		const tickBitmapStore = this.stores.get(TickBitmapStore);

		// create copied object to verify sorting
		const copiedTickBitmapSubstore = [...genesisStore.tickBitmapSubstore];
		copiedTickBitmapSubstore.sort((a, b) => {
			// First, sort by poolAddress
			if (!a.poolAddress.equals(b.poolAddress)) {
				return a.poolAddress.compare(b.poolAddress);
			}

			// If poolAddress is the same, sort by index (convert to number to ensure correct numerical sorting)
			return parseInt(a.index, 10) - parseInt(b.index, 10);
		});

		for (let i = 0; i < genesisStore.tickBitmapSubstore.length; i += 1) {
			const tickBitmapData = genesisStore.tickBitmapSubstore[i];

			// validate sorting of tickBitmapSubstore
			if (!tickBitmapData.poolAddress.equals(copiedTickBitmapSubstore[i].poolAddress) || tickBitmapData.index !== copiedTickBitmapSubstore[i].index) {
				throw new Error('tickBitmapSubstore must be sorted by poolAddress and index.');
			}

			// set state
			await tickBitmapStore.set(context, tickBitmapStore.getKey(tickBitmapData.poolAddress, tickBitmapData.index), tickBitmapData);
		}

		const tickInfoStore = this.stores.get(TickInfoStore);

		// create copied object to verify sorting
		const copiedTickInfoSubstore = [...genesisStore.tickInfoSubstore];
		copiedTickInfoSubstore.sort((a, b) => {
			// First, sort by poolAddress
			if (!a.poolAddress.equals(b.poolAddress)) {
				return a.poolAddress.compare(b.poolAddress);
			}

			// If poolAddress is the same, sort by tick (convert to number to ensure correct numerical sorting)
			return parseInt(a.tick, 10) - parseInt(b.tick, 10);
		});

		for (let i = 0; i < genesisStore.tickInfoSubstore.length; i += 1) {
			const tickInfoData = genesisStore.tickInfoSubstore[i];

			// validate sorting of tickInfoSubstore
			if (!tickInfoData.poolAddress.equals(copiedTickInfoSubstore[i].poolAddress) || tickInfoData.tick !== copiedTickInfoSubstore[i].tick) {
				throw new Error('tickInfoSubstore must be sorted by poolAddress and tick.');
			}

			// set state
			await tickInfoStore.set(context, tickInfoStore.getKey(tickInfoData.poolAddress, tickInfoData.tick), tickInfoData);
		}

		const tokenSymbolStore = this.stores.get(TokenSymbolStore);

		// create copied object to verify sorting
		const copiedTokenSymbolSubstore = [...genesisStore.tokenSymbolSubstore];
		copiedTokenSymbolSubstore.sort((a, b) => a.tokenId.compare(b.tokenId));

		for (let i = 0; i < genesisStore.tokenSymbolSubstore.length; i += 1) {
			const tokenSymbolData = genesisStore.tokenSymbolSubstore[i];

			// validate sorting of tokenSymbolSubstore
			if (!tokenSymbolData.tokenId.equals(copiedTokenSymbolSubstore[i].tokenId)) {
				throw new Error('tokenSymbolSubstore must be sorted by tokenId.');
			}

			// set state
			await tokenSymbolStore.set(context, tokenSymbolStore.getKey(tokenSymbolData.tokenId), tokenSymbolData);
		}
	}
}
