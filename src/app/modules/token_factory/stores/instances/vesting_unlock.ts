/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, utils } from 'klayr-sdk';
import { VestingUnlockStoreData } from '../../types';
import { BaseInstance } from './base';
import { bytesToNumber, numberToBytes, serializer } from '../../utils';
import { VestingUnlockStore } from '../vesting_unlock';
import { VestedTokenUnlockedEvent } from '../../events/vested_token_unlocked';
import { VESTING_MODULE_SUFFIX } from '../../constants';
import { TokenFactoryGovernableConfig } from '../../config';

export class VestingUnlock extends BaseInstance<VestingUnlockStoreData, VestingUnlockStore> implements VestingUnlockStoreData {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		config: TokenFactoryGovernableConfig,
		genesisConfig: GenesisConfig,
		moduleName: string,
		vestingUnlock: VestingUnlockStoreData,
		height: number,
	) {
		super(VestingUnlockStore, stores, events, config, genesisConfig, moduleName, numberToBytes(height));
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
				await this.tokenMethod!.unlock(this.mutableContext!.context, toBeUnlocked.address, `${this.moduleName}_${VESTING_MODULE_SUFFIX}`, toBeUnlocked.tokenId, toBeUnlocked.amount);

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

	public toBeUnlocked: VestingUnlockStoreData['toBeUnlocked'] = [];
}
