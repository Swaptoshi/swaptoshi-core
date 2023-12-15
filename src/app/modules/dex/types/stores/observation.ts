import { Uint32String, Int56String, Uint160String } from '../../stores/library/int';

export interface Observation {
	blockTimestamp: Uint32String;
	tickCumulative: Int56String;
	secondsPerLiquidityCumulativeX128: Uint160String;
	initialized: boolean;
}
