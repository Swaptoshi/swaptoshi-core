/* eslint-disable */
import { GovernanceModule } from '../../../../../src/app/modules/governance';
import { RevokeDelegatedVoteCommand } from '../../../../../src/app/modules/governance/commands/revoke_delegated_vote_command';

describe('RevokeDelegatedVoteCommand', () => {
	let module: GovernanceModule;
	let command: RevokeDelegatedVoteCommand;

	beforeEach(() => {
		module = new GovernanceModule();
		command = new RevokeDelegatedVoteCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('revokeDelegatedVote');
		});

		it('should have valid schema', () => {
			expect(command.schema).toMatchSnapshot();
		});
	});

	describe('verify', () => {
		describe('schema validation', () => {
			it.todo('should throw errors for invalid schema');
			it.todo('should be ok for valid schema');
		});
	});

	describe('execute', () => {
		describe('valid cases', () => {
			it.todo('should update the state store');
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
