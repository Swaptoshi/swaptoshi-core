/* eslint-disable */
import { CollectTreasuryCommand } from '../../../../../src/app/modules/dex/commands/collect_treasury_command';
import { DexModule } from '../../../../../src/app/modules/dex/module';

describe('CollectTreasuryCommand', () => {
	let module: DexModule;
	let command: CollectTreasuryCommand;

	beforeEach(() => {
		module = new DexModule();
		command = new CollectTreasuryCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('collectTreasury');
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
