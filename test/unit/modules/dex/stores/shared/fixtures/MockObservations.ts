import { Uint160String, Int24String, Uint16String, Uint8String, Uint128String, Uint32String, Int56String, Uint256, Uint32 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { Observation } from '../../../../../../../src/app/modules/dex/types';

interface Slot0 {
	sqrtPriceX96: Uint160String;
	tick: Int24String;
	observationIndex: Uint16String;
	observationCardinality: Uint16String;
	observationCardinalityNext: Uint16String;
	feeProtocol: Uint8String;
}

const defaultSlot0: Slot0 = Object.freeze({
	sqrtPriceX96: '0',
	tick: '0',
	observationIndex: '0',
	observationCardinality: '0',
	observationCardinalityNext: '0',
	feeProtocol: '0',
});

export class MockObservations {
	public constructor(
		_blockTimestamps: Uint32String[],
		_tickCumulatives: Int56String[],
		_secondsPerLiquidityCumulativeX128s: Uint128String[],
		_initializeds: boolean[],
		_tick: Int24String,
		_observationCardinality: Uint16String,
		_observationIndex: Uint16String,
		_lastObservationCurrentTimestamp: boolean,
		_liquidity: Uint128String,
	) {
		for (let i = 0; i < _blockTimestamps.length; i += 1) {
			this.observations[i] = {
				blockTimestamp: _blockTimestamps[i],
				tickCumulative: _tickCumulatives[i],
				secondsPerLiquidityCumulativeX128: _secondsPerLiquidityCumulativeX128s[i],
				initialized: _initializeds[i],
			};
		}

		this.slot0Tick = _tick;
		this.slot0ObservationCardinality = _observationCardinality;
		this.slot0ObservationIndex = _observationIndex;
		this.lastObservationCurrentTimestamp = _lastObservationCurrentTimestamp;
		this.liquidity = _liquidity;

		this.slot0.sqrtPriceX96 = '0';
		this.slot0.tick = _tick;
		this.slot0.observationIndex = _observationIndex;
		this.slot0.observationCardinality = _observationCardinality;
		this.slot0.observationCardinalityNext = '0';
		this.slot0.feeProtocol = '0';
	}

	public observationsTimestamp(blockTimestamp: Uint32String) {
		if (this.lastObservationCurrentTimestamp) {
			const prevIndex = Uint256.from(Uint256.from(this.slot0.observationIndex).add(this.slot0.observationCardinality).sub(1)).mod(this.slot0.observationCardinality).toNumber();

			this.observations[prevIndex].blockTimestamp = Uint32.from(blockTimestamp)
				.sub(Uint32.from(this.observations[parseInt(this.slot0ObservationIndex, 10)].blockTimestamp).sub(this.observations[prevIndex].blockTimestamp))
				.toString();

			this.observations[parseInt(this.slot0.observationIndex, 10)].blockTimestamp = Uint32.from(blockTimestamp)
				.sub(Uint32.from(this.observations[parseInt(this.slot0ObservationIndex, 10)].blockTimestamp).sub(this.observations[parseInt(this.slot0.observationIndex, 10)].blockTimestamp))
				.toString();
		}
	}

	slot0: Slot0 = { ...defaultSlot0 };
	observations: Observation[] = new Array(4);
	slot0Tick: Int24String = '0';
	slot0ObservationCardinality: Uint16String = '0';
	slot0ObservationIndex: Uint16String = '0';
	liquidity: Uint128String = '0';

	lastObservationCurrentTimestamp: boolean = false;
}
