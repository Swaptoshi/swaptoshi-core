import { BaseStore } from 'klayr-sdk';

export interface TestStoreData {
	test: { id: number; data: string }[];
}

export class TestStore extends BaseStore<TestStoreData> {
	public schema = {
		$id: 'test/store',
		type: 'object',
		required: ['test'],
		properties: {
			test: {
				type: 'array',
				fieldNumber: 1,
				items: {
					type: 'object',
					required: ['id', 'data'],
					properties: {
						id: {
							dataType: 'uint32',
							fieldNumber: 1,
						},
						data: {
							dataType: 'string',
							fieldNumber: 2,
						},
					},
				},
			},
		},
	};
}
