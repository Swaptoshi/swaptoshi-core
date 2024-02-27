import { IcoExactInputSingleCommand } from '../../../../../src/app/modules/token_factory/commands/ico_exact_input_single_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('IcoExactInputSingleCommand', () => {
	let module: TokenFactoryModule;
	let command: IcoExactInputSingleCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new IcoExactInputSingleCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('icoExactInputSingle');
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
