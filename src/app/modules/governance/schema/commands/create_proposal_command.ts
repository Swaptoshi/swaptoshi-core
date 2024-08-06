import { CreateProposalParams, TypedSchema } from '../../types';

export const createProposalCommandSchema: TypedSchema<CreateProposalParams> = {
	$id: '/governance/command/create_proposal',
	type: 'object',
	required: ['title', 'summary', 'actions', 'attributes'],
	properties: {
		title: {
			dataType: 'string',
			fieldNumber: 1,
		},
		summary: {
			dataType: 'string',
			fieldNumber: 2,
		},
		actions: {
			type: 'array',
			fieldNumber: 3,
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
		attributes: {
			type: 'array',
			fieldNumber: 4,
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
