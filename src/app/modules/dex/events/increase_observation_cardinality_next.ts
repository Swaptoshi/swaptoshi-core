import { BaseEvent } from 'klayr-sdk';
import { increaseObservationCardinalityNextEventSchema } from '../schema/events/increase_observation_cardinality_next';

export interface IncreaseObservationCardinalityNextEventData {
	observationCardinalityNextOld: string;
	observationCardinalityNextNew: string;
}

export class IncreaseObservationCardinalityNextEvent extends BaseEvent<IncreaseObservationCardinalityNextEventData> {
	public schema = increaseObservationCardinalityNextEventSchema;
}
