import { ConfigActionPayload, TypedSchema } from '../../types';

export const configActionPayloadSchema: TypedSchema<ConfigActionPayload> = {
	$id: '/governance/action/config',
	type: 'object',
	required: ['moduleName', 'paramPath', 'value'],
	properties: {
		moduleName: {
			dataType: 'string',
			fieldNumber: 1,
		},
		paramPath: {
			dataType: 'string',
			fieldNumber: 2,
		},
		value: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
	},
};
