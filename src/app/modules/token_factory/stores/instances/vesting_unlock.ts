/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, utils } from 'klayr-sdk';
import { TokenFactoryModuleConfig, TokenMintParams, VestingUnlockStoreData } from '../../types';
import { BaseInstance } from './base';
import { bytesToNumber, numberToBytes, serializer } from '../../utils';
import { VestingUnlockStore } from '../vesting_unlock';
import { VestedTokenUnlockedEvent } from '../../events/vested_token_unlocked';
import { VestedTokenLockedEvent } from '../../events/vested_token_locked';
import { VESTING_MODULE_SUFFIX } from '../../constants';

export class VestingUnlock
	extends BaseInstance<VestingUnlockStoreData, VestingUnlockStore>
	implements VestingUnlockStoreData
{
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		genesisConfig: GenesisConfig,
		config: TokenFactoryModuleConfig,
		moduleName: string,
		vestingUnlock: VestingUnlockStoreData,
		height: number,
	) {
		super(
			VestingUnlockStore,
			stores,
			events,
			genesisConfig,
			config,
			moduleName,
			numberToBytes(height),
		);
		Object.assign(this, utils.objects.cloneDeep(vestingUnlock));
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<VestingUnlockStoreData>({
				toBeUnlocked: this.toBeUnlocked,
			}),
		) as JSONObject<VestingUnlockStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			toBeUnlocked: this.toBeUnlocked,
		} as VestingUnlockStoreData) as VestingUnlockStoreData;
	}

	public async unlock() {
		this._checkMutableDependencies();

		if (this.toBeUnlocked.length > 0) {
			for (const toBeUnlocked of this.toBeUnlocked) {
				await this.tokenMethod!.unlock(
					this.mutableContext!.context,
					toBeUnlocked.address,
					`${this.moduleName}_${VESTING_MODULE_SUFFIX}`,
					toBeUnlocked.tokenId,
					toBeUnlocked.amount,
				);

				const events = this.events.get(VestedTokenUnlockedEvent);
				events.add(
					this.mutableContext!.context,
					{
						amount: toBeUnlocked.amount,
						height: bytesToNumber(this.key),
						recipientAddress: toBeUnlocked.address,
						tokenId: toBeUnlocked.tokenId,
					},
					[toBeUnlocked.address],
				);
			}

			this.toBeUnlocked = [];
			await this._saveStore();
		}
	}

	public async lock(params: TokenMintParams) {
		this._checkMutableDependencies();

		const toBeLockedByHeight: { [height: string]: VestingUnlockStoreData['toBeUnlocked'] } = {};

		for (const distributionItem of params.distribution) {
			for (const vesting of distributionItem.vesting) {
				if (vesting.height > this.mutableContext!.height) {
					const key = vesting.height.toString();
					if (!toBeLockedByHeight[key]) toBeLockedByHeight[key] = [];

					const index = toBeLockedByHeight[key].findIndex(
						t =>
							Buffer.compare(t.address, distributionItem.recipientAddress) === 0 &&
							Buffer.compare(t.tokenId, params.tokenId) === 0,
					);

					if (index >= 0) {
						toBeLockedByHeight[key][index].amount += vesting.amount;
					} else {
						toBeLockedByHeight[key].push({
							address: distributionItem.recipientAddress,
							amount: vesting.amount,
							tokenId: params.tokenId,
						});
					}

					await this.tokenMethod!.lock(
						this.mutableContext!.context,
						distributionItem.recipientAddress,
						`${this.moduleName}_${VESTING_MODULE_SUFFIX}`,
						params.tokenId,
						vesting.amount,
					);
				}
			}
		}

		for (const heightString of Object.keys(toBeLockedByHeight)) {
			const height = Number(heightString);
			const unlockSchedule = await this._getUnlockScheduleAtHeight(height);

			for (const toBeLocked of toBeLockedByHeight[heightString]) {
				const index = unlockSchedule.toBeUnlocked.findIndex(
					t =>
						Buffer.compare(t.address, toBeLocked.address) === 0 &&
						Buffer.compare(t.tokenId, toBeLocked.tokenId) === 0,
				);
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
		return this.instanceStore.getOrDefault(this.mutableContext!.context, numberToBytes(height));
	}

	private async _setUnlockScheduleAtHeight(height: number, vestingUnlock: VestingUnlockStoreData) {
		await this.instanceStore.set(
			this.mutableContext!.context,
			numberToBytes(height),
			vestingUnlock,
		);
	}

	public toBeUnlocked: VestingUnlockStoreData['toBeUnlocked'] = [];
}
