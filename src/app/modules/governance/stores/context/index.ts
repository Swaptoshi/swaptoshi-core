/* eslint-disable @typescript-eslint/no-explicit-any */
import { BlockExecuteContext, CommandExecuteContext, ImmutableMethodContext, MethodContext, ModuleEndpointContext, TransactionExecuteContext, TransactionVerifyContext } from 'klayr-sdk';
import { ImmutableGovernanceContext, MutableGovernanceContext } from '../../types';

export function commandGovernanceContext(context: CommandExecuteContext<any>): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableTransactionHookGovernanceContext(context: TransactionExecuteContext): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableBlockHookGovernanceContext(context: BlockExecuteContext): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function immutableTransactionHookGovernanceContext(context: TransactionVerifyContext): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function methodGovernanceContext(context: MethodContext, senderAddress: Buffer, timestamp: number, height: number): MutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function immutableMethodGovernanceContext(context: ImmutableMethodContext, senderAddress: Buffer, timestamp: number, height: number): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function endpointGovernanceContext(context: ModuleEndpointContext): ImmutableGovernanceContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}
