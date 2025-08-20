import { dispatch } from '@/agent/actions/dispatcher';

export interface ParsedCommand {
  action: string;
  params?: any;
}

export async function runAgentCommand(cmd: ParsedCommand) {
  return dispatch(cmd.action, cmd.params);
}
