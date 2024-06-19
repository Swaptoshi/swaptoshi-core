import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { endpointSwapContext } from './stores/context';
import { Quoter } from './stores/library/lens';
import {
	verifyQuoteExactInputParam,
	verifyQuoteExactOutputParam,
	verifyQuoteExactInputSingleParam,
	verifyQuoteExactOutputSingleParam,
	verifyGetPoolParam,
	verifyGetPositionParam,
	verifyGetTokenURIParam,
	serializer,
	verifyGetPoolAddressFromCollectionIdParam,
	verifyObserveParam,
	verifyGetMetadataParam,
	verifyPriceParam,
} from './utils';
import {
	DexModuleConfig,
	GetMetadataParams,
	GetPoolParams,
	GetPositionParams,
	GetTokenURIParams,
	ObserveParams,
	QuoteExactInputParams,
	QuoteExactInputSingleParams,
	QuoteExactOutputParams,
	QuoteExactOutputSingleParams,
	QuotePriceParams,
	GetPoolAddressFromCollectionIdParams,
} from './types';
import { PoolStore } from './stores/pool';
import { PositionManagerStore } from './stores/position_manager';
import { PoolAddress } from './stores/library/periphery';

export class DexEndpoint extends BaseEndpoint {
	public init(config: DexModuleConfig) {
		this._config = config;
	}

	public getConfig(_context: ModuleEndpointContext) {
		if (!this._config) throw new Error('config not initialized');
		return serializer(this._config);
	}

	public async quoteExactInput(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactInputParams;
		verifyQuoteExactInputParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactInput(Buffer.from(param.path, 'hex'), param.amountIn));
	}

	public async quoteExactInputSingle(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactInputSingleParams;
		verifyQuoteExactInputSingleParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactInputSingle(param));
	}

	public async quoteExactOutput(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactOutputParams;
		verifyQuoteExactOutputParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactOutput(Buffer.from(param.path, 'hex'), param.amountOut));
	}

	public async quoteExactOutputSingle(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactOutputSingleParams;
		verifyQuoteExactOutputSingleParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactOutputSingle(param));
	}

	public async quotePrice(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuotePriceParams;
		verifyPriceParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quotePrice(Buffer.from(param.path, 'hex')));
	}

	public async getPoolAddressFromCollectionId(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPoolAddressFromCollectionIdParams;
		verifyGetPoolAddressFromCollectionIdParam(param);

		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.get(context, Buffer.from(param.collectionId, 'hex'));

		return { poolAddress: positionManager.poolAddress.toString('hex') };
	}

	public async getPool(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPoolParams;
		verifyGetPoolParam(param);

		const _context = endpointSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const pool = await poolStore.getImmutablePool(_context, Buffer.from(param.tokenA, 'hex'), Buffer.from(param.tokenB, 'hex'), param.fee);
		return serializer({
			...pool.toJSON(),
			klayr32: pool.klayr32,
			address: pool.address,
			collectionId: pool.collectionId,
		} as unknown as Record<string, unknown>);
	}

	public async getPosition(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPositionParams;
		verifyGetPositionParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, Buffer.from(param.poolAddress, 'hex'));
		const poolStore = this.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(param.poolAddress, 'hex'));
		const pool = await poolStore.getImmutablePool(_context, token0, token1, fee);
		const position = await positionManager.getPositions(param.tokenId);
		const [principal0, principal1] = await positionManager.principal(param.tokenId, pool.slot0.sqrtPriceX96);
		const [fees0, fees1] = await positionManager.fees(param.tokenId);
		return serializer({
			...position,
			value: {
				principal0,
				principal1,
				fees0,
				fees1,
			},
		} as unknown as Record<string, unknown>);
	}

	public async getTokenURI(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetTokenURIParams;
		verifyGetTokenURIParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, Buffer.from(param.poolAddress, 'hex'));
		return serializer({ tokenURI: await positionManager.tokenURI(param.tokenId) });
	}

	public async getMetadata(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetMetadataParams;
		verifyGetMetadataParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, Buffer.from(param.poolAddress, 'hex'));
		return serializer(await positionManager.getMetadata(param.tokenId));
	}

	public async observe(context: ModuleEndpointContext) {
		const param = context.params as unknown as ObserveParams;
		verifyObserveParam(param);

		const _context = endpointSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const key = PoolAddress.decodePoolAddress(Buffer.from(param.poolAddress, 'hex'));
		const pool = await poolStore.getImmutablePool(_context, key.token0, key.token1, key.fee);
		return serializer(await pool.observe(param.secondsAgos));
	}

	public _config: DexModuleConfig | undefined;
}
