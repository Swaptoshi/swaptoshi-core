import { ProposalQueueStoreData, TypedSchema } from '../../types';

export const proposalQueueStoreSchema: TypedSchema<ProposalQueueStoreData> = {
	$id: '/governance/store/queue',
	type: 'object',
	required: ['ends', 'execute'],
	properties: {
		ends: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'bytes',
			},
		},
		execute: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'bytes',
			},
		},
	},
};
