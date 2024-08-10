import { JSONObject } from 'klayr-sdk';
import { GetProposalParams, TypedSchema, ProposalStoreData } from '../../types';

export const getProposalEndpointResponseSchema: TypedSchema<JSONObject<ProposalStoreData>> = {
	$id: '/governance/endpoint/response/getProposal',
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
			dataType: 'string',
			fieldNumber: 3,
		},
		author: {
			dataType: 'string',
			fieldNumber: 4,
		},
		turnout: {
			type: 'object',
			fieldNumber: 5,
			required: ['for', 'against', 'abstain'],
			properties: {
				for: {
					dataType: 'string',
					fieldNumber: 1,
				},
				against: {
					dataType: 'string',
					fieldNumber: 2,
				},
				abstain: {
					dataType: 'string',
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
				'quorumTreshold',
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
				quorumTreshold: {
					dataType: 'string',
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
					dataType: 'string',
					fieldNumber: 1,
				},
				against: {
					dataType: 'string',
					fieldNumber: 2,
				},
				abstain: {
					dataType: 'string',
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
						dataType: 'string',
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
						dataType: 'string',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};

export const getProposalEndpointRequestSchema: TypedSchema<GetProposalParams> = {
	$id: '/governance/endpoint/request/getProposal',
	type: 'object',
	required: ['proposalId'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
