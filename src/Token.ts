export enum TokenType {
  // name
  Name = 'name',
  // *
  All = '*',
  // :
  Colon = ':',
  // {
  OpenCurly = '{',
  // }
  CloseCurly = '}',
  // (
  OpenParen = '(',
  // )
  CloseParen = ')',
  // >
  Ge = '>',
  // >=
  Gt = '>=',
  // <,
  Lt = '<',
  // <=
  Le = '<=',
  // ==
  Eq = '=',
  // !=
  Ne = '!=',
  // &&
  And = '&&',
  // ||
  Or = '||',
  // like
  Like = 'like',
  // $name
  Param = 'param',
  // true,
  True = 'true',
  // false
  False = 'false',
  Int = 'int',
  Float = 'float',
  // string
  String = 'string',
  // null
  Null = 'null',
  // ,
  Comma = ',',
  // -
  Hyphen = '-',
  // !
  Not = '!',
  // end
  EOF = 'eof'
}

export default class Token {
  readonly type: TokenType;
  readonly string?: string;
  constructor(type: TokenType, string?: string) {
    this.type = type;
    this.string = string;
  }
}