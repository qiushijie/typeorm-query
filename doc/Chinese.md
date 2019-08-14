typeorm-query
---
基于select query bulider的类json和graphql的typeorm查询器，以简单的方式进行多级复杂查询和精确字段查询。

# 安装

在使用前必须已经安装[typeorm](https://github.com/typeorm/typeorm)，编写实体类和获取到connection。

```
npm install typeorm-query --save
```

# 使用


## 简单实例

```typescript
import createTreeQueryBuilder from 'typeorm-query';

const user = await createTreeQueryBuilder()
  .query('user(id = $id): {*}')
  .param('id', 1)
  .getOne();
```

对应的select query builder

```typescript
const user = await connection
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.id = :id', {id: 1})
  .select('user.id', 'user.firstName', 'user.lastName', 'user.isActive')
  .getOne();
```

## 创建和使用TreeQueryBuilder

* 使用默认连接

```typescript
createTreeQueryBuilder()
```

* 使用connection

```typescript
createTreeQueryBuilder(connection)
```
* 声明类型

```typescript
const user = await createTreeQueryBuilder<User>()
  .query('user: {*}')
  .getOne();
// 返回类型 Promise<User|undefined>
console.log('firstName', user!.firstName);
```
## Builder选项

* param

在查询语句中使用$最为前缀来表示一个参数，如$id表示名为id的参数。

通过param方法传入单个参数。

```typescript
createTreeQueryBuilder().param('id', id)
```

* params

通过params方法传入全部参数

```typescript
createTreeQueryBuilder().params({id: id})
```

* limit

```typescript
createTreeQueryBuilder().limit(limit)
```

* offset

```typescript
createTreeQueryBuilder().offset(offset)
```

* orderBy

column使用实体...实体.列名获取，如user.id或user.photos.id。

sort可为空，默认为ASC，可以使用DESC。

```typescript
createTreeQueryBuilder().orderBy(column, sort)
````

## 查询

* getOne

获取单个值。

```typescript
const user = await createTreeQueryBuilder()
  .query(query)
  .getOne();
```

* getMany

获取多个值，返回数组。

```typescript
const list = await createTreeQueryBuilder()
  .query(query)
  .getMany();
```

* getCount

获取结果集数量。

```typescript
const count = await createTreeQueryBuilder()
  .query(query)
  .getCount();
```

# 查询语句

## 语法

使用实体的树状结构描述需要查询的所有数据，与json语法类似，只需要键的部分，查询后把值按当前键的结构填充。

```typescript
实体名(条件): {key1, key1 ... keyn(子条件): {child1, child2 ... childn}}
```

根据id查询用户firstName、lastName和profile的gender、photo。

```typescript
user(id = $id): {firstName, lastName, profile: {gender, photo}}
```

对应的select query builder

```typescript
createQueryBuilder(User)
  .leftJoinAndSelect('user.profile', 'user_profile')
  .select('user.firstName', 'user.lastName', 'user_profile.gender', 'user_profile.photo')
```


## 条件

条件表达式与sql基本一致，除少部分不同外。

* 列比较

```typescript
column = column  // column比较
column >= 10  // 数字
column like 'str'  // 字符串
column = true  // 布尔
column = $id  // 参数
```

支持 =、>=、<、<=、!=、like 等比较符。

* 逻辑表达式

```typescript
id = 1 && isActive = true
id = 1 || id = 2
(id = 1 && isActive = true) || (id = 1 || id = 2)
```

## 全选
使用*来表示查询当前实体全部列，不包括关联的对象，使用!来排除相应的列。

查询用户全部信息，不查询密码

```typescript
user: {*, !password}
```

## 关联查询

关联查询仅需要传入需要查询的对象即可，不需要手动进行select和join操作。

* oneToOne

关联：user -> profile

查询user并获取其profile的photo

```typescript
user: {id, profile: {photo}}
```

对应的select query builder

```typescript
createQueryBuilder(User)
  .leftJoinAndSelect('user.profile', 'user_profile')
  .select('user.id', 'user_profile.photo')
```

* oneToMany

关联：user -> photos

查询user并获取其全部照片

```typescript
user: {id, photos: {url}}
```

对应的select query builder

```typescript
createQueryBuilder('User')
  .leftJoinAndSelect('user.photos', 'user_photos')
  .select('user.id', 'user_photos.url')
```

* manyToMany

关联：question -> categories

查询问题标题和问题全部分类

```typescript
question: {title, categories: {id, name}}
```

对应的select query builder

```typescript
createQueryBuilder(Question)
  .leftJoinAndSelect('question.categories', 'question_categories')
  .select('question.title', 'question_categories.id', 'question_categories.name')
```