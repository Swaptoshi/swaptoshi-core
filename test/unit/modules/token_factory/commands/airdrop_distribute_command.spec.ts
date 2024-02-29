import { AirdropDistributeCommand } from '../../../../../src/app/modules/token_factory/commands/airdrop_distribute_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('AirdropDistributeCommand', () => {
	let module: TokenFactoryModule;
	let command: AirdropDistributeCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new AirdropDistributeCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('AirdropDistribute');
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
