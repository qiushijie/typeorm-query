import Parser from '../src/Parser';
import {
  QueryAllNode,
  QueryCompareExp,
  QueryCompareOp,
  QueryIgnoreNode,
  QueryLogicExp, QueryLogicOp, QueryNestExp,
  QueryParam,
  QueryValue
} from '../src/Node';

test('test root', () => {
  const item = Parser.parse(`user : {id, name}`);
  expect(item.name).toBe('user');
  expect(item.children!.length).toBe(2);
});

test('test children', () => {
  const item = Parser.parse('user : {*, !password}');
  const [allItem, passwordItem] = item.children!;
  expect(allItem instanceof QueryAllNode).toBeTruthy();
  expect(passwordItem instanceof QueryIgnoreNode).toBeTruthy();
  expect(passwordItem.name).toBe('password');
});

test('test manyToOne', () => {
  const item = Parser.parse('user : {id, name, role : {id, name}}');
  const roleItem = item.children![2];
  expect(roleItem.name).toBe('role');
  expect(roleItem.children!.length).toBe(2);
});

test('test exp eq param', () => {
  const exp = Parser.parse('user(id = $id) : {*, !password}').where as QueryCompareExp;
  expect(exp.left.name).toBe('id');
  expect(exp.op).toBe(QueryCompareOp.Eq);
  expect((exp.right as QueryParam).name).toBe('id');
});

test('test exp eq value', () => {
  type LiteralAndValue = {literal: string, value: any};
  const values: LiteralAndValue[] = [
    {literal: 'true', value: true},
    {literal: 'false', value: false},
    {literal: '1', value: 1},
    {literal: 'null', value: null},
    {literal: `"str"`, value: 'str'},
    {literal: `'str'`, value: 'str'},
    {literal: `'st\\'r'`, value: `st'r`},
    {literal: '1.1', value: 1.1},
    {literal: '-1', value: -1}];
  for (const lv of values) {
    const exp = Parser.parse(`user(id = ${lv.literal}) : {*, !password}`).where as QueryCompareExp;
    expect((exp.right as QueryValue).value).toBe(lv.value);
  }
});

test('test exp logic', () => {
  const andExp = Parser.parse('user(id = 1 && name = 2) : {*, !password}').where as QueryLogicExp;
  expect(andExp.op).toBe(QueryLogicOp.And);

  const andLeftExp = andExp.left as QueryCompareExp;
  const andRightExp = andExp.right as QueryCompareExp;

  expect(andLeftExp.left.name).toBe('id');
  expect(andLeftExp.op).toBe(QueryCompareOp.Eq);
  expect((andLeftExp.right as QueryValue).value).toBe(1);

  expect(andRightExp.left.name).toBe('name');
  expect(andRightExp.op).toBe(QueryCompareOp.Eq);
  expect((andRightExp.right as QueryValue).value).toBe(2);

  const orExp = Parser.parse('user(id = 1 || name = 2) : {*, !password}').where as QueryLogicExp;
  expect(orExp.op).toBe(QueryLogicOp.Or);
});

test('test exp compare', () => {
  const arr = ['>', '<', '=', '>=', '<=', 'like', '!='];
  for (const c of arr) {
    const node = Parser.parse(`user(id ${c} 1)`);
    expect((node.where as QueryCompareExp).op).toBe(c);
  }
});

test('test exp logic priority', () => {
  const exp = Parser.parse('user(id = 1 && name = 2 || id = 3 && name = 4) : {*, !password}').where as QueryLogicExp;
  expect(exp.op).toBe(QueryLogicOp.Or);
  expect((exp.left as QueryLogicExp).op).toBe(QueryLogicOp.And);
  expect((exp.right as QueryLogicExp).op).toBe(QueryLogicOp.And);
});

test('test nest exp', () => {
  const query = 'user((id = $id)): {*}';
  const item = Parser.parse(query);
  expect(item.where instanceof QueryNestExp).toBeTruthy();
});

test('test param dot', () => {
  const query = 'user(id = $user.id)';
  const item = Parser.parse(query);
  expect(((item.where as QueryCompareExp).right as QueryParam).name).toBe('user.id');
});