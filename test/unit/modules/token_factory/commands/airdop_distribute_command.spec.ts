import { AirdopDistributeCommand } from '../../../../../src/app/modules/token_factory/commands/airdop_distribute_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('AirdopDistributeCommand', () => {
	let module: TokenFactoryModule;
	let command: AirdopDistributeCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new AirdopDistributeCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('airdopDistribute');
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
