/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateMachine, Types } from 'klayr-sdk';
import { ImmutableGovernanceContext, MutableGovernanceContext } from '../../types';

export function commandGovernanceContext(context: StateMachine.CommandExecuteContext<any>): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		height: context.header.height,
	};
}

export function mutableTransactionHookGovernanceContext(context: StateMachine.TransactionExecuteContext): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		height: context.header.height,
	};
}

export function mutableBlockHookGovernanceContext(context: StateMachine.BlockExecuteContext): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		height: context.header.height,
	};
}

export function immutableTransactionHookGovernanceContext(context: StateMachine.TransactionVerifyContext): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		height: context.header.height,
	};
}

export function methodGovernanceContext(context: StateMachine.MethodContext, senderAddress: Buffer, height: number): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress,
		height,
	};
}

export function immutableMethodGovernanceContext(context: StateMachine.ImmutableMethodContext, senderAddress: Buffer, height: number): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress,
		height,
	};
}

export function endpointGovernanceContext(context: Types.ModuleEndpointContext): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		height: context.header.height,
	};
}
