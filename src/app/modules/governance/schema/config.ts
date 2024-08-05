import { GovernanceModuleConfig, TypedSchema } from '../types';

export const configSchema: TypedSchema<GovernanceModuleConfig> = {
	$id: '/governance/config',
	type: 'object',
	required: [
		'proposalCreationMinBalance',
		'proposalCreationDeposit',
		'maxProposalActions',
		'votingDelayDuration',
		'voteDuration',
		'quorumDuration',
		'executionDuration',
		'quorumPercentage',
		'quorumMode',
		'depositPoolAddress',
		'enableTurnoutBias',
		'enableBoosting',
		'maxBoostDuration',
		'boostFactor',
		'treasuryAddress',
		'treasuryReward',
		'minTransactionFee',
		'baseFee',
	],
	properties: {
		proposalCreationMinBalance: {
			dataType: 'string',
			fieldNumber: 1,
		},
		proposalCreationDeposit: {
			dataType: 'string',
			fieldNumber: 2,
		},
		maxProposalActions: {
			dataType: 'sint32',
			fieldNumber: 3,
		},
		votingDelayDuration: {
			dataType: 'uint32',
			fieldNumber: 4,
		},
		voteDuration: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		quorumDuration: {
			dataType: 'uint32',
			fieldNumber: 6,
		},
		executionDuration: {
			dataType: 'uint32',
			fieldNumber: 7,
		},
		quorumPercentage: {
			dataType: 'uint32',
			fieldNumber: 8,
		},
		quorumMode: {
			dataType: 'uint32',
			fieldNumber: 9,
		},
		depositPoolAddress: {
			dataType: 'string',
			fieldNumber: 10,
		},
		enableTurnoutBias: {
			dataType: 'boolean',
			fieldNumber: 11,
		},
		enableBoosting: {
			dataType: 'boolean',
			fieldNumber: 12,
		},
		maxBoostDuration: {
			dataType: 'uint32',
			fieldNumber: 13,
		},
		boostFactor: {
			dataType: 'uint32',
			fieldNumber: 14,
		},
		treasuryAddress: {
			dataType: 'string',
			fieldNumber: 15,
		},
		treasuryReward: {
			type: 'object',
			fieldNumber: 16,
			required: ['tokenID', 'offset', 'distance', 'mintBracket', 'blockRewardTaxBracket'],
			properties: {
				tokenID: {
					dataType: 'string',
					fieldNumber: 1,
					format: 'hex',
					minLength: 16,
					maxLength: 16,
				},
				offset: {
					dataType: 'uint32',
					fieldNumber: 2,
					minimum: 1,
				},
				distance: {
					dataType: 'uint32',
					fieldNumber: 3,
					minimum: 1,
				},
				mintBracket: {
					type: 'array',
					fieldNumber: 4,
					items: {
						dataType: 'string',
					},
				},
				blockRewardTaxBracket: {
					type: 'array',
					fieldNumber: 5,
					items: {
						dataType: 'string',
					},
				},
			},
		},
		minTransactionFee: {
			type: 'object',
			fieldNumber: 17,
			required: ['createProposal', 'vote', 'boostVote', 'delegateVote', 'revokeDelegatedVote', 'setProposalAttributes'],
			properties: {
				createProposal: {
					dataType: 'string',
					fieldNumber: 1,
				},
				vote: {
					dataType: 'string',
					fieldNumber: 2,
				},
				boostVote: {
					dataType: 'string',
					fieldNumber: 3,
				},
				delegateVote: {
					dataType: 'string',
					fieldNumber: 4,
				},
				revokeDelegatedVote: {
					dataType: 'string',
					fieldNumber: 5,
				},
				setProposalAttributes: {
					dataType: 'string',
					fieldNumber: 6,
				},
			},
		},
		baseFee: {
			type: 'object',
			fieldNumber: 18,
			required: ['createProposal', 'vote', 'boostVote', 'delegateVote', 'revokeDelegatedVote', 'setProposalAttributes'],
			properties: {
				createProposal: {
					dataType: 'string',
					fieldNumber: 1,
				},
				vote: {
					dataType: 'string',
					fieldNumber: 2,
				},
				boostVote: {
					dataType: 'string',
					fieldNumber: 3,
				},
				delegateVote: {
					dataType: 'string',
					fieldNumber: 4,
				},
				revokeDelegatedVote: {
					dataType: 'string',
					fieldNumber: 5,
				},
				setProposalAttributes: {
					dataType: 'string',
					fieldNumber: 6,
				},
			},
		},
	},
};
