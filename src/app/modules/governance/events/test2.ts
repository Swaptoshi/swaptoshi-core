import { BaseEvent } from 'klayr-sdk';

export interface Test2EventData {
	data: string;
}

export class Test2Event extends BaseEvent<Test2EventData> {
	public schema = {
		$id: 'test/event/2',
		type: 'object',
		required: ['data'],
		properties: {
			data: {
				dataType: 'string',
				fieldNumber: 1,
			},
		},
	};
}
