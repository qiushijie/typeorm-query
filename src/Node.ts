export class QueryNode {
  readonly name: string;
  readonly children?: QueryNode[];
  readonly where?: QueryExp;
  constructor(name: string, children?: QueryNode[], where?: QueryExp) {
    this.name = name;
    this.children = children;
    this.where = where;
  }
}

export class QueryAllNode extends QueryNode {
  constructor() {
    super('');
  }
}

export class QueryIgnoreNode extends QueryNode {
  constructor(name: string) {
    super(name);
  }
}

export class QueryExp {

}

/**
 * (exp)
 */
export class QueryNestExp extends QueryExp {
  readonly exp: QueryExp;
  constructor(exp: QueryExp) {
    super();
    this.exp = exp;
  }
}

/**
 * exp && exp
 * exp || exp
 */
export class QueryLogicExp extends QueryExp {
  readonly left: QueryExp;
  readonly op: QueryLogicOp;
  readonly right: QueryExp;
  constructor(left: QueryExp, op: QueryLogicOp, right: QueryExp) {
    super();
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

export enum QueryLogicOp {
  And = '&&',
  Or = '||'
}

/**
 * !exp
 */
export class QueryNotExp extends QueryExp {
  readonly exp: QueryExp;
  constructor(exp: QueryExp) {
    super();
    this.exp = exp;
  }
}

/**
 * column = column
 * column = '123'
 * column = $param
 */
export class QueryCompareExp extends QueryExp {
  readonly left: QueryColumn;
  readonly op: QueryCompareOp;
  readonly right: QueryValue | QueryColumn | QueryParam;
  constructor(left: QueryColumn, op: QueryCompareOp, right: QueryValue | QueryColumn | QueryColumn) {
    super();
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

export class QueryColumn {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class QueryValue {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class QueryNullValue extends QueryValue {
  constructor() {
    super(null);
  }
}

export class QueryParam {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
}


export enum QueryCompareOp {
  Ge = '>=',
  Gt = '>',
  Le = '<=',
  Lt = '<',
  Eq = '=',
  Ne = '!=',
  Like = 'like'
}

export enum QueryOrderSort {
  Asc = 'asc',
  Desc = 'desc'
}