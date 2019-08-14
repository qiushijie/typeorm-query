typeorm-query
---

The typeorm querier is based on the select query bulider like json and graphql, which can perform multi-level complex queries and precise field queries in a simple manner.

# Languages

* [中文](./doc/Chinese.md)

# Install

You must have [typeorm](https://github.com/typeorm/typeorm) installed, as well as write entity classes and get connections before using it.

```
npm install typeorm-query --save
```

# Usage

## Simple usage example

```typescript
import createTreeQueryBuilder from 'typeorm-query';

const user = await createTreeQueryBuilder()
  .query('user(id = $id): {*}')
  .param('id', 1)
  .getOne();
```

select query builder

```typescript
const user = await connection
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.id = :id', {id: 1})
  .select('user.id', 'user.firstName', 'user.lastName', 'user.isActive')
  .getOne();
```

## Create and use TreeQueryBuilder

* Use default connection

```typescript
createTreeQueryBuilder()
```

* Use connection

```typescript
createTreeQueryBuilder(connection)
```
* Declare types

```typescript
const user = await createTreeQueryBuilder<User>()
  .query('user: {*}')
  .getOne();
// Return type Promise<User|undefined>
console.log('firstName', user!.firstName);
```
## Builder option

* param

Use $ as a prefix to represent a parameter in a query statement, such as $id for a parameter named id.

Via the param method to pass in a single parameter. 

```typescript
createTreeQueryBuilder().param('id', id)
```

* params

Via the params method to pass in all parameters. 

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

Use entity.column name to get column entity,such as user.id or user.photos.id.

Sort can be empty, the default is ASC, you can use DESC.

```typescript
createTreeQueryBuilder().orderBy(column, sort)
````

## Query

* getOne

Get a single value.


```typescript
const user = await createTreeQueryBuilder()
  .query(query)
  .getOne();
```

* getMany

Get multiple values and return an array.

```typescript
const list = await createTreeQueryBuilder()
  .query(query)
  .getMany();
```

* getCount

Get the amount of result sets.

```typescript
const count = await createTreeQueryBuilder()
  .query(query)
  .getCount();
```

# Query statement

## Syntax

Use the tree structure of the entity to describe all the data that needs to be queried. Similar to the json syntax, only the part of the key is needed. After the query, the value is filled with the structure of the current key.

```
Entity name(conditions): {key1, key1 ... keyn(Subconditions): {child1, child2 ... childn}}
```

Query the firstName, lastName and profile's gender and photo of the user according to id.

```typescript
user(id = $id): {firstName, lastName, profile: {gender, photo}}
```

elect query builder

```typescript
createQueryBuilder(User)
  .leftJoinAndSelect('user.profile', 'user_profile')
  .select('user.firstName', 'user.lastName', 'user_profile.gender', 'user_profile.photo')
```


## Condition

Conditional expressions are basically the same as sql, except for a few differences.

* Column comparison

```typescript
column = column  // Column comparison
column >= 10  // Number
column like 'str'  // String
column = true  // Bool
column = $id  // Parameter
```

Support comparators such as=,>=,<,<=,!=, like, etc.

* Logical expression

```typescript
id = 1 && isActive = true
id = 1 || id = 2
(id = 1 && isActive = true) || (id = 1 || id = 2)
```

## Select All
Use * to indicate that all columns of the current entity are queried, not including associated objects, and use ! to exclude the corresponding columns.

Query all user information except password.

```typescript
user: {*, !password}
```

## Associated query

The associated query only needs to pass in the object that needs to be queried, and there is no need to manually perform select and join operations.

* oneToOne

Associate：user -> profile

Query user and get the photo of its profile.

```typescript
user: {id, profile: {photo}}
```

select query builder  

```typescript
createQueryBuilder(User)
  .leftJoinAndSelect('user.profile', 'user_profile')
  .select('user.id', 'user_profile.photo')
```

* oneToMany

Associate：user -> photos

Query user and get all its photos.

```typescript
user: {id, photos: {url}}
```

select query builder  

```typescript
createQueryBuilder('User')
  .leftJoinAndSelect('user.photos', 'user_photos')
  .select('user.id', 'user_photos.url')
```

* manyToMany

Associate：question -> categories

Query question title and question categories.

```typescript
question: {title, categories: {id, name}}
```

select query builder
  
```typescript
createQueryBuilder(Question)
  .leftJoinAndSelect('question.categories', 'question_categories')
  .select('question.title', 'question_categories.id', 'question_categories.name')
```