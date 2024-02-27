import { IcoCreateCommand } from '../../../../../src/app/modules/token_factory/commands/ico_create_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('IcoCreateCommand', () => {
	let module: TokenFactoryModule;
	let command: IcoCreateCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new IcoCreateCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('icoCreate');
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
