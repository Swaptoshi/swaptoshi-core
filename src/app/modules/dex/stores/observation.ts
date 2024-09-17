/* eslint-disable import/no-cycle */
import { Modules, db, utils } from 'klayr-sdk';
import { Observation } from '../types';
import { Int16String } from './library/int';
import { observationStoreSchema } from '../schema';
import { maxUnsigned } from './library/int/base/limit';

export const defaultObservation: Observation = Object.freeze({
	blockTimestamp: '0',
	tickCumulative: '0',
	secondsPerLiquidityCumulativeX128: '0',
	initialized: false,
});

export class ObservationStore extends Modules.BaseStore<Observation> {
	public getKey(poolAddress: Buffer, index: Int16String) {
		const indexBuf = Buffer.allocUnsafe(2);
		indexBuf.writeUIntBE(this.hof(index, 16), 0, 2);
		return Buffer.concat([poolAddress, indexBuf]);
	}

	public async getOrDefault(context: Modules.ImmutableStoreGetter, key: Buffer): Promise<Observation> {
		try {
			const observation = await this.get(context, key);
			return observation;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			return utils.objects.cloneDeep(defaultObservation) as Observation;
		}
	}

	private hof(value: string, bitSize: number): number {
		const max = parseInt(maxUnsigned[bitSize] as string, 10);
		const min = 0;

		let result = parseInt(value, 10);
		if (result < min || result > max) {
			const range = max - min + 1;
			result = ((((result - min) % range) + range) % range) + min;
		}

		return result;
	}

	public schema = observationStoreSchema;
	public default: Observation = { ...defaultObservation };
}
