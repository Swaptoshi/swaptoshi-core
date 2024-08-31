import { BaseEvent } from 'klayr-sdk';

export interface Test1EventData {
	data: string;
}

export class Test1Event extends BaseEvent<Test1EventData> {
	public schema = {
		$id: 'test/event/1',
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
