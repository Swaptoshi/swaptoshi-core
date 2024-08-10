/* eslint-disable import/no-cycle */
import { BaseEvent } from 'klayr-sdk';
import { increaseObservationCardinalityNextEventSchema } from '../schema';

export interface IncreaseObservationCardinalityNextEventData {
	observationCardinalityNextOld: string;
	observationCardinalityNextNew: string;
}

export class IncreaseObservationCardinalityNextEvent extends BaseEvent<IncreaseObservationCardinalityNextEventData> {
	public schema = increaseObservationCardinalityNextEventSchema;
}
