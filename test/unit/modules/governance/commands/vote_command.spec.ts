/* eslint-disable */
import { GovernanceModule } from '../../../../../src/app/modules/governance';
import { VoteCommand } from '../../../../../src/app/modules/governance/commands/vote_command';

describe('VoteCommand', () => {
	let module: GovernanceModule;
	let command: VoteCommand;

	beforeEach(() => {
		module = new GovernanceModule();
		command = new VoteCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('vote');
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
