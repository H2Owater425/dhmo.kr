export class ShellCommand {
	#handler: (_arguments: string[]) => Promise<void> | void;
	#usage: string;
	#description: string[];

	constructor(handler: (_arguments: string[]) => Promise<void> | void, usage: string, description: string[]) {
		if(typeof(handler) === 'function' && typeof(usage) === 'string' && Array.isArray(description)) {
			this.#handler = handler;
			this.#usage = usage;
			this.#description = description;
		} else {
			throw new Error('command');
		}
	}

	get handler(): (_arguments: string[]) => Promise<void> | void {
		return this.#handler;
	}

	get usage(): string {
		return this.#usage;
	}

	get description(): string[] {
		return this.#description;
	}
}