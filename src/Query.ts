import {Connection, EntityMetadata, getConnection, ObjectLiteral, SelectQueryBuilder} from 'typeorm';
import {
  QueryAllNode,
  QueryColumn,
  QueryCompareExp,
  QueryExp, QueryIgnoreNode,
  QueryLogicExp,
  QueryLogicOp,
  QueryNestExp,
  QueryNode,
  QueryParam,
  QueryValue
} from './Node';
import Parser from './Parser';
import {firstToUpperCase} from './util';

interface QueryWrapper {
  node: QueryNode;
  path: string;
  meta: EntityMetadata;
}

export class Query<Entity = {}> {
  public static getConnection: () => Connection;
  private connection: Connection;
  private node: QueryNode;
  private queryBuilder: SelectQueryBuilder<Entity>;
  constructor(connection?: Connection) {
    if (connection) {
      this.connection = connection;
    } else if (Query.getConnection) {
      this.connection = Query.getConnection();
    } else {
      this.connection = getConnection();
    }
  }
  query(query: string): Query<Entity> {
    this.node = Parser.parse(query);
    const name = firstToUpperCase(this.node.name);
    const repository = this.connection.getRepository<Entity>(name);
    this.queryBuilder = repository.createQueryBuilder(this.node.name);
    return this;
  }
  limit(limit: number): Query<Entity> {
    this.queryBuilder.limit(limit);
    return this;
  }
  offset(offset: number): Query<Entity> {
    this.queryBuilder.offset(offset);
    return this;
  }
  param(key: string, value: any): Query<Entity> {
    this.queryBuilder.setParameter(key, value);
    return this;
  }
  params(params: ObjectLiteral): Query<Entity> {
    this.queryBuilder.setParameters(params);
    return this;
  }
  private fill() {
    const name = firstToUpperCase(this.node.name);
    const selection: string[] = [];
    const wrapper = {
      node: this.node,
      path: this.node.name,
      meta: this.connection.getMetadata(name)
    };
    const stack: QueryWrapper[] = [wrapper];
    while (stack.length > 0) {
      const {node, path, meta} = stack.pop()!;
      if (node.where) {
        this.queryBuilder.andWhere(Query.getExp(node.where, meta, path));
      }
      if (node.children && node.children.length > 0) {
        const childSelection = [];
        // *
        let queryAll = false;
        // !
        const ignoreSelection = [];
        for (const child of node.children) {
          if (child instanceof QueryAllNode) {
            queryAll = true;
            continue;
          }
          if (child instanceof QueryIgnoreNode) {
            ignoreSelection.push(child.name);
            continue;
          }
          // path.name用 . 来索引属性
          const propertyName = `${path}.${child.name}`;
          // 用 _ 来连接实体
          const childPath = `${path}_${child.name}`;
          // @JoinColumn 会变成column 通过 column.relationMetadata 属性排除
          const column = meta.columns.find(column => column.propertyName == child.name && !column.relationMetadata);
          if (column) {
            childSelection.push(propertyName);
            continue;
          }
          const relation = meta.relations.find(relation => relation.propertyName == child.name);
          if (relation) {
            // 属性 别名
            this.queryBuilder.leftJoinAndSelect(propertyName, childPath);
            const wrapper = {
              node: child,
              path: childPath,
              meta: relation.inverseEntityMetadata
            };
            stack.push(wrapper);
          }
        }
        if (queryAll) {
          for (const column of meta.columns) {
            if (column.relationMetadata) continue;
            if (ignoreSelection.indexOf(column.propertyName) >= 0) continue;
            if (childSelection.indexOf(column.propertyName) >= 0) continue;
            const propertyName = `${path}.${column.propertyName}`;
            childSelection.push(propertyName);
          }
        }
        selection.push(...childSelection);
      }
    }
    // console.log('selection', selection);
    this.queryBuilder.select(selection);
  }
  private static getExp(exp: QueryExp, meta: EntityMetadata, path: string): string {
    if (exp instanceof QueryLogicExp) {
      const left = Query.getExp(exp.left, meta, path);
      const right = Query.getExp(exp.right, meta, path);
      const op = exp.op == QueryLogicOp.And ? 'and' : 'or';
      return `${left} ${op} ${right}`;
    }
    if (exp instanceof QueryCompareExp) {
      const left = `${path}.${exp.left.name}`;
      let right: string = '';
      if (exp.right instanceof QueryColumn) {
        right = `${path}.${exp.right.name}`;
      } else if (exp.right instanceof QueryParam) {
        right = `:${exp.right.name}`;
      } else if (exp.right instanceof QueryValue) {
        right = `${exp.right.value}`;
      }
      return `${left} ${exp.op} ${right}`;
    }
    if (exp instanceof QueryNestExp) {
      return this.getExp(exp.exp, meta, path);
    }
    throw new Error('not support exp');
  }
  private static getRealPath(dotPath: string) {
    const arr = dotPath.split('.');
    const property = arr.pop();
    return  arr.join('_') + '.' + property;
  }
  orderBy(sort: string, order?: 'ASC' | 'DESC'): Query<Entity> {
    const path = Query.getRealPath(sort);
    this.queryBuilder.addOrderBy(path, order);
    return this;
  }
  getSql(): string {
    this.fill();
    return this.queryBuilder.getSql();
  }
  async getOne(): Promise<Entity | undefined> {
    this.fill();
    return await this.queryBuilder.getOne();
  }
  async getMany(): Promise<Entity[]> {
    this.fill();
    return await this.queryBuilder.getMany();
  }
  async getCount(): Promise<number> {
    this.fill();
    return await this.queryBuilder.getCount();
  }
}

export default function createTreeQueryBuilder<Entity = any>(connection?: Connection): Query<Entity> {
  return new Query<Entity>(connection);
}