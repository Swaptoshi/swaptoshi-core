import { TokenBurnCommand } from '../../../../../src/app/modules/token_factory/commands/token_burn_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('TokenBurnCommand', () => {
	let module: TokenFactoryModule;
	let command: TokenBurnCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new TokenBurnCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('tokenBurn');
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
