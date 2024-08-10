import { ProposalQueueStoreData, TypedSchema } from '../../types';

export const proposalQueueStoreSchema: TypedSchema<ProposalQueueStoreData> = {
	$id: '/governance/store/queue',
	type: 'object',
	required: ['start', 'quorum', 'ends', 'execute'],
	properties: {
		start: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'uint32',
			},
		},
		quorum: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'uint32',
			},
		},
		ends: {
			type: 'array',
			fieldNumber: 3,
			items: {
				dataType: 'uint32',
			},
		},
		execute: {
			type: 'array',
			fieldNumber: 4,
			items: {
				dataType: 'uint32',
			},
		},
	},
};
