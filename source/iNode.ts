export class INode {
	#permission: number;
	#owner: string;
	#group: string;
	#access: number = Date.now();
	#modify: number = this.#access;
	#isFile: boolean;
	#childs?: Map<string, INode>;
	#content?: string;

	static getNormalizedPaths(path: string, pwd: string): string[] {
		if(typeof(path) === 'string') {
			switch(path) {
				case '.':
				case '..': {
					path = pwd + '/' + path;

					break;
				}

				case '~': {
					path = '/root';

					break;
				}

				default: {
					switch(path[0]) {
						case '~': {

						}

						case '.': {

						}

						default: {
							if(path[0] !== '/') {
								path = pwd + '/' + path;
							}
						}
					}



					if(path[0] === '~' && path[1] === '/') {
						path = '/root/' + path.slice(2);
					} else if(path[0] === '.' && (path[1] === '/' || path[1] === '.' && path[2] === '/') || path[0] !== '/') {
						path = pwd + '/' + path;
					}
				}
			}

			if(path[path['length'] - 1] !== '/') {
				path += '/';
			}

			const paths: string[] = [];

			let currentIndex: number = 1;
			let nextIndex: number = path.indexOf('/', 1);

			while(nextIndex !== -1) {
				const currentPath: string = path.slice(currentIndex, nextIndex);

				switch(currentPath) {
					case '.':
					case '': {
						break;
					}

					case '..': {
						paths.pop();

						break;
					}

					default: {
						paths.push(currentPath);
					}
				}

				currentIndex = nextIndex + 1;
				nextIndex = path.indexOf('/', currentIndex);
			}

			return paths;
		} else {
			throw 1;
		}
	}

	constructor(owner: string, group: string, isFile: boolean = true) {
		this.#owner = owner;
		this.#group = group;


		if(typeof(isFile) === 'boolean') {
			this.#isFile = isFile;
		} else {
			throw 1;
		}

		if(isFile) {
			this.#content = '';
			this.#permission = 0b110110110;
		} else {
			this.#childs = new Map<string, INode>();
			this.#permission = 0b111111111;
		}
	}

	get size(): number {
		if(this.#isFile) {
			return (this.#content as string)['length'];
		} else {
			let size: number = 0;

			for(const iNode of (this.#childs as Map<string, INode>).values()) {
				size += iNode['size'];
			}

			return size;
		}
	}

	get permission(): number {
		return this.#permission;
	}

	set permission(permission: number) {
		if(permission <= 0b111111111) {
			this.#permission = permission;
		} else {
			throw 1;
		}
	}

	get content(): string {
		if(this.#isFile) {
			this.#access = Date.now();

			return this.#content as string;
		} else {
			throw 1;
		}
	}

	set content(content: string) {
		if(this.#isFile && typeof(content) === 'string') {
			this.#modify = Date.now();
			this.#content = content;

			return;
		} else {
			throw 1;
		}
	}

	get owner(): string {
		return this.#owner;
	}

	set owner(owner) {
		if(typeof(owner) === 'string' && owner['length'] !== 0) {
			this.#owner = owner;

			return;
		} else {
			throw 1;
		}
	}

	get group(): string {
		return this.#group;
	}

	set group(group) {
		if(typeof(group) === 'string' && group['length'] !== 0) {
			this.#group = group;

			return;
		} else {
			throw 1;
		}
	}

	get access(): number {
		return this.#access;
	}

	get modify(): number {
		return this.#modify;
	}

	get childs(): IterableIterator<[string, INode]> {
		if(!this.#isFile) {
			return (this.#childs as Map<string, INode>).entries();
		} else {
			throw 1;
		}
	}

	get isFile(): boolean {
		return this.#isFile;
	}

	public mkdir(name: string, owner: string, group: string): INode {
		if(!this.#isFile && !(this.#childs as Map<string, INode>).has(name)) {
			const directory: INode = new INode(owner, group, false);

			(this.#childs as Map<string, INode>).set(name, directory);

			return directory;
		} else {
			throw 1;
		}
	}

	public touch(name: string, owner: string, group: string): INode {
		if(!this.#isFile && !(this.#childs as Map<string, INode>).has(name)) {
			const file: INode = new INode(owner, group, true);

			(this.#childs as Map<string, INode>).set(name, file);

			return file;
		} else {
			throw 1;
		}
	}

	public rm(name: string): void {
		if(!this.#isFile && (this.#childs as Map<string, INode>).delete(name)) {
			return;
		} else {
			throw 1;
		}
	}

	public find(names: string[]): INode | undefined {
		if(!this.#isFile) {
			if(names['length'] !== 0) {
				const iNode: INode | undefined = (this.#childs as Map<string, INode>).get(names.shift() as string);

				if(!this.#isFile && typeof(iNode) !== 'undefined') {
					return iNode.find(names);
				} else {
					return;
				}
			} else {
				return this;
			}
		} else {
			throw 1;
		}
	}
}