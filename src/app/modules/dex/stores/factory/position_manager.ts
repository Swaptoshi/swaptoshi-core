/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MethodContext, NFTMethod, NamedRegistry, TokenMethod, codec, utils } from 'lisk-sdk';
import * as IPFSHash from 'ipfs-only-hash';
import {
	Uint24String,
	Int24String,
	Uint256String,
	Uint128String,
	Uint256,
	Uint160String,
	Uint128,
	Uint64String,
	Int24,
} from '../library/int';
import { PositionInfoStore } from '../position_info';
import {
	DexNFTAttribute,
	ImmutableSwapContext,
	MutableSwapContext,
	NFTMetadata,
	PositionManager,
	TokenURINFTAttribute,
	CollectParams,
	DecreaseLiquidityParams,
	IncreaseLiquidityParams,
	MintParams,
} from '../../types';
import { PoolStore } from '../pool';
import { SwaptoshiPool } from './pool';
import { dexNFTAttributeSchema } from '../../schema/nft_attribute/dex_nft_attribute';
import { tokenUriNFTAttributeSchema } from '../../schema/nft_attribute/tokenuri_nft_attribute';

import * as PositionKey from '../library/periphery/position_key';
import * as PoolAddress from '../library/periphery/pool_address';
import * as TickMath from '../library/core/tick_math';
import * as LiquidityAmounts from '../library/periphery/liquidity_amounts';
import * as FullMath from '../library/core/full_math';
import * as FixedPoint128 from '../library/core/fixed_point_128';
import * as NFTDescriptor from '../library/periphery/nft_descriptor';
import { TokenSymbolStore } from '../token_symbol';
import { CollectPositionEvent } from '../../events/collect_position';
import { DecreaseLiquidityEvent } from '../../events/decrease_liquidity';
import { IncreaseLiquidityEvent } from '../../events/increase_liquidity';
import { TokenURICreatedEvent } from '../../events/tokenuri_created';
import { DEX_ATTRIBUTE, POSITION_MANAGER_ADDRESS, TOKENURI_ATTTRIBUTE } from '../../constants';
import { TokenURIDestroyedEvent } from '../../events/tokenuri_destroyed';

interface AddLiquidityParams {
	token0: Buffer;
	token1: Buffer;
	fee: Uint24String;
	recipient: Buffer;
	tickLower: Int24String;
	tickUpper: Int24String;
	amount0Desired: Uint256String;
	amount1Desired: Uint256String;
	amount0Min: Uint256String;
	amount1Min: Uint256String;
}

interface MintCallbackData {
	poolKey: {
		token0: string;
		token1: string;
		fee: Uint24String;
	};
	payer: string;
}

interface FeeParams {
	token0: Buffer;
	token1: Buffer;
	fee: Uint24String;
	tickLower: Int24String;
	tickUpper: Int24String;
	liquidity: Uint128String;
	positionFeeGrowthInside0LastX128: Uint256String;
	positionFeeGrowthInside1LastX128: Uint256String;
	tokensOwed0: Uint256String;
	tokensOwed1: Uint256String;
}

export class NonfungiblePositionManager {
	public constructor(
		positionManager: PositionManager,
		stores: NamedRegistry,
		events: NamedRegistry,
		chainId: Buffer,
	) {
		Object.assign(this, utils.objects.cloneDeep(positionManager));
		this.collectionId = PoolAddress.computePoolId(positionManager.poolAddress);
		this.events = events;
		this.chainId = chainId;
		this.poolStore = stores.get(PoolStore);
		this.tokenSymbolStore = stores.get(TokenSymbolStore);
		this.positionInfoStore = stores.get(PositionInfoStore);
	}

	public toJSON(): PositionManager {
		return utils.objects.cloneDeep({
			poolAddress: this.poolAddress,
			name: this.name,
			symbol: this.symbol,
		}) as PositionManager;
	}

