import Lexer from './Lexer';
import Token, {TokenType} from './Token';
import {
  QueryAllNode,
  QueryColumn,
  QueryCompareExp,
  QueryCompareOp,
  QueryExp,
  QueryIgnoreNode,
  QueryLogicExp,
  QueryLogicOp,
  QueryNestExp,
  QueryNode,
  QueryParam,
  QueryValue
} from './Node';

export default class Parser {
  private lexer: Lexer;
  private token: Token;
  constructor(orql: string) {
    this.lexer = new Lexer(orql);
    this.token = this.lexer.nextToken();
  }
  static parse(query: string) {
    const parser = new Parser(query);
    return parser.visit();
  }
  private matchToken(type: TokenType): string | undefined {
    if (this.token.type != type) throw new Error(`expect ${type} actual ${this.token.type}`);
    const string = this.token.string;
    this.walk();
    return string;
  }
  private matchString(string: string) {
    if (this.token.string != string) throw new Error('');
    this.walk();
  }
  private isToken(type: TokenType): boolean {
    return this.token.type == type;
  }
  private isString(string: String): boolean {
    return this.token.string == string;
  }
  private walk() {
    this.token = this.lexer.nextToken();
  }
  visit(): QueryNode {
    return this.visitItem();
  }
  private visitItems(): QueryNode[] {
    const items: QueryNode[] = [];
    while (true) {
      const item = this.visitItem();
      items.push(item);
      // ,
      if (! this.isToken(TokenType.Comma)) break;
      this.walk();
    }
    return items;
  }
  private visitItem(): QueryNode {
    if (this.isToken(TokenType.All)) {
      this.walk();
      return new QueryAllNode();
    }
    if (this.isToken(TokenType.Not)) {
      this.walk();
      const name = this.matchToken(TokenType.Name)!;
      return new QueryIgnoreNode(name);
    }
    const name = this.matchToken(TokenType.Name)!;
    let where: QueryExp | undefined;
    if (this.isToken(TokenType.OpenParen)) {
      // (
      this.walk();
      where = this.visitWhere();
      this.matchToken(TokenType.CloseParen);
    }
    let children: QueryNode[] = [];
    if (this.isToken(TokenType.Colon)) {
      // :
      this.walk();
      if (this.isToken(TokenType.OpenCurly)) {
        // {
        this.walk();
        children = this.visitItems();
        // }
        this.matchToken(TokenType.CloseCurly);
      }
    }
    return new QueryNode(name, children, where);
  }
  private visitWhere(): QueryExp | undefined {
    let exp: QueryExp | undefined;
    if (this.isString('(') || this.isToken(TokenType.Name)) {
      // 表达式以(或column开头
      exp = this.visitExp();
    }
    return exp;
  }
  private visitExp(): QueryExp {
    let tmp = this.visitExpTerm();
    while (this.isToken(TokenType.Or)) {
      this.walk();
      const exp = this.visitExp();
      tmp = new QueryLogicExp(tmp, QueryLogicOp.Or, exp);
    }
    return tmp;
  }
  private visitExpTerm(): QueryExp {
    let tmp = this.visitExpFactor();
    while (this.isToken(TokenType.And)) {
      this.walk();
      const term = this.visitExpTerm();
      tmp = new QueryLogicExp(tmp, QueryLogicOp.And, term);
    }
    return tmp;
  }
  private visitColumn(): QueryColumn {
    const name = this.matchToken(TokenType.Name)!;
    return new QueryColumn(name);
  }
  private visitCompareOp(): QueryCompareOp {
    if (this.isToken(TokenType.Eq)) {
      this.walk();
      return QueryCompareOp.Eq;
    } else if (this.isToken(TokenType.Gt)) {
      this.walk();
      return QueryCompareOp.Gt;
    } else if (this.isToken(TokenType.Ge)) {
      this.walk();
      return QueryCompareOp.Ge;
    } else if (this.isToken(TokenType.Lt)) {
      this.walk();
      return QueryCompareOp.Lt;
    } else if (this.isToken(TokenType.Le)) {
      this.walk();
      return QueryCompareOp.Le;
    } else if (this.isString('like')) {
      this.walk();
      return QueryCompareOp.Like;
    } else if (this.isToken(TokenType.Ne)) {
      this.walk();
      return QueryCompareOp.Ne;
    }
    throw new Error('expect compare op');
  }
  private visitExpFactor(): QueryExp {
    if (this.isToken(TokenType.OpenParen)) {
      // (
      this.walk();
      const exp = this.visitExp();
      this.matchToken(TokenType.CloseParen);
      return new QueryNestExp(exp);
    }
    const column = this.visitColumn();
    const op = this.visitCompareOp();
    const right = this.visitRight();
    return new QueryCompareExp(column, op, right);
  }
  private visitRight(): QueryParam | QueryValue | QueryColumn {
    if (this.isToken(TokenType.Name)) {
      return this.visitColumn();
    }
    if (this.isToken(TokenType.Param)) {
      const name = this.token.string!;
      this.walk();
      return new QueryParam(name);
    }
    if (this.isToken(TokenType.Int)) {
      const string = this.token.string!;
      this.walk();
      return new QueryValue(parseInt(string));
    }
    if (this.isToken(TokenType.Float)) {
      const string = this.token.string!;
      this.walk();
      return new QueryValue(parseFloat(string));
    }
    if (this.isToken(TokenType.String)) {
      const string = this.token.string!;
      this.walk();
      return new QueryValue(string);
    }
    if (this.isToken(TokenType.True)) {
      this.walk();
      return new QueryValue(true);
    }
    if (this.isToken(TokenType.False)) {
      this.walk();
      return new QueryValue(false);
    }
    if (this.isToken(TokenType.Null)) {
      this.walk();
      return new QueryValue(null);
    }
    if (this.isToken(TokenType.Hyphen)) {
      this.walk();
      const value = this.visitRight() as QueryValue;
      value.value = -value.value;
      return value;
    }
    throw new Error('');
  }
}