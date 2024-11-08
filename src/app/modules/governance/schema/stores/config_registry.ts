import { ConfigRegistryStoreData, TypedSchema } from '../../types';

export const configRegistryStoreSchema: TypedSchema<ConfigRegistryStoreData> = {
	$id: '/governance/store/config_registry',
	type: 'object',
	required: ['registry'],
	properties: {
		registry: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['module', 'index'],
				properties: {
					module: {
						dataType: 'string',
						fieldNumber: 1,
					},
					index: {
						dataType: 'uint32',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
