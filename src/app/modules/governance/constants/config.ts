import { cryptography } from 'klayr-sdk';
import { GovernanceModuleConfig, QuorumMode } from '../types';
import { DEFAULT_TREASURY_ADDRESS } from './address';

export const DEFAULT_VOTE_DURATION_DAY = 28;
export const DEFAULT_MAX_BOOST_DURATION_DAY = 720;

const BLOCK_TIME = 3;
const DEFAULT_VOTE_DURATION = (DEFAULT_VOTE_DURATION_DAY * 24 * 3600) / BLOCK_TIME; // default block time will be retrieved at beforeConfigInit() hook
const MAX_BOOST_DURATION = (DEFAULT_MAX_BOOST_DURATION_DAY * 24 * 3600) / BLOCK_TIME; // default block time will be retrieved at beforeConfigInit() hook
const TREASURY_ADDRESS = cryptography.address.getKlayr32AddressFromAddress(DEFAULT_TREASURY_ADDRESS);

export const defaultConfig: GovernanceModuleConfig = {
	governGovernanceConfig: true,
	proposalCreationMinBalance: (10000 * 10 ** 8).toString(),
	proposalCreationDeposit: (1000 * 10 ** 8).toString(),
	maxProposalActions: -1,
	votingDelayDuration: 0,
	voteDuration: DEFAULT_VOTE_DURATION,
	quorumDuration: DEFAULT_VOTE_DURATION,
	executionDuration: DEFAULT_VOTE_DURATION,
	quorumPercentage: 50000, // 5%
	quorumMode: QuorumMode.FOR_AGAINST_ABSTAIN,
	depositPoolAddress: TREASURY_ADDRESS,
	enableTurnoutBias: false,
	enableBoosting: false,
	maxBoostDuration: MAX_BOOST_DURATION,
	boostFactor: 2,
	treasuryAddress: TREASURY_ADDRESS,
	treasuryReward: {
		tokenID: '',
		offset: 1,
		distance: 1,
		blockRewardTaxBracket: [],
		mintBracket: [],
	},
	minTransactionFee: {
		createProposal: '0',
		vote: '0',
		boostVote: '0',
		delegateVote: '0',
		revokeDelegatedVote: '0',
		setProposalAttributes: '0',
	},
	baseFee: {
		createProposal: (10 * 10 ** 8).toString(),
		vote: '0',
		boostVote: '0',
		delegateVote: '0',
		revokeDelegatedVote: '0',
		setProposalAttributes: '0',
	},
};
