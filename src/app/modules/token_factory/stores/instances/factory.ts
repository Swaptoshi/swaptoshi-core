/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, utils } from 'klayr-sdk';
import { FactoryStoreData, FactoryTransferOwnershipParams, TokenBurnParams, TokenCreateParams, TokenFactoryModuleConfig, TokenMintParams } from '../../types';
import { FactoryStore } from '../factory';
import { NextAvailableTokenIdStore } from '../next_available_token_id';
import { FactoryCreatedEvent } from '../../events/factory_created';
import { BaseInstance } from './base';
import { VestingUnlockStore } from '../vesting_unlock';
import { serializer, verifyAddress, verifyPositiveNumber, verifyToken } from '../../utils';

export class Factory extends BaseInstance<FactoryStoreData, FactoryStore> implements FactoryStoreData {
	public constructor(stores: NamedRegistry, events: NamedRegistry, genesisConfig: GenesisConfig, config: TokenFactoryModuleConfig, moduleName: string, factory: FactoryStoreData, tokenId: Buffer) {
		super(FactoryStore, stores, events, genesisConfig, config, moduleName, tokenId);

		Object.assign(this, utils.objects.cloneDeep(factory));

		this.nextAvailableIdStore = stores.get(NextAvailableTokenIdStore);
		this._parseSkippedTokenID();
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<FactoryStoreData>({
				owner: this.owner,
			}),
		) as JSONObject<FactoryStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			owner: this.owner,
		} as FactoryStoreData) as FactoryStoreData;
	}

	public async verifyCreate(params: TokenCreateParams) {
		this._checkImmutableDependencies();
		await this._verifyHandleMintDistribution(params.distribution);
		await this._checkNextTokenIdAtMaxCapacity();
	}

	public async create(params: TokenCreateParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyCreate(params);

		let tokenId: Buffer = Buffer.alloc(0);
		const nextId = await this.getNextAvailableTokenId();
		const tokenIdBuf = Buffer.allocUnsafe(4);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			tokenIdBuf.writeUIntBE(Number(nextId.nextTokenId), 0, 4);
			tokenId = Buffer.concat([Buffer.from(this.genesisConfig.chainID, 'hex'), tokenIdBuf]);

			nextId.nextTokenId += BigInt(1);

			const available = await this.tokenMethod!.isTokenIDAvailable(this.immutableContext!.context, tokenId);

			if (!available) continue;
			await this.tokenMethod!.initializeToken(this.mutableContext!.context, tokenId);

			break;
		}

		const totalAmountMinted = await this._handleMintDistribution({
			tokenId,
			distribution: params.distribution,
		});

		await this._registerFactory(tokenId);
		await this.nextAvailableIdStore.set(this.mutableContext!.context, Buffer.alloc(0), nextId);

		const events = this.events.get(FactoryCreatedEvent);
		events.add(
			this.mutableContext!.context,
			{
				ownerAddress: this.mutableContext!.senderAddress,
				tokenId,
				amount: totalAmountMinted,
			},
			[this.mutableContext!.senderAddress],
		);
	}

	public async verifyMint(params: TokenMintParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenId', params.tokenId);

		await this._verifyHandleMintDistribution(params.distribution);
		await this._checkFactoryExists(params.tokenId);
		await this._checkIsFactoryOwner();
	}

	public async mint(params: TokenMintParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyMint(params);

		await this._handleMintDistribution(params);
	}

	public async verifyBurn(params: TokenBurnParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenId', params.tokenId);
		verifyPositiveNumber('amount', params.amount);

		await this._checkFactoryExists(params.tokenId);
		await this._checkIsFactoryOwner();

		const senderBalance = await this.tokenMethod!.getAvailableBalance(this.immutableContext!.context, this.immutableContext!.senderAddress, params.tokenId);
		if (senderBalance < params.amount) {
			throw new Error('sender balance is not sufficient to be burned');
		}
	}

	public async burn(params: TokenBurnParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyBurn(params);

		await this.tokenMethod!.burn(this.mutableContext!.context, this.mutableContext!.senderAddress, params.tokenId, params.amount);
	}

	public async verifyTransferOwnership(params: FactoryTransferOwnershipParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenId', params.tokenId);
		verifyAddress('ownerAddress', params.ownerAddress);

		await this._checkFactoryExists(params.tokenId);
		await this._checkIsFactoryOwner();
	}

	public async transferOwnership(params: FactoryTransferOwnershipParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyTransferOwnership(params);

		this.owner = params.ownerAddress;
		await this._saveStore();
	}

	public async getNextAvailableTokenId() {
		this._checkImmutableDependencies();
		const nextAvailableId = await this.nextAvailableIdStore.getOrDefault(this.immutableContext!.context);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (this._skippedTokenID.has(nextAvailableId.nextTokenId)) {
				nextAvailableId.nextTokenId += BigInt(1);
				continue;
			}
			break;
		}

		return nextAvailableId;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async isFactoryOwner() {
		if (Buffer.compare(this.immutableContext!.senderAddress, this.owner) !== 0) {
			return false;
		}
		return true;
	}

	private async _checkIsFactoryOwner() {
		if (!(await this.isFactoryOwner())) throw new Error('sender is not owner of this factory');
	}

	private async _handleMintDistribution(params: TokenMintParams) {
		let totalAmountMinted = BigInt(0);

		for (const distribution of params.distribution) {
			totalAmountMinted += distribution.amount;

			await this.tokenMethod!.mint(this.mutableContext!.context, distribution.recipientAddress, params.tokenId, distribution.amount);
		}

		const vestingInstance = await this.stores.get(VestingUnlockStore).getInstance(this.mutableContext!);
		await vestingInstance.lock(params);

		return totalAmountMinted;
	}

	private async _registerFactory(tokenId: Buffer): Promise<void> {
		if (await this._isFactoryExists(tokenId)) throw new Error(`factory for ${tokenId.toString('hex')} already registered`);
		this.owner = this.mutableContext!.senderAddress;
		this._setKey(tokenId);
		await this._saveStore();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _verifyHandleMintDistribution(distribution: TokenMintParams['distribution']) {
		for (const distributionItem of distribution) {
			verifyAddress('distribution.recipientAddress', distributionItem.recipientAddress);
			verifyPositiveNumber('distribution.amount', distributionItem.amount);

			if (distributionItem.vesting.length > 0) {
				let totalAmount = BigInt(0);
				for (const vestingItem of distributionItem.vesting) {
					verifyPositiveNumber('distribution.vesting.height', vestingItem.height);

					if (vestingItem.amount <= BigInt(0)) {
						throw new Error('vested token amount must be positive non zero integer');
					}
					totalAmount += vestingItem.amount;
				}

				if (totalAmount !== distributionItem.amount) {
					throw new Error(`total vested token for address ${distributionItem.recipientAddress.toString('hex')} doesn't match with total minted token`);
				}
			}
		}
	}

	private async _isFactoryExists(tokenId: Buffer) {
		return this.instanceStore.has(this.immutableContext!.context, tokenId);
	}

	private async _checkFactoryExists(tokenId: Buffer) {
		if (!(await this._isFactoryExists(tokenId))) {
			throw new Error("factory doesn't exists");
		}
	}

	private async _checkNextTokenIdAtMaxCapacity() {
		const nextId = await this.getNextAvailableTokenId();
		if (nextId.nextTokenId > BigInt('4294967295')) {
			throw new Error("next available token id is at maximum capacity, can't create token anymore");
		}
	}

	private _parseSkippedTokenID() {
		for (const skippedTokenId of this.config.skippedTokenID) {
			const id = this._tokenStringOrNumberToBigint(skippedTokenId);
			this._skippedTokenID.add(id);
		}
	}

	private _tokenStringOrNumberToBigint(stringOrNumber: string | number) {
		const { chainID } = this.genesisConfig;

		if (typeof stringOrNumber === 'number') {
			return BigInt(stringOrNumber);
		}

		if (typeof stringOrNumber === 'string') {
			if (stringOrNumber.length === 16) {
				if (!stringOrNumber.startsWith(chainID)) throw new Error('invalid tokenFactory skippedTokenID config chainID');
				return BigInt(`0x${stringOrNumber.substring(8, 16)}`);
			}
			if (stringOrNumber.length === 8) {
				return BigInt(`0x${stringOrNumber.substring(0, 8)}`);
			}
			throw new Error('invalid tokenFactory skippedTokenID config string length');
		}

		throw new Error('invalid tokenFactory skippedTokenID config type');
	}

	public owner: Buffer = Buffer.alloc(0);

	private readonly nextAvailableIdStore: NextAvailableTokenIdStore;
	private readonly _skippedTokenID: Set<bigint> = new Set();
}
