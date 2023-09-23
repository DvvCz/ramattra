export type Type =
	{ kind: "native", name: string } |
	{ kind: "array", item: Type } |
	{ kind: "function", params: Type[], ret: Type } |
	{ kind: "variadic", type: Type } |
	{ kind: "generic", name: string, bound?: Type } |
	{ kind: "union", types: Type[] }

export const reprType = (ty: Type): string => {
	switch (ty.kind) {
		case "native":
			return ty.name;
		case "array":
			return `${reprType(ty.item)}[]`;
		case "function":
			return ty.ret ? `fn(${ty.params.map(reprType).join(", ")}): ${reprType(ty.ret)}` : `fn(${ty.params.map(reprType).join(", ")})`;
		case "union":
			return ty.types.map(reprType).join("|")
		case "generic":
			return ty.bound ? `<${ty.name}: ${reprType(ty.bound)}>` : `<${ty.name}>`
		case "variadic":
			return `...${reprType(ty.type)}`
	}
}

export const native = (name: string) => (<Type>{ kind: "native", name });
export const nothing = native("void");
export const any = native("any");
export const never = native("never");
export const number = native("number");
export const string = native("string");
export const boolean = native("boolean");
export const array = (item: Type) => (<Type>{ kind: "array", item });
export const fn = (params?: Type[], ret?: Type) => (<Type>{ kind: "function", params: params ?? [], ret: ret ?? nothing });
export const variadic = (type: Type) => (<Type>{ kind: "variadic", type });
export const generic = (name: string, bound?: Type) => (<Type>{ kind: "generic", name, bound });
export const union = (...types: Type[]) => (<Type>{ kind: "union", types });

export class TypeSolver {
	generics = new Map<string, Type>();

	constructor() { }

	deleteGeneric(name: string) {
		this.generics.delete(name);
	}

	getGeneric(name: string) {
		return this.generics.get(name);
	}

	setGeneric(name: string, type: Type) {
		this.generics.set(name, type);
	}

	resolve(ty: Type): Type {
		if (ty.kind == "generic") {
			return this.generics.get(ty.name) ?? ty;
		}

		return ty;
	}

	/**
	 * Returns if right side satisfies type constraints of left side.
	 */
	satisfies(lhs: Type, rhs: Type): boolean {
		lhs = this.resolve(lhs);
		rhs = this.resolve(rhs);

		if (lhs.kind == "native" && lhs.name == "any")
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
		} else if (lhs.kind == "union") {
			if (rhs.kind == "union") {
				// number | string -> number | string | boolean (false)
				// number | string -> number | string (true)
				return rhs.types.every(ty => this.satisfies(ty, lhs));
			} else {
				return lhs.types.some(ty => this.satisfies(ty, rhs));
			}
		} else if (lhs.kind == "native" && rhs.kind == "native") {
			return lhs.name == rhs.name;
		}

		return lhs.kind == rhs.kind;
	}
}