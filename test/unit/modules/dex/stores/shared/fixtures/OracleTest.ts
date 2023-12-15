/* eslint-disable @typescript-eslint/prefer-for-of */
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import * as oracle from '../../../../../../../src/app/modules/dex/stores/library/core/oracle';
import {
	Uint32String,
	Int24String,
	Uint128String,
	Uint16String,
	Uint16,
	Uint32,
} from '../../../../../../../src/app/modules/dex/stores/library/int';
import { ObservationStore } from '../../../../../../../src/app/modules/dex/stores/observation';
import { MutableSwapContext } from '../../../../../../../src/app/modules/dex/types';

interface InitializeParams {
	time: Uint32String;
	tick: Int24String;
	liquidity: Uint128String;
}

interface UpdateParams {
	advanceTimeBy: Uint32String;
	tick: Int24String;
	liquidity: Uint128String;
}

export class OracleTest {
	public constructor(context: MutableSwapContext, module: DexModule, poolAddress: Buffer) {
		this.module = module;
		this.context = context;
		this.poolAddress = poolAddress;
		this.observationStore = module.stores.get(ObservationStore);
	}

	public async initialize(params: InitializeParams) {
		if (Uint16.from(this.cardinality).neq(0)) throw new Error('already intialized');
		this.time = params.time;
		this.tick = params.tick;
		this.liquidity = params.liquidity;

		const [cardinality, cardinalityNext] = await oracle.initialize(
			this.observationStore,
			this.context.context,
			this.poolAddress,
			params.time,
		);
		this.cardinality = cardinality;
		this.cardinalityNext = cardinalityNext;
	}

	public advanceTime(by: Uint32String) {
		this.time = Uint32.from(this.time).add(by).toString();
	}

	public subTime(by: Uint32String) {
		this.time = Uint32.from(this.time).sub(by).toString();
	}

	public async update(params: UpdateParams) {
		this.advanceTime(params.advanceTimeBy);
		const [index, cardinality] = await oracle.write(
			this.observationStore,
			this.context.context,
			this.poolAddress,
			this.index,
			this.time,
			this.tick,
			this.liquidity,
			this.cardinality,
			this.cardinalityNext,
		);
		this.index = index;
		this.cardinality = cardinality;
		this.tick = params.tick;
		this.liquidity = params.liquidity;
	}

	public async batchUpdate(params: UpdateParams[]) {
		let _tick = this.tick;
		let _liquidity = this.liquidity;
		let _index = this.index;
		let _cardinality = this.cardinality;
		const _cardinalityNext = this.cardinalityNext;
		let _time = this.time;

		for (let i = 0; i < params.length; i += 1) {
			_time = Uint32.from(_time).add(params[i].advanceTimeBy).toString();
			const [index, cardinality] = await oracle.write(
				this.observationStore,
				this.context.context,
				this.poolAddress,
				_index,
				_time,
				_tick,
				_liquidity,
				_cardinality,
				_cardinalityNext,
			);
			_index = index;
			_cardinality = cardinality;
			_tick = params[i].tick;
			_liquidity = params[i].liquidity;
		}

		this.tick = _tick;
		this.liquidity = _liquidity;
		this.index = _index;
		this.cardinality = _cardinality;
		this.time = _time;
	}

	public async grow(_cardinalityNext: Uint16String) {
		this.cardinalityNext = await oracle.grow(
			this.observationStore,
			this.context.context,
			this.poolAddress,
			this.cardinalityNext,
			_cardinalityNext,
		);
	}

	public async observe(secondsAgos: Uint32String[]) {
		return oracle.observe(
			this.observationStore,
			this.context.context,
			this.poolAddress,
			this.time,
			secondsAgos,
			this.tick,
			this.index,
			this.liquidity,
			this.cardinality,
		);
	}

	module: DexModule;
	observationStore: ObservationStore;
	context: MutableSwapContext;
	poolAddress: Buffer;

	time: Uint32String = '0';
	tick: Int24String = '0';
	liquidity: Uint128String = '0';
	index: Uint16String = '0';
	cardinality: Uint16String = '0';
	cardinalityNext: Uint16String = '0';
}

export function checkObservationEquals(
	{
		tickCumulative,
		blockTimestamp,
		initialized,
		secondsPerLiquidityCumulativeX128,
	}: {
		tickCumulative: string;
		secondsPerLiquidityCumulativeX128: string;
		initialized: boolean;
		blockTimestamp: string;
	},
	expected: {
		tickCumulative: string;
		secondsPerLiquidityCumulativeX128: string;
		initialized: boolean;
		blockTimestamp: string;
	},
) {
	expect({
		initialized,
		blockTimestamp,
		tickCumulative: tickCumulative.toString(),
		secondsPerLiquidityCumulativeX128: secondsPerLiquidityCumulativeX128.toString(),
	}).toStrictEqual({
		...expected,
		tickCumulative: expected.tickCumulative.toString(),
		secondsPerLiquidityCumulativeX128: expected.secondsPerLiquidityCumulativeX128.toString(),
	});
}
