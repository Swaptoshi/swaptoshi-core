/* eslint-disable prefer-destructuring */
import {
	Uint32String,
	Int56String,
	Uint160String,
} from '../../../../../../../src/app/modules/dex/stores/library/int';

interface Observation {
	secondsAgo: Uint32String;
	tickCumulatives: Int56String;
	secondsPerLiquidityCumulativeX128s: Uint160String;
}

const defaultObservation: Observation = Object.freeze({
	secondsAgo: '0',
	tickCumulatives: '0',
	secondsPerLiquidityCumulativeX128s: '0',
});

export class MockObservable {
	public constructor(
		secondsAgos: Uint32String[],
		tickCumulatives: Int56String[],
		secondsPerLiquidityCumulativeX128s: Uint160String[],
	) {
		if (
			!(
				secondsAgos.length === 2 &&
				tickCumulatives.length === 2 &&
				secondsPerLiquidityCumulativeX128s.length === 2
			)
		)
			throw new Error('Invalid test case size');

		this.observation0.secondsAgo = secondsAgos[0];
		this.observation0.tickCumulatives = tickCumulatives[0];
		this.observation0.secondsPerLiquidityCumulativeX128s = secondsPerLiquidityCumulativeX128s[0];

		this.observation1.secondsAgo = secondsAgos[1];
		this.observation1.tickCumulatives = tickCumulatives[1];
		this.observation1.secondsPerLiquidityCumulativeX128s = secondsPerLiquidityCumulativeX128s[1];
	}

	public observe(secondsAgos: Uint32String[]): [string[], string[]] {
		if (
			!(
				secondsAgos[0] === this.observation0.secondsAgo &&
				secondsAgos[1] === this.observation1.secondsAgo
			)
		)
			throw new Error('Invalid test case');

		const _tickCumulatives = new Array(2);
		_tickCumulatives[0] = this.observation0.tickCumulatives;
		_tickCumulatives[1] = this.observation1.tickCumulatives;

		const _secondsPerLiquidityCumulativeX128s = new Array(2);
		_secondsPerLiquidityCumulativeX128s[0] = this.observation0.secondsPerLiquidityCumulativeX128s;
		_secondsPerLiquidityCumulativeX128s[1] = this.observation1.secondsPerLiquidityCumulativeX128s;

		return [_tickCumulatives, _secondsPerLiquidityCumulativeX128s];
	}

	observation0: Observation = { ...defaultObservation };
	observation1: Observation = { ...defaultObservation };
}