	public addMutableDependencies(
		context: MutableSwapContext,
		tokenMethod: TokenMethod,
		nftMethod: NFTMethod,
	) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}

		this.mutableContext = context;
		this.immutableContext = this.mutableContext;
		this.tokenMethod = tokenMethod;
		this.nftMethod = nftMethod;
		this.immutableDependencyReady = true;
		this.mutableDependencyReady = true;
	}

	public addImmutableDependencies(
		context: ImmutableSwapContext,
		tokenMethod: TokenMethod,
		nftMethod: NFTMethod,
	) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}

		this.immutableContext = context;
		this.tokenMethod = tokenMethod;
		this.nftMethod = nftMethod;
		this.immutableDependencyReady = true;
	}

	public setSender(senderAddress: Buffer) {
		if (this.mutableContext) {
			this.mutableContext.senderAddress = senderAddress;
		} else if (this.immutableContext) {
			this.immutableContext.senderAddress = senderAddress;
		}
	}

	public async createAndInitializePoolIfNecessary(
		token0: Buffer,
		token0Symbol: string,
		token0Decimal: number,
		token1: Buffer,
		token1Symbol: string,
		token1Decimal: number,
		fee: Uint24String,
		sqrtPriceX96: Uint160String,
	): Promise<SwaptoshiPool> {
		this._checkMutableDependency();
		if (token0.compare(token1) >= 0) throw new Error('invalid token order');
		let pool: SwaptoshiPool | undefined;

		try {
			pool = await this.poolStore!.getMutablePool(this.mutableContext!, token0, token1, fee);
			const { sqrtPriceX96: sqrtPriceX96Existing } = pool.slot0;
			if (sqrtPriceX96Existing === '0') await pool.initialize(sqrtPriceX96);
		} catch {
			pool = await this.poolStore!.createPool(
				this.mutableContext!,
				token0,
				token0Symbol,
				token0Decimal,
				token1,
				token1Symbol,
				token1Decimal,
				fee,
			);
			await pool.initialize(sqrtPriceX96);
		}

		this.poolAddress = pool.address;
		this.collectionId = PoolAddress.computePoolId(pool.address);

		return pool;
	}

	public async getPositions(tokenId: Uint64String): Promise<DexNFTAttribute> {
		this._checkImmutableDependency();
		const nft = await this.nftMethod!.getNFT(
			this.immutableContext!.context as MethodContext,
			PositionKey.getNFTId(this.chainId, this.collectionId, tokenId),
		);
		const dexAttribute = nft.attributesArray.find(t => t.module === DEX_ATTRIBUTE);
		if (!dexAttribute)
			throw new Error(
				`attributes '${DEX_ATTRIBUTE}' doesnt exist on nft ${PositionKey.getNFTId(
					this.chainId,
					this.collectionId,
					tokenId,
				).toString('hex')}`,
			);
		const positionBuf = dexAttribute.attributes;
		return codec.decode<DexNFTAttribute>(dexNFTAttributeSchema, positionBuf);
	}

	public async mint(
		params: MintParams,
	): Promise<[tokenId: string, liquidity: string, amount0: string, amount1: string]> {
		this._checkMutableDependency();
		this._checkDeadline(params.deadline);

		let liquidity = Uint128.from(0);
		let amount0 = Uint256.from(0);
		let amount1 = Uint256.from(0);

		const [_liquidity, _amount0, _amount1] = await this._addLiquidity({
			token0: params.token0,
			token1: params.token1,
			fee: params.fee,
			recipient: this.address,
			tickLower: params.tickLower,
			tickUpper: params.tickUpper,
			amount0Desired: params.amount0Desired,
			amount1Desired: params.amount1Desired,
			amount0Min: params.amount0Min,
			amount1Min: params.amount1Min,
		});

		liquidity = Uint128.from(_liquidity);
		amount0 = Uint256.from(_amount0);
		amount1 = Uint256.from(_amount1);

		const positionKey = PositionKey.compute(this.address, params.tickLower, params.tickUpper);
		const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } =
			await this.positionInfoStore!.get(
				this.mutableContext!.context,
				this.positionInfoStore!.getKey(this.poolAddress, positionKey),
			);

		const position: DexNFTAttribute = {
			token0: params.token0,
			token1: params.token1,
			fee: params.fee,
			tickLower: params.tickLower,
			tickUpper: params.tickUpper,
			liquidity: liquidity.toString(),
			feeGrowthInside0LastX128,
			feeGrowthInside1LastX128,
			tokensOwed0: '0',
			tokensOwed1: '0',
		};

		const tokenId = await this.nftMethod!.getNextAvailableIndex(
			this.mutableContext!.context,
			this.collectionId,
		);
		await this.nftMethod!.create(
			this.mutableContext!.context,
			params.recipient,
			this.collectionId,
			[
				{
					module: DEX_ATTRIBUTE,
					attributes: codec.encode(dexNFTAttributeSchema, position),
				},
			],
		);
		const { tokenURI } = await this._saveTokenURI(tokenId.toString());

		const events = this.events!.get(IncreaseLiquidityEvent);
		events.add(
			this.mutableContext!.context,
			{
				tokenId: PositionKey.getNFTId(this.chainId, this.collectionId, tokenId.toString()),
				ownerAddress: params.recipient,
				liquidity: liquidity.toString(),
				amount0: amount0.toString(),
				amount1: amount1.toString(),
			},
			[this.poolAddress, this.mutableContext!.senderAddress],
		);

		const tokenUriEvent = this.events!.get(TokenURICreatedEvent);
		tokenUriEvent.add(
			this.mutableContext!.context,
			{
				tokenURI,
				tokenId: PositionKey.getNFTId(this.chainId, this.collectionId, tokenId.toString()),
			},
			[this.mutableContext!.senderAddress],
		);

		return [tokenId.toString(), liquidity.toString(), amount0.toString(), amount1.toString()];
	}

	public async increaseLiquidity(
		params: IncreaseLiquidityParams,
	): Promise<[liquidity: string, amount0: string, amount1: string]> {
		this._checkMutableDependency();
		this._checkDeadline(params.deadline);
		const position = await this.getPositions(params.tokenId);

		let liquidity = Uint128.from(0);
		let amount0 = Uint256.from(0);
		let amount1 = Uint256.from(0);

		const [_liquidity, _amount0, _amount1] = await this._addLiquidity({
			token0: position.token0,
			token1: position.token1,
			fee: position.fee,
			tickLower: position.tickLower,
			tickUpper: position.tickUpper,
			amount0Desired: params.amount0Desired,
			amount1Desired: params.amount1Desired,
			amount0Min: params.amount0Min,
			amount1Min: params.amount1Min,
			recipient: this.address,
		});
		liquidity = Uint128.from(_liquidity);
		amount0 = Uint256.from(_amount0);
		amount1 = Uint256.from(_amount1);

		const positionKey = PositionKey.compute(this.address, position.tickLower, position.tickUpper);
		const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } =
			await this.positionInfoStore!.get(
				this.mutableContext!.context,
				this.positionInfoStore!.getKey(this.poolAddress, positionKey),
			);

		position.tokensOwed0 = Uint128.from(position.tokensOwed0)
			.add(
				FullMath.mulDiv(
					Uint256.from(feeGrowthInside0LastX128).sub(position.feeGrowthInside0LastX128).toString(),
					position.liquidity,
					FixedPoint128.Q128,
				),
			)
			.toString();

		position.tokensOwed1 = Uint128.from(position.tokensOwed1)
			.add(
				FullMath.mulDiv(
					Uint256.from(feeGrowthInside1LastX128).sub(position.feeGrowthInside1LastX128).toString(),
					position.liquidity,
					FixedPoint128.Q128,
				),
			)
			.toString();

		position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
		position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
		position.liquidity = Uint128.from(position.liquidity).add(liquidity).toString();

		await this._savePosition(params.tokenId, position);

		const nft = await this.nftMethod!.getNFT(
			this.mutableContext!.context,
			PositionKey.getNFTId(this.chainId, this.collectionId, params.tokenId),
		);
		const events = this.events!.get(IncreaseLiquidityEvent);
		events.add(
			this.mutableContext!.context,
			{
				tokenId: PositionKey.getNFTId(this.chainId, this.collectionId, params.tokenId),
				ownerAddress: nft.owner,
				liquidity: liquidity.toString(),
				amount0: amount0.toString(),
				amount1: amount1.toString(),
			},
			[this.poolAddress, this.mutableContext!.senderAddress],
		);

		return [liquidity.toString(), amount0.toString(), amount1.toString()];
	}

	public async decreaseLiquidity(
		params: DecreaseLiquidityParams,
	): Promise<[amount0: string, amount1: string]> {
		this._checkMutableDependency();
		await this._isAuthorizedForToken(this.mutableContext!.senderAddress, params.tokenId);
		this._checkDeadline(params.deadline);

		let amount0 = Uint256.from(0);
		let amount1 = Uint256.from(0);

		if (Uint128.from(params.liquidity).lte(0)) throw new Error('params.liquidity cant be negative');
		const position = await this.getPositions(params.tokenId);

		const positionLiquidity = position.liquidity;
		if (Uint128.from(positionLiquidity).lt(params.liquidity))
			throw new Error('invalid params.liquidity');

		const originalSender = this.mutableContext!.senderAddress;
		const pool = await this.poolStore!.getMutablePool(
			this.mutableContext!,
			position.token0,
			position.token1,
			position.fee,
		);
		pool.setSender(this.address);

		const [_amount0, _amount1] = await pool.burn(
			position.tickLower,
			position.tickUpper,
			params.liquidity,
		);
		amount0 = Uint256.from(_amount0);
		amount1 = Uint256.from(_amount1);

		if (amount0.lt(params.amount0Min) || amount1.lt(params.amount1Min))
			throw new Error('Price slippage check');

		const positionKey = PositionKey.compute(this.address, position.tickLower, position.tickUpper);
		const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } =
			await this.positionInfoStore!.get(
				this.mutableContext!.context,
				this.positionInfoStore!.getKey(this.poolAddress, positionKey),
			);

		position.tokensOwed0 = Uint128.from(position.tokensOwed0)
			.add(amount0)
			.add(
				FullMath.mulDiv(
					Uint256.from(feeGrowthInside0LastX128).sub(position.feeGrowthInside0LastX128).toString(),
					positionLiquidity,
					FixedPoint128.Q128,
				),
			)
			.toString();

		position.tokensOwed1 = Uint128.from(position.tokensOwed1)
			.add(amount1)
			.add(
				FullMath.mulDiv(
					Uint256.from(feeGrowthInside1LastX128).sub(position.feeGrowthInside1LastX128).toString(),
					positionLiquidity,
					FixedPoint128.Q128,
				),
			)
			.toString();

		position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
		position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
		position.liquidity = Uint128.from(positionLiquidity).sub(params.liquidity).toString();

		await this._savePosition(params.tokenId, position);

		const events = this.events!.get(DecreaseLiquidityEvent);
		events.add(
			this.mutableContext!.context,
			{
				tokenId: PositionKey.getNFTId(this.chainId, this.collectionId, params.tokenId),
				liquidity: params.liquidity,
				amount0: amount0.toString(),
				amount1: amount1.toString(),
			},
			[this.poolAddress, this.mutableContext!.senderAddress],
		);

		pool.setSender(originalSender);
		return [amount0.toString(), amount1.toString()];
	}

	public async collect(params: CollectParams): Promise<[amount0: string, amount1: string]> {
		this._checkMutableDependency();
		await this._isAuthorizedForToken(this.mutableContext!.senderAddress, params.tokenId);
		if (Uint128.from(params.amount0Max).lte(0) && Uint128.from(params.amount1Max).lte(0))
			throw new Error('invalid params amount max');
		const recipient =
			params.recipient.compare(Buffer.alloc(0)) === 0 ? this.address : params.recipient;
		const position = await this.getPositions(params.tokenId);
		let { tokensOwed0, tokensOwed1 } = position;

		const originalSender = this.mutableContext!.senderAddress;
		const pool = await this.poolStore!.getMutablePool(
			this.mutableContext!,
			position.token0,
			position.token1,
			position.fee,
		);
		pool.setSender(this.address);

		if (Uint128.from(position.liquidity).gt(0)) {
			await pool.burn(position.tickLower, position.tickUpper, '0');
			const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } =
				await this.positionInfoStore!.get(
					this.mutableContext!.context,
					this.positionInfoStore!.getKey(
						this.poolAddress,
						PositionKey.compute(this.address, position.tickLower, position.tickUpper),
					),
				);

			tokensOwed0 = Uint128.from(tokensOwed0)
				.add(
					FullMath.mulDiv(
						Uint256.from(feeGrowthInside0LastX128)
							.sub(position.feeGrowthInside0LastX128)
							.toString(),
						position.liquidity,
						FixedPoint128.Q128,
					),
				)
				.toString();

			tokensOwed1 = Uint128.from(tokensOwed1)
				.add(
					FullMath.mulDiv(
						Uint256.from(feeGrowthInside1LastX128)
							.sub(position.feeGrowthInside1LastX128)
							.toString(),
						position.liquidity,
						FixedPoint128.Q128,
					),
				)
				.toString();

			position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
			position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
		}

		const amount0Collect = Uint128.from(params.amount0Max).gt(tokensOwed0)
			? tokensOwed0
			: params.amount0Max;
		const amount1Collect = Uint128.from(params.amount1Max).gt(tokensOwed1)
			? tokensOwed1
			: params.amount1Max;

		const [amount0, amount1] = await pool.collect(
			recipient,
			position.tickLower,
			position.tickUpper,
			amount0Collect,
			amount1Collect,
		);

		position.tokensOwed0 = Uint128.from(tokensOwed0).sub(amount0Collect).toString();
		position.tokensOwed1 = Uint128.from(tokensOwed1).sub(amount1Collect).toString();

		await this._savePosition(params.tokenId, position);

		const events = this.events!.get(CollectPositionEvent);
		events.add(
			this.mutableContext!.context,
			{
				tokenId: PositionKey.getNFTId(this.chainId, this.collectionId, params.tokenId),
				recipientAddress: recipient,
				amount0Collect,
				amount1Collect,
			},
			[this.poolAddress, recipient],
		);

		pool.setSender(originalSender);
		return [amount0, amount1];
	}

	public async burn(tokenId: Uint64String) {
		this._checkMutableDependency();
		await this._isAuthorizedForToken(this.mutableContext!.senderAddress, tokenId);
		const position = await this.getPositions(tokenId);
		if (
			!Uint128.from(position.liquidity).eq(0) ||
			!Uint128.from(position.tokensOwed0).eq(0) ||
			!Uint128.from(position.tokensOwed1).eq(0)
		)
			throw new Error('Not cleared');
		const tokenURI = await this.tokenURI(tokenId);
		const nftId = PositionKey.getNFTId(this.chainId, this.collectionId, tokenId);

		const nft = await this.nftMethod!.getNFT(this.mutableContext!.context, nftId);
		await this.nftMethod!.destroy(this.mutableContext!.context, nft.owner, nftId);

		const events = this.events!.get(TokenURIDestroyedEvent);
		events.add(this.mutableContext!.context, { tokenURI, tokenId: nftId }, [
			this.poolAddress,
			this.mutableContext!.senderAddress,
		]);
	}

	public async tokenURI(tokenId: Uint64String): Promise<string> {
		this._checkImmutableDependency();
		const nft = await this.nftMethod!.getNFT(
			this.immutableContext!.context as MethodContext,
			PositionKey.getNFTId(this.chainId, this.collectionId, tokenId),
		);
		const tokenUriAttribute = nft.attributesArray.find(t => t.module === TOKENURI_ATTTRIBUTE);
		if (!tokenUriAttribute)
			throw new Error(
				`attributes '${TOKENURI_ATTTRIBUTE}' doesnt exist on nft ${PositionKey.getNFTId(
					this.chainId,
					this.collectionId,
					tokenId,
				).toString('hex')}`,
			);
		return codec.decode<TokenURINFTAttribute>(
			tokenUriNFTAttributeSchema,
			tokenUriAttribute.attributes,
		).tokenURI;
	}

	public async getMetadata(tokenId: Uint64String): Promise<NFTMetadata> {
		this._checkImmutableDependency();
		const { token0, token1, fee, tickLower, tickUpper } = await this.getPositions(tokenId);
		const pool = await this.poolStore!.getImmutablePool(
			this.immutableContext!,
			token0,
			token1,
			fee,
		);
		const baseTokenAddress = token0;
		const quoteTokenAddress = token1;
		const { tick } = pool.slot0;
		const baseToken = await this.tokenSymbolStore!.get(
			this.immutableContext!.context,
			this.tokenSymbolStore!.getKey(baseTokenAddress),
		);
		const quoteToken = await this.tokenSymbolStore!.get(
			this.immutableContext!.context,
			this.tokenSymbolStore!.getKey(quoteTokenAddress),
		);

		const uri = NFTDescriptor.constructTokenURI({
			tokenId,
			quoteTokenAddress,
			baseTokenAddress,
			quoteTokenSymbol: quoteToken.symbol,
			baseTokenSymbol: baseToken.symbol,
			quoteTokenDecimals: quoteToken.decimal.toString(),
			baseTokenDecimals: baseToken.decimal.toString(),
			flipRatio: false,
			tickLower,
			tickUpper,
			tickCurrent: tick,
			tickSpacing: pool.tickSpacing,
			fee,
			poolAddress: pool.address,
		});

		const encodedJSON = uri.substring('data:application/json;base64,'.length);
		const decodedJSON = Buffer.from(encodedJSON, 'base64').toString('utf8');
		return JSON.parse(decodedJSON) as NFTMetadata;
	}

	public async total(
		tokenId: Uint256String,
		sqrtRatioX96: Uint160String,
	): Promise<[amount0: string, amount1: string]> {
		this._checkImmutableDependency();
		const [amount0Principal, amount1Principal] = await this.principal(tokenId, sqrtRatioX96);
		const [amount0Fee, amount1Fee] = await this.fees(tokenId);
		return [
			Uint256.from(amount0Principal).add(amount0Fee).toString(),
			Uint256.from(amount1Principal).add(amount1Fee).toString(),
		];
	}

	public async principal(
		tokenId: Uint256String,
		sqrtRatioX96: Uint160String,
	): Promise<[amount0: string, amount1: string]> {
		this._checkImmutableDependency();
		const { tickLower, tickUpper, liquidity } = await this.getPositions(tokenId);
		return LiquidityAmounts.getAmountsForLiquidity(
			sqrtRatioX96,
			TickMath.getSqrtRatioAtTick(tickLower),
			TickMath.getSqrtRatioAtTick(tickUpper),
			liquidity,
		);
	}

	public async fees(tokenId: Uint256String): Promise<[amount0: string, amount1: string]> {
		this._checkImmutableDependency();
		const {
			token0,
			token1,
			fee,
			tickLower,
			tickUpper,
			liquidity,
			feeGrowthInside0LastX128: positionFeeGrowthInside0LastX128,
			feeGrowthInside1LastX128: positionFeeGrowthInside1LastX128,
			tokensOwed0,
			tokensOwed1,
		} = await this.getPositions(tokenId);

		return this._fees({
			token0,
			token1,
			fee,
			tickLower,
			tickUpper,
			liquidity,
			positionFeeGrowthInside0LastX128,
			positionFeeGrowthInside1LastX128,
			tokensOwed0,
			tokensOwed1,
		});
	}

	private async _fees(feeParams: FeeParams): Promise<[amount0: string, amount1: string]> {
		let amount0 = Uint256.from(0);
		let amount1 = Uint256.from(0);

		const pool = await this.poolStore!.getImmutablePool(
			this.immutableContext!,
			feeParams.token0,
			feeParams.token1,
			feeParams.fee,
		);

		const [poolFeeGrowthInside0LastX128, poolFeeGrowthInside1LastX128] =
			await this._getFeeGrowthInside(pool, feeParams.tickLower, feeParams.tickUpper);

		amount0 = Uint256.from(
			FullMath.mulDiv(
				Uint256.from(poolFeeGrowthInside0LastX128)
					.sub(feeParams.positionFeeGrowthInside0LastX128)
					.toString(),
				feeParams.liquidity,
				FixedPoint128.Q128,
			),
		).add(feeParams.tokensOwed0);

		amount1 = Uint256.from(
			FullMath.mulDiv(
				Uint256.from(poolFeeGrowthInside1LastX128)
					.sub(feeParams.positionFeeGrowthInside1LastX128)
					.toString(),
				feeParams.liquidity,
				FixedPoint128.Q128,
			),
		).add(feeParams.tokensOwed1);

		return [amount0.toString(), amount1.toString()];
	}

	private async _getFeeGrowthInside(
		pool: SwaptoshiPool,
		tickLower: Int24String,
		tickUpper: Int24String,
	): Promise<[feeGrowthInside0X128: string, feeGrowthInside1X128: string]> {
		let feeGrowthInside0X128 = Uint256.from(0);
		let feeGrowthInside1X128 = Uint256.from(0);

		const { tick: tickCurrent } = pool.slot0;
		const {
			feeGrowthOutside0X128: lowerFeeGrowthOutside0X128,
			feeGrowthOutside1X128: lowerFeeGrowthOutside1X128,
		} = await pool.getTick(tickLower);
		const {
			feeGrowthOutside0X128: upperFeeGrowthOutside0X128,
			feeGrowthOutside1X128: upperFeeGrowthOutside1X128,
		} = await pool.getTick(tickUpper);

		if (Int24.from(tickCurrent).lt(tickLower)) {
			feeGrowthInside0X128 = Uint256.from(lowerFeeGrowthOutside0X128).sub(
				upperFeeGrowthOutside0X128,
			);
			feeGrowthInside1X128 = Uint256.from(lowerFeeGrowthOutside1X128).sub(
				upperFeeGrowthOutside1X128,
			);
		} else if (Int24.from(tickCurrent).lt(tickUpper)) {
			const { feeGrowthGlobal0X128 } = pool;
			const { feeGrowthGlobal1X128 } = pool;
			feeGrowthInside0X128 = Uint256.from(feeGrowthGlobal0X128)
				.sub(lowerFeeGrowthOutside0X128)
				.sub(upperFeeGrowthOutside0X128);
			feeGrowthInside1X128 = Uint256.from(feeGrowthGlobal1X128)
				.sub(lowerFeeGrowthOutside1X128)
				.sub(upperFeeGrowthOutside1X128);
		} else {
			feeGrowthInside0X128 = Uint256.from(upperFeeGrowthOutside0X128).sub(
				lowerFeeGrowthOutside0X128,
			);
			feeGrowthInside1X128 = Uint256.from(upperFeeGrowthOutside1X128).sub(
				lowerFeeGrowthOutside1X128,
			);
		}
		return [feeGrowthInside0X128.toString(), feeGrowthInside1X128.toString()];
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _metadataToIPFS(metadata: NFTMetadata): Promise<string> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const cid: string = await IPFSHash.of(Buffer.from(JSON.stringify(metadata, null, 0), 'utf8'), {
			cidVersion: 1,
			rawLeaves: true,
		});
		return `ipfs://${cid}`;
	}

	private async _saveTokenURI(
		tokenId: Uint64String,
	): Promise<{ tokenURI: string; metadata: NFTMetadata }> {
		const metadata = await this.getMetadata(tokenId);
		const tokenURI = await this._metadataToIPFS(metadata);
		const encodedTokenURI = codec.encode(tokenUriNFTAttributeSchema, { tokenURI });
		await this.nftMethod!.setAttributes(
			this.mutableContext!.context,
			TOKENURI_ATTTRIBUTE,
			PositionKey.getNFTId(this.chainId, this.collectionId, tokenId),
			encodedTokenURI,
		);

		return { tokenURI, metadata };
	}

	private async _savePosition(tokenId: Uint64String, position: DexNFTAttribute) {
		const encodedPosition = codec.encode(dexNFTAttributeSchema, position);
		await this.nftMethod!.setAttributes(
			this.mutableContext!.context,
			DEX_ATTRIBUTE,
			PositionKey.getNFTId(this.chainId, this.collectionId, tokenId),
			encodedPosition,
		);
	}

	private _checkImmutableDependency() {
		if (!this.immutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	private _checkMutableDependency() {
		if (!this.mutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	private async _pay(token: Buffer, payer: Buffer, recipient: Buffer, value: Uint256String) {
		await this.tokenMethod!.transfer(
			this.mutableContext!.context,
			payer,
			recipient,
			token,
			BigInt(value),
		);
	}

	// LiquidityManagement
	private async _mintCallback(
		amount0Owed: Uint256String,
		amount1Owed: Uint256String,
		data: string,
	) {
		const decoded = JSON.parse(data) as MintCallbackData;

		const pool = await this.poolStore!.getMutablePool(
			this.mutableContext!,
			Buffer.from(decoded.poolKey.token0, 'hex'),
			Buffer.from(decoded.poolKey.token1, 'hex'),
			decoded.poolKey.fee,
		);

		if (Uint256.from(amount0Owed).gt(0)) {
			await this._pay(
				Buffer.from(decoded.poolKey.token0, 'hex'),
				Buffer.from(decoded.payer, 'hex'),
				pool.address,
				amount0Owed,
			);
		}
		if (Uint256.from(amount1Owed).gt(0)) {
			await this._pay(
				Buffer.from(decoded.poolKey.token1, 'hex'),
				Buffer.from(decoded.payer, 'hex'),
				pool.address,
				amount1Owed,
			);
		}
	}

	private _checkDeadline(deadline: Uint256String) {
		if (Uint256.from(this.mutableContext!.timestamp).gt(deadline))
			throw new Error('Transaction too old');
	}

	private async _addLiquidity(
		params: AddLiquidityParams,
	): Promise<
		[liquidity: Uint128String, amount0: Uint256String, amount1: Uint256String, pool: SwaptoshiPool]
	> {
		const poolKey: PoolAddress.PoolKey = {
			token0: params.token0,
			token1: params.token1,
			fee: params.fee,
		};

		const pool = await this.poolStore!.getMutablePool(
			this.mutableContext!,
			params.token0,
			params.token1,
			params.fee,
		);

		const { sqrtPriceX96 } = pool.slot0;
		const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(params.tickLower);
		const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(params.tickUpper);

		const liquidity = LiquidityAmounts.getLiquidityForAmounts(
			sqrtPriceX96,
			sqrtRatioAX96,
			sqrtRatioBX96,
			params.amount0Desired,
			params.amount1Desired,
		);
		const data = JSON.stringify({
			poolKey: {
				token0: poolKey.token0.toString('hex'),
				token1: poolKey.token1.toString('hex'),
				fee: poolKey.fee,
			},
			payer: this.mutableContext!.senderAddress.toString('hex'),
		});

		const [amount0, amount1] = await pool.mint(
			params.recipient,
			params.tickLower,
			params.tickUpper,
			liquidity,
			data,
			this._mintCallback.bind(this),
		);

		if (
			Uint256.from(amount0).lt(params.amount0Min) ||
			Uint256.from(amount1).lt(params.amount1Min)
		) {
			throw new Error('Price slippage check');
		}

		return [liquidity, amount0, amount1, pool];
	}

	private async _isAuthorizedForToken(sender: Buffer, tokenId: Uint64String) {
		const nft = await this.nftMethod!.getNFT(
			this.mutableContext!.context,
			PositionKey.getNFTId(this.chainId, this.collectionId, tokenId),
		);
		if (nft.owner.compare(sender) !== 0) {
			throw new Error('Not approved');
		}
	}

	public collectionId: Buffer = Buffer.alloc(0);
	public poolAddress: Buffer = Buffer.alloc(0);
	public name: string = '';
	public symbol: string = '';
	public address: Buffer = POSITION_MANAGER_ADDRESS;

	private readonly chainId: Buffer = Buffer.alloc(0);
	private readonly events: NamedRegistry | undefined;
	private readonly poolStore: PoolStore | undefined;
	private readonly tokenSymbolStore: TokenSymbolStore | undefined;
	private readonly positionInfoStore: PositionInfoStore | undefined;

	private mutableContext: MutableSwapContext | undefined;
	private immutableContext: ImmutableSwapContext | undefined;
	private tokenMethod: TokenMethod | undefined;
	private nftMethod: NFTMethod | undefined;

	private mutableDependencyReady = false;
	private immutableDependencyReady = false;
}
