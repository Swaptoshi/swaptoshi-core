/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, cryptography, utils } from 'klayr-sdk';
import {
	ICOChangePriceParams,
	ICOCreateParams,
	ICODepositParams,
	ICOStoreData,
	ICOTreasurifyParams,
	ICOWithdrawParams,
	TokenFactoryModuleConfig,
} from '../../types';
import { BaseInstance } from './base';
import { ICOStore } from '../ico';
import { IcoCreatedEvent } from '../../events/ico_created';
import { serializer, verifyAddress, verifyPositiveNumber, verifyToken } from '../../utils';
import { FactoryStore } from '../factory';
import { computeICOPoolAddress, decodeICOPoolAddress } from '../library';
import { IcoTreasurifyEvent } from '../../events/ico_treasurify';
import { IcoPriceChangedEvent } from '../../events/ico_price_changed';
import { IcoDepositEvent } from '../../events/ico_deposit';
import { IcoWithdrawEvent } from '../../events/ico_withdraw';
import { ICO_MODULE_SUFFIX } from '../../constants';

export class ICOPool extends BaseInstance<ICOStoreData, ICOStore> implements ICOStoreData {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		genesisConfig: GenesisConfig,
		config: TokenFactoryModuleConfig,
		moduleName: string,
		ico: ICOStoreData,
		poolAddress: Buffer,
	) {
		super(ICOStore, stores, events, genesisConfig, config, moduleName, poolAddress);

		if (ico) Object.assign(this, utils.objects.cloneDeep(ico));
		this.factoryStore = stores.get(FactoryStore);
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<ICOStoreData>({
				price: this.price,
				providerAddress: this.providerAddress,
			}),
		) as JSONObject<ICOStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			price: this.price,
			providerAddress: this.providerAddress,
		} as ICOStoreData) as ICOStoreData;
	}

	public async verifyCreate(params: ICOCreateParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenIn', params.tokenIn);
		verifyToken('tokenOut', params.tokenOut);
		verifyAddress('providerAddress', params.providerAddress);
		verifyPositiveNumber('amount', params.amount);
		verifyPositiveNumber('price', params.price);

		await this._checkFactoryOwner(params.tokenOut);
		await this._checkICONotCreatedYet(params.tokenIn, params.tokenOut);
	}

	public async create(params: ICOCreateParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyCreate(params);

		const poolAddress = computeICOPoolAddress(params);

		await this.tokenMethod!.initializeUserAccount(
			this.mutableContext!.context,
			poolAddress,
			params.tokenIn,
		);
		await this.tokenMethod!.initializeUserAccount(
			this.mutableContext!.context,
			poolAddress,
			params.tokenOut,
		);

		const tokenInBalance = await this.tokenMethod!.getAvailableBalance(
			this.mutableContext!.context,
			poolAddress,
			params.tokenIn,
		);
		const tokenOutBalance = await this.tokenMethod!.getAvailableBalance(
			this.mutableContext!.context,
			poolAddress,
			params.tokenOut,
		);

		if (this.config.icoLeftOverAddress) {
			const leftOverAddress = cryptography.address.getAddressFromKlayr32Address(
				this.config.icoLeftOverAddress,
				this.config.icoLeftOverAddress.substring(0, 3),
			);
			await this.tokenMethod!.initializeUserAccount(
				this.mutableContext!.context,
				leftOverAddress,
				params.tokenIn,
			);
			await this.tokenMethod!.initializeUserAccount(
				this.mutableContext!.context,
				leftOverAddress,
				params.tokenOut,
			);

			if (tokenInBalance > BigInt(0)) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					poolAddress,
					leftOverAddress,
					params.tokenIn,
					tokenInBalance,
				);
			}
			if (tokenOutBalance > BigInt(0)) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					poolAddress,
					leftOverAddress,
					params.tokenOut,
					tokenOutBalance,
				);
			}
		} else {
			if (tokenInBalance > BigInt(0)) {
				await this.tokenMethod!.lock(
					this.mutableContext!.context,
					poolAddress,
					`${this.moduleName}_${ICO_MODULE_SUFFIX}`,
					params.tokenIn,
					tokenInBalance,
				);
			}
			if (tokenOutBalance > BigInt(0)) {
				await this.tokenMethod!.lock(
					this.mutableContext!.context,
					poolAddress,
					`${this.moduleName}_${ICO_MODULE_SUFFIX}`,
					params.tokenOut,
					tokenOutBalance,
				);
			}
		}

		this.price = params.price;
		this.providerAddress = params.providerAddress;
		this._setKey(poolAddress);

		await this._saveStore();

		const events = this.events.get(IcoCreatedEvent);
		events.add(
			this.mutableContext!.context,
			{
				price: params.price,
				providerAddress: params.providerAddress,
				tokenIn: params.tokenIn,
				tokenOut: params.tokenOut,
			},
			[params.providerAddress],
		);

		if (params.amount > BigInt(0)) {
			await this.deposit({ poolAddress, amount: params.amount }, false);
		}
	}

	public async verifyChangePrice(params: ICOChangePriceParams) {
		this._checkImmutableDependencies();
		verifyAddress('poolAddress', params.poolAddress);
		verifyPositiveNumber('price', params.price);

		await this._checkICOProvider();
		await this._checkICOExists(params.poolAddress);
	}

	public async changePrice(params: ICOChangePriceParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyChangePrice(params);

		this.price = params.price;

		await this._saveStore();

		const events = this.events.get(IcoPriceChangedEvent);
		events.add(
			this.mutableContext!.context,
			{
				poolAddress: params.poolAddress,
				price: params.price,
			},
			[params.poolAddress],
		);
	}

	public async verifyDeposit(params: ICODepositParams) {
		this._checkImmutableDependencies();
		verifyAddress('poolAddress', params.poolAddress);
		verifyPositiveNumber('amount', params.amount);

		await this._checkICOProvider();
		await this._checkICOExists(params.poolAddress);
	}

	public async deposit(params: ICODepositParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyDeposit(params);

		const poolKey = decodeICOPoolAddress(this.key);
		await this.tokenMethod!.transfer(
			this.mutableContext!.context,
			this.mutableContext!.senderAddress,
			this.key,
			poolKey.tokenOut,
			params.amount,
		);

		const events = this.events.get(IcoDepositEvent);
		events.add(
			this.mutableContext!.context,
			{
				poolAddress: params.poolAddress,
				amount: params.amount,
			},
			[params.poolAddress],
		);
	}

	public async verifyWithdraw(params: ICOWithdrawParams) {
		this._checkImmutableDependencies();
		verifyAddress('poolAddress', params.poolAddress);
		verifyPositiveNumber('amount', params.amount);

		await this._checkICOProvider();
		await this._checkICOExists(params.poolAddress);
	}

	public async withdraw(params: ICOWithdrawParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyDeposit(params);

		const poolKey = decodeICOPoolAddress(this.key);
		await this.tokenMethod!.transfer(
			this.mutableContext!.context,
			this.key,
			this.mutableContext!.senderAddress,
			poolKey.tokenOut,
			params.amount,
		);

		const events = this.events.get(IcoWithdrawEvent);
		events.add(
			this.mutableContext!.context,
			{
				poolAddress: params.poolAddress,
				amount: params.amount,
			},
			[params.poolAddress],
		);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyTreasurify(params: ICOTreasurifyParams) {
		this._checkImmutableDependencies();
		verifyAddress('poolAddress', params.poolAddress);
		verifyToken('tokenId', params.tokenId);

		await this._checkICOExists(params.poolAddress);
	}

	public async treasurify(params: ICOTreasurifyParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyTreasurify(params);

		if (this.config.icoLeftOverAddress) {
			const poolKey = decodeICOPoolAddress(params.poolAddress);
			if (
				params.tokenId.compare(poolKey.tokenIn) === 0 ||
				params.tokenId.compare(poolKey.tokenOut) === 0
			) {
				throw new Error(`invalid attempt to treasurify pool's tokenIn or tokenOut`);
			}

			let tokenToBeTransferred = BigInt(0);
			let tokenToBeUnlocked = BigInt(0);

			tokenToBeUnlocked = await this.tokenMethod!.getLockedAmount(
				this.mutableContext!.context,
				params.poolAddress,
				params.tokenId,
				this.moduleName,
			);
			tokenToBeTransferred = await this.tokenMethod!.getAvailableBalance(
				this.mutableContext!.context,
				params.poolAddress,
				params.tokenId,
			);

			if (tokenToBeTransferred > BigInt(0) || tokenToBeUnlocked > BigInt(0)) {
				const leftOverAddress = cryptography.address.getAddressFromKlayr32Address(
					this.config.icoLeftOverAddress,
					this.config.icoLeftOverAddress.substring(0, 3),
				);

				let amount = tokenToBeTransferred;

				if (tokenToBeUnlocked > BigInt(0)) {
					await this.tokenMethod!.unlock(
						this.mutableContext!.context,
						params.poolAddress,
						`${this.moduleName}_${ICO_MODULE_SUFFIX}`,
						params.tokenId,
						tokenToBeUnlocked,
					);
					amount += tokenToBeUnlocked;
				}

				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					params.poolAddress,
					leftOverAddress,
					params.tokenId,
					amount,
				);

				const events = this.events.get(IcoTreasurifyEvent);
				events.add(
					this.mutableContext!.context,
					{
						poolAddress: params.poolAddress,
						leftOverAddress,
						token: params.tokenId,
						amount,
					},
					[params.poolAddress, leftOverAddress],
				);
			}
		}
	}

	private async _checkICONotCreatedYet(tokenIn: Buffer, tokenOut: Buffer) {
		if (
			await this.instanceStore.has(
				this.immutableContext!.context,
				computeICOPoolAddress({ tokenIn, tokenOut }),
			)
		) {
			throw new Error('ICO pool already exists');
		}
	}

	private async _checkICOExists(poolAddress: Buffer) {
		if (!(await this.instanceStore.has(this.immutableContext!.context, poolAddress))) {
			throw new Error('ICO pool doesnt exists');
		}
	}

	private async _checkFactoryOwner(factoryToken: Buffer) {
		this._checkImmutableDependencies();
		const factory = await this.factoryStore.getImmutableFactory(
			this.immutableContext!,
			factoryToken,
		);
		if (!(await factory.isFactoryOwner())) throw new Error('sender is not factory owner');
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _checkICOProvider() {
		this._checkImmutableDependencies();
		if (this.immutableContext!.senderAddress.compare(this.providerAddress) !== 0) {
			throw new Error('sender is not fund provider of this ICO pool');
		}
	}

	public price: string = '0';
	public providerAddress: Buffer = Buffer.alloc(0);

	private readonly factoryStore: FactoryStore;
}
