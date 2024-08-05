import { GovernanceModuleConfig, TypedSchema } from '../types';

export const configSchema: TypedSchema<GovernanceModuleConfig> = {
	$id: '/governance/config',
	type: 'object',
	required: [
		'proposalCreationMinBalance',
		'proposalCreationFee',
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
	],
	properties: {
		proposalCreationMinBalance: {
			dataType: 'string',
			fieldNumber: 1,
		},
		proposalCreationFee: {
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
		quorumPercentage: {
			dataType: 'uint32',
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
	},
};
