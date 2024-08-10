/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, utils } from 'klayr-sdk';
import {
	FactorySetAttributesParams,
	FactoryStoreData,
	FactoryTransferOwnershipParams,
	TokenBurnParams,
	TokenCreateParams,
	TokenFactoryAttributes,
	TokenMintParams,
	VestingUnlockStoreData,
} from '../../types';
import { FactoryStore } from '../factory';
import { NextAvailableTokenIdStore } from '../next_available_token_id';
import { FactoryCreatedEvent } from '../../events/factory_created';
import { BaseInstance } from './base';
import { VestingUnlockStore } from '../vesting_unlock';
import { numberToBytes, serializer, verifyAddress, verifyBuffer, verifyPositiveNumber, verifyString, verifyToken } from '../../utils';
import { FactoryOwnerChangedEvent } from '../../events/factory_owner_changed';
import { FactorySetAttributesEvent } from '../../events/factory_set_attributes';
import { TokenFactoryGovernableConfig } from '../../config';
import { VESTING_MODULE_SUFFIX } from '../../constants';
import { VestedTokenLockedEvent } from '../../events/vested_token_locked';

export class Factory extends BaseInstance<FactoryStoreData, FactoryStore> implements FactoryStoreData {
	public constructor(stores: NamedRegistry, events: NamedRegistry, config: TokenFactoryGovernableConfig, genesisConfig: GenesisConfig, moduleName: string, factory: FactoryStoreData, tokenId: Buffer) {
		super(FactoryStore, stores, events, config, genesisConfig, moduleName, tokenId);

		Object.assign(this, utils.objects.cloneDeep(factory));

		this.nextAvailableIdStore = stores.get(NextAvailableTokenIdStore);
		this.vestingUnlockStore = stores.get(VestingUnlockStore);
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<FactoryStoreData>({
				owner: this.owner,
				attributesArray: this.attributesArray,
			}),
		) as JSONObject<FactoryStoreData>;
	}

	public toObject() {
		const obj: FactoryStoreData = {
			owner: this.owner,
			attributesArray: this.attributesArray,
		};
		return utils.objects.cloneDeep({ ...obj }) as FactoryStoreData;
	}

	public async verifyCreate(params: TokenCreateParams) {
		this._checkImmutableDependencies();
		await this._verifyHandleMintDistribution(params.distribution);
		await this._verifyAttributesArray(params.attributes);
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

		await this._registerFactory(tokenId, params);
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

		for (const attributes of params.attributes) {
			const setAttributesEvent = this.events.get(FactorySetAttributesEvent);
			setAttributesEvent.add(
				this.mutableContext!.context,
				{
					tokenId,
					key: attributes.key,
				},
				[this.owner, tokenId],
			);
		}
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

		const events = this.events.get(FactoryOwnerChangedEvent);
		events.add(
			this.mutableContext!.context,
			{
				ownerAddress: params.ownerAddress,
				tokenId: params.tokenId,
			},
			[params.ownerAddress],
		);
	}

	public async verifySetAttributes(params: FactorySetAttributesParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenId', params.tokenId);
		verifyString('key', params.key);
		verifyBuffer('attributes', params.attributes);

		await this._checkFactoryExists(params.tokenId);
		await this._checkIsFactoryOwner();
	}

	public async setAttributes(params: FactorySetAttributesParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifySetAttributes(params);

		await this._setAttributes(params.key, params.attributes);
		await this._saveStore();

		const events = this.events.get(FactorySetAttributesEvent);
		events.add(
			this.mutableContext!.context,
			{
				tokenId: params.tokenId,
				key: params.key,
			},
			[this.owner, params.tokenId],
		);
	}

	public async getNextAvailableTokenId() {
		this._checkImmutableDependencies();
		const skippedTokenIDs = new Set();

		const config = await this.getConfig(this.immutableContext!.context);
		const nextAvailableId = await this.nextAvailableIdStore.getOrDefault(this.immutableContext!.context);

		for (const skippedTokenId of config.skippedTokenID) {
			const id = this._tokenIdToBigint(skippedTokenId);
			skippedTokenIDs.add(id);
		}

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (skippedTokenIDs.has(nextAvailableId.nextTokenId)) {
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

		await this._lock(params);

		return totalAmountMinted;
	}

	private async _lock(params: TokenMintParams) {
		this._checkMutableDependencies();

		const toBeLockedByHeight: { [height: string]: VestingUnlockStoreData['toBeUnlocked'] } = {};

		for (const distributionItem of params.distribution) {
			for (const vesting of distributionItem.vesting) {
				if (vesting.height > this.mutableContext!.height) {
					const key = vesting.height.toString();
					if (!toBeLockedByHeight[key]) toBeLockedByHeight[key] = [];

					const index = toBeLockedByHeight[key].findIndex(t => Buffer.compare(t.address, distributionItem.recipientAddress) === 0 && Buffer.compare(t.tokenId, params.tokenId) === 0);

					if (index >= 0) {
						toBeLockedByHeight[key][index].amount += vesting.amount;
					} else {
						toBeLockedByHeight[key].push({
							address: distributionItem.recipientAddress,
							amount: vesting.amount,
							tokenId: params.tokenId,
						});
					}

					await this.tokenMethod!.lock(this.mutableContext!.context, distributionItem.recipientAddress, `${this.moduleName}_${VESTING_MODULE_SUFFIX}`, params.tokenId, vesting.amount);
				}
			}
		}

		for (const heightString of Object.keys(toBeLockedByHeight)) {
			const height = Number(heightString);
			const unlockSchedule = await this._getUnlockScheduleAtHeight(height);

			for (const toBeLocked of toBeLockedByHeight[heightString]) {
				const index = unlockSchedule.toBeUnlocked.findIndex(t => Buffer.compare(t.address, toBeLocked.address) === 0 && Buffer.compare(t.tokenId, toBeLocked.tokenId) === 0);
				if (index >= 0) {
					unlockSchedule.toBeUnlocked[index].amount += toBeLocked.amount;
				} else {
					unlockSchedule.toBeUnlocked.push(toBeLocked);
				}

				const events = this.events.get(VestedTokenLockedEvent);
				events.add(
					this.mutableContext!.context,
					{
						amount: toBeLocked.amount,
						height,
						recipientAddress: toBeLocked.address,
						tokenId: toBeLocked.tokenId,
					},
					[toBeLocked.address],
				);
			}

			await this._setUnlockScheduleAtHeight(height, unlockSchedule);
		}
	}

	private async _getUnlockScheduleAtHeight(height: number) {
		return this.vestingUnlockStore.getOrDefault(this.mutableContext!.context, numberToBytes(height));
	}

	private async _setUnlockScheduleAtHeight(height: number, vestingUnlock: VestingUnlockStoreData) {
		await this.vestingUnlockStore.set(this.mutableContext!.context, numberToBytes(height), vestingUnlock);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _setAttributes(key: string, attributes: Buffer) {
		const index = this.attributesArray.findIndex(attr => attr.key === key);
		if (index > -1) {
			this.attributesArray[index] = { key, attributes };
		} else {
			this.attributesArray.push({ key, attributes });
		}
	}

	private async _registerFactory(tokenId: Buffer, params: TokenCreateParams): Promise<void> {
		if (await this._isFactoryExists(tokenId)) throw new Error(`factory for ${tokenId.toString('hex')} already registered`);
		this.owner = this.mutableContext!.senderAddress;
		this.attributesArray = params.attributes;
		this._setKey(tokenId);
		await this._saveStore();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _verifyAttributesArray(attributesArray: TokenFactoryAttributes[]) {
		for (const attributes of attributesArray) {
			verifyString('attributes.key', attributes.key);
			verifyBuffer('attributes.attributes', attributes.attributes);
		}
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

	private _tokenIdToBigint(tokenId: string) {
		if (tokenId.length === 16) {
			return BigInt(`0x${tokenId.substring(8, 16)}`);
		}
		if (tokenId.length === 8) {
			return BigInt(`0x${tokenId.substring(0, 8)}`);
		}
		throw new Error('invalid tokenFactory skippedTokenID config type');
	}

	public owner: Buffer = Buffer.alloc(0);
	public attributesArray: TokenFactoryAttributes[] = [];

	private readonly vestingUnlockStore: VestingUnlockStore;
	private readonly nextAvailableIdStore: NextAvailableTokenIdStore;
}
