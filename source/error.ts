export class ShellError extends Error {
	#message: string[];
	#code: number;

	constructor(message: string[] = [], code: number = 1) {
		super();

		this.#message = message;
		this.#code = code;
	}

	// @ts-expect-error
	get message(): string[] {
		return this.#message.slice();
	}

	get code(): number {
		return this.#code;
	}
}