/* eslint-disable import/no-cycle */
import { BaseStore, ImmutableStoreGetter, db } from 'klayr-sdk';
import { TickInfo } from '../types';
import { Int24String } from './library/int';
import { tickInfoStoreSchema } from '../schema';
import { maxUnsigned } from './library/int/base/limit';

export const defaultTickInfo: TickInfo = Object.freeze({
	liquidityGross: '0',
	liquidityNet: '0',
	feeGrowthOutside0X128: '0',
	feeGrowthOutside1X128: '0',
	tickCumulativeOutside: '0',
	secondsPerLiquidityOutsideX128: '0',
	secondsOutside: '0',
	initialized: false,
});

export class TickInfoStore extends BaseStore<TickInfo> {
	public getKey(poolAddress: Buffer, tick: Int24String) {
		const tickBuf = Buffer.allocUnsafe(3);
		tickBuf.writeUIntBE(this.hof(tick, 24), 0, 3);
		return Buffer.concat([poolAddress, tickBuf]);
	}

	public async getOrDefault(context: ImmutableStoreGetter, key: Buffer): Promise<TickInfo> {
		try {
			const positionInfo = await this.get(context, key);
			return positionInfo;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...defaultTickInfo };
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

	public schema = tickInfoStoreSchema;
	public default: TickInfo = { ...defaultTickInfo };
}
