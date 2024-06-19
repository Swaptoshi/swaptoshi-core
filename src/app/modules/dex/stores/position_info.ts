import { BaseStore, ImmutableStoreGetter, db } from 'klayr-sdk';
import { PositionInfo } from '../types';
import { positionInfoStoreSchema } from '../schema';

export const defaultPositionInfo: PositionInfo = Object.freeze({
	liquidity: '0',
	feeGrowthInside0LastX128: '0',
	feeGrowthInside1LastX128: '0',
	tokensOwed0: '0',
	tokensOwed1: '0',
});

export class PositionInfoStore extends BaseStore<PositionInfo> {
	public getKey(poolAddress: Buffer, key: Buffer) {
		return Buffer.concat([poolAddress, key]);
	}

	public async getOrDefault(context: ImmutableStoreGetter, key: Buffer): Promise<PositionInfo> {
		try {
			const positionInfo = await this.get(context, key);
			return positionInfo;
		} catch (error) {
			if (!(error instanceof db.NotFoundError)) {
				throw error;
			}
			return { ...defaultPositionInfo };
		}
	}

	public schema = positionInfoStoreSchema;
	public default: PositionInfo = { ...defaultPositionInfo };
}
