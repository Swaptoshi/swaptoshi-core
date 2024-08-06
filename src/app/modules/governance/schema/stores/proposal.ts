import { ProposalStoreData, TypedSchema } from '../../types';

export const proposalStoreSchema: TypedSchema<ProposalStoreData> = {
	$id: '/governance/store/proposal',
	type: 'object',
	required: ['title', 'summary', 'deposited', 'author', 'createdHeight', 'status', 'actions', 'votes', 'attributes'],
	properties: {
		title: {
			dataType: 'string',
			fieldNumber: 1,
		},
		summary: {
			dataType: 'string',
			fieldNumber: 2,
		},
		deposited: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
		author: {
			dataType: 'bytes',
			fieldNumber: 4,
		},
		createdHeight: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		status: {
			dataType: 'uint32',
			fieldNumber: 6,
		},
		actions: {
			type: 'array',
			fieldNumber: 7,
			items: {
				type: 'object',
				required: ['type', 'payload'],
				properties: {
					type: {
						dataType: 'string',
						fieldNumber: 1,
					},
					payload: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
		votes: {
			type: 'array',
			fieldNumber: 8,
			items: {
				type: 'object',
				required: ['address', 'votes'],
				properties: {
					address: {
						dataType: 'bytes',
						fieldNumber: 1,
					},
					votes: {
						dataType: 'uint32',
						fieldNumber: 2,
					},
				},
			},
		},
		attributes: {
			type: 'array',
			fieldNumber: 9,
			items: {
				type: 'object',
				required: ['key', 'data'],
				properties: {
					key: {
						dataType: 'string',
						fieldNumber: 1,
					},
					data: {
						dataType: 'bytes',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};
