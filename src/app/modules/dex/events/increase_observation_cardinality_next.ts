/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { increaseObservationCardinalityNextEventSchema } from '../schema';

export interface IncreaseObservationCardinalityNextEventData {
	observationCardinalityNextOld: string;
	observationCardinalityNextNew: string;
}

export class IncreaseObservationCardinalityNextEvent extends Modules.BaseEvent<IncreaseObservationCardinalityNextEventData> {
	public schema = increaseObservationCardinalityNextEventSchema;
}
