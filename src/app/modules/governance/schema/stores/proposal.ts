import { ProposalStoreData, TypedSchema } from '../../types';

export const proposalStoreSchema: TypedSchema<ProposalStoreData> = {
	$id: '/governance/store/proposal',
	type: 'object',
	required: ['title', 'summary', 'deposited', 'author', 'turnout', 'parameters', 'voteSummary', 'status', 'actions', 'attributes'],
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
		turnout: {
			type: 'object',
			fieldNumber: 5,
			required: ['for', 'against', 'abstain'],
			properties: {
				for: {
					dataType: 'uint64',
					fieldNumber: 1,
				},
				against: {
					dataType: 'uint64',
					fieldNumber: 2,
				},
				abstain: {
					dataType: 'uint64',
					fieldNumber: 3,
				},
			},
		},
		parameters: {
			type: 'object',
			fieldNumber: 6,
			required: [
				'createdHeight',
				'startHeight',
				'quorumHeight',
				'endHeight',
				'executionHeight',
				'maxBoostDuration',
				'boostFactor',
				'enableBoosting',
				'enableTurnoutBias',
				'quorumMode',
				'quorumPercentage',
			],
			properties: {
				createdHeight: {
					dataType: 'uint32',
					fieldNumber: 1,
				},
				startHeight: {
					dataType: 'uint32',
					fieldNumber: 2,
				},
				quorumHeight: {
					dataType: 'uint32',
					fieldNumber: 3,
				},
				endHeight: {
					dataType: 'uint32',
					fieldNumber: 4,
				},
				executionHeight: {
					dataType: 'uint32',
					fieldNumber: 5,
				},
				maxBoostDuration: {
					dataType: 'uint32',
					fieldNumber: 6,
				},
				boostFactor: {
					dataType: 'uint32',
					fieldNumber: 7,
				},
				enableBoosting: {
					dataType: 'boolean',
					fieldNumber: 8,
				},
				enableTurnoutBias: {
					dataType: 'boolean',
					fieldNumber: 9,
				},
				quorumMode: {
					dataType: 'uint32',
					fieldNumber: 10,
				},
				quorumPercentage: {
					dataType: 'uint32',
					fieldNumber: 11,
				},
			},
		},
		voteSummary: {
			type: 'object',
			fieldNumber: 7,
			required: ['for', 'against', 'abstain'],
			properties: {
				for: {
					dataType: 'uint64',
					fieldNumber: 1,
				},
				against: {
					dataType: 'uint64',
					fieldNumber: 2,
				},
				abstain: {
					dataType: 'uint64',
					fieldNumber: 3,
				},
			},
		},
		status: {
			dataType: 'uint32',
			fieldNumber: 8,
		},
		actions: {
			type: 'array',
			fieldNumber: 9,
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
			fieldNumber: 10,
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
