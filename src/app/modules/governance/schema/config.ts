import { GovernableConfigSchema, GovernanceModuleConfig } from '../types';

export const configSchema: GovernableConfigSchema<GovernanceModuleConfig> = {
	$id: '/governance/config',
	type: 'object',
	required: [
		'governGovernanceConfig',
		'proposalCreationMinBalance',
		'proposalCreationDeposit',
		'maxProposalActions',
		'votingDelayDuration',
		'voteDuration',
		'quorumDuration',
		'executionDuration',
		'quorumTreshold',
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
		governGovernanceConfig: {
			dataType: 'boolean',
			governable: false,
			fieldNumber: 1,
		},
		proposalCreationMinBalance: {
			dataType: 'string',
			fieldNumber: 2,
		},
		proposalCreationDeposit: {
			dataType: 'string',
			fieldNumber: 3,
		},
		maxProposalActions: {
			dataType: 'sint32',
			fieldNumber: 4,
		},
		votingDelayDuration: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		voteDuration: {
			dataType: 'uint32',
			fieldNumber: 6,
		},
		quorumDuration: {
			dataType: 'uint32',
			fieldNumber: 7,
		},
		executionDuration: {
			dataType: 'uint32',
			fieldNumber: 8,
		},
		quorumTreshold: {
			dataType: 'string',
			fieldNumber: 9,
		},
		quorumMode: {
			dataType: 'uint32',
			fieldNumber: 10,
		},
		depositPoolAddress: {
			dataType: 'string',
			fieldNumber: 11,
		},
		enableTurnoutBias: {
			dataType: 'boolean',
			fieldNumber: 12,
		},
		enableBoosting: {
			dataType: 'boolean',
			fieldNumber: 13,
		},
		maxBoostDuration: {
			dataType: 'uint32',
			fieldNumber: 14,
		},
		boostFactor: {
			dataType: 'uint32',
			fieldNumber: 15,
		},
		treasuryAddress: {
			dataType: 'string',
			fieldNumber: 16,
		},
		treasuryReward: {
			type: 'object',
			fieldNumber: 17,
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
		baseFee: {
			type: 'object',
			fieldNumber: 19,
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
