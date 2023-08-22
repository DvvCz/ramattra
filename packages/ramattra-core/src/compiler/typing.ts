export type Type =
	{ kind: "any" }
	| { kind: "never" }
	| { kind: "number" }
	| { kind: "string" }
	| { kind: "boolean" }
	| { kind: "array", item: Type }
	| { kind: "function", params: Type[], ret: Type }
	| { kind: "variadic", type: Type }
	| { kind: "generic", name: string, bound: Type }

export const any = <Type>{ kind: "any" };
export const never = <Type>{ kind: "never" };
export const number = <Type>{ kind: "number" };
export const string = <Type>{ kind: "string" };
export const boolean = <Type>{ kind: "boolean" };
export const array = (item: Type) => <Type>{ kind: "array", item };
export const fn = (params?: Type[], ret?: Type) => <Type>{ kind: "function", params, ret };
export const variadic = (type?: Type) => <Type>{ kind: "variadic", type };
export const generic = (name: string, bound?: Type) => <Type>{ kind: "generic", name, bound };

export class TypeSolver {
	private generics = new Map<string, Type>();

	constructor() { }

	getGeneric(name: string) {
		return this.generics.get(name);
	}

	setGeneric(name: string, type: Type) {
		this.generics.set(name, type);
	}

	/**
	 * Returns if right side satisfies type constraints of left side.
	 */
	satisfies(lhs: Type, rhs: Type): boolean {
		if (lhs.kind == "any")
			return true;

		if (lhs.kind == "function" && rhs.kind == "function") {
			for (const [k, l_param] of lhs.params.entries()) {
				const r_param = rhs.params[k];

				if (!r_param || !this.satisfies(l_param, r_param))
					return false;
			}

			for (const [k, r_param] of rhs.params.entries()) {
				const l_param = lhs.params[k];

				if (!l_param || !this.satisfies(l_param, r_param))
					return false;
			}

			if (!lhs.ret) {
				return !rhs.ret;
			} else {
				return rhs.ret && this.satisfies(lhs.ret, rhs.ret);
			}
		} else if (lhs.kind == "variadic") {
			return this.satisfies(lhs.type, rhs)
		} else if (lhs.kind == "array" && rhs.kind == "array") {
			return this.satisfies(lhs.item, rhs.item);
		} else if (lhs.kind == "generic") {
			if (rhs.kind == "generic") {
				if (lhs.name != rhs.name)
					return false;

				if (lhs.bound) {
					const ty = this.generics.get(rhs.name);
					if (!ty)
						throw `Undefined generic ${rhs.name} while solving`;

					if (!this.satisfies(lhs.bound, ty))
						return false;
				}

				if (rhs.bound) {
					const ty = this.generics.get(lhs.name);
					if (!ty)
						throw `Undefined generic ${lhs.name} while solving`;

					if (!this.satisfies(rhs.bound, ty))
						return false;
				}

				return true;
			} else {
				const ty = this.generics.get(lhs.name);
				if (ty) {
					return this.satisfies(ty, rhs);
				} else {
					// lhs generic has not been set.
					if (lhs.bound && !this.satisfies(lhs.bound, rhs))
						return false;

					this.generics.set(lhs.name, rhs);
					return true;
				}
			}
		}

		return lhs.kind == rhs.kind;
	}
}