import { TokenCreateCommand } from '../../../../../src/app/modules/token_factory/commands/token_create_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('TokenCreateCommand', () => {
	let module: TokenFactoryModule;
	let command: TokenCreateCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new TokenCreateCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('tokenCreate');
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
