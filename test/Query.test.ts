import {Connection, ConnectionOptions, createConnection} from 'typeorm';
import User from './entities/User';
import Profile from './entities/Profile';
import Photo from './entities/Photo';
import Category from './entities/Category';
import Question from './entities/Question';
import createTreeQueryBuilder from '../src/Query';

const options: ConnectionOptions = {
  type: "sqlite",
  database: `${__dirname}/test.db`,
  entities: [User, Profile, Photo, Category, Question],
  logging: true,
  synchronize: true
}

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(options);
});

afterAll(async () => {
  await connection.close();
});

/**
 * min <= r <= max
 * @param min
 * @param max
 */
function random(min: number, max: number) {
  return Math.round(Math.random() * (max - min)) + min;
}

/**
 * length <= 11
 * @param length
 */
function randomString(length: number) {
  return Math.random().toString(36).substring(2).substr(0, length);
}

test('test query by id', async () => {
  const user = createUser();
  await connection.getRepository(User).save(user);

  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id): {firstName, lastName}')
    .param('id', user.id)
    .getOne();
  expect(user.firstName).toBe(result!.firstName);
  expect(user.lastName).toBe(result!.lastName);
});

test('test query by isActive', async () => {
  const user = createUser();
  user.isActive = false;
  await connection.getRepository(User).save(user);

  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id && isActive = false): {firstName, lastName}')
    .param('id', user.id)
    .getOne();
  expect(user.firstName).toBe(result!.firstName);
  expect(user.lastName).toBe(result!.lastName);
});

test('test query oneToOne', async () => {
  const profile = new Profile();
  profile.gender = randomString(8);
  profile.photo = randomString(8);
  await connection.getRepository(Profile).save(profile);

  const user = new User();
  user.firstName = randomString(8);
  user.lastName = randomString(8);
  user.isActive = true;
  user.profile = profile;
  await connection.getRepository(User).save(user);

  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id): {id, firstName, profile: {id, gender}}')
    .param('id', user.id)
    .getOne();
  expect(user.profile.gender).toBe(result!.profile.gender);
});

function createUser() {
  const user = new User();
  user.firstName = randomString(8);
  user.lastName = randomString(8);
  user.isActive = true;
  return user;
}

async function saveUserAndPhotos() {
  const user = createUser();
  user.photos = [];
  for (let i = 0; i < 2; i ++) {
    const photo = new Photo();
    photo.url = randomString(8);
    await connection.getRepository(Photo).save(photo);
    user.photos.push(photo);
  }
  await connection.getRepository(User).save(user);
  return user;
}

test('test query oneToMany', async () => {
  const user = await saveUserAndPhotos();
  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id) : {id, firstName, lastName, photos: {url}}')
    .param('id', user.id)
    // .orderBy('user.photos.id')
    .getOne();
  expect(user.firstName).toBe(result!.firstName);
  expect(user.lastName).toBe(result!.lastName);
  expect(user.photos.map(p => p.url)).toEqual(result!.photos.map(p => p.url));
});

test('test query manyToOne', async () => {
  const user = await saveUserAndPhotos();
  const photo = user.photos[0];
  const result = await createTreeQueryBuilder<Photo>()
    .query('photo(id = $id): {url, user: {id, firstName, lastName}}')
    .param('id', photo.id)
    .getOne();
  expect(photo.url).toBe(result!.url);
  expect(user.lastName).toBe(result!.user.lastName);
});

test('test query manyToMany', async () => {
  const category1 = new Category();
  category1.name = randomString(8);
  await connection.manager.save(category1);

  const category2 = new Category();
  category2.name = randomString(8);
  await connection.manager.save(category2);

  const question = new Question();
  question.title = randomString(8);
  question.text = randomString(8);
  question.categories = [category1, category2];
  await connection.manager.save(question);

  const result = await createTreeQueryBuilder<Question>()
    .query('question(id = $id) : {title, categories: {name}}')
    .param('id', question.id)
    .getOne();
  expect(question.categories.map(c => c.name)).toEqual(result!.categories.map(c => c.name));
});

async function saveMany(title: string, count: number) {
  for (let i = 0; i < count; i ++) {
    const question = new Question();
    question.title = title;
    question.text = randomString(8);
    await connection.manager.save(question);
  }
}

test('test query count', async () => {
  const count = 10;
  const title = randomString(8);
  await saveMany(title, count);
  const result = await createTreeQueryBuilder()
    .query('question(title = $title)')
    .param('title', title)
    .getCount();
  expect(count).toBe(result);
});

test('test order', async () => {
  const users = [];
  for (let i = 0; i < 10; i ++) {
    const user = createUser();
    await connection.getRepository(User).save(user);
    users.push(user);
  }
  const result = await createTreeQueryBuilder<User>()
    .query('user(id >= $min && id <= $max) : {id}')
    .param('min', users[0].id)
    .param('max', users[9].id)
    .orderBy('user.id', 'DESC')
    .getMany();
  expect(users.map(u => u.id).reverse()).toEqual(result.map(u => u.id));
});

test('test limit offset', async () => {
  const users = [];
  for (let i = 0; i < 10; i ++) {
    const user = createUser();
    await connection.getRepository(User).save(user);
    users.push(user);
  }
  const result = await createTreeQueryBuilder<User>()
    .query('user(id >= $min && id <= $max) : {id}')
    .param('min', users[0].id)
    .param('max', users[9].id)
    .limit(2)
    .offset(2)
    .getMany();
  expect(2).toBe(result.length);
  expect(users.slice(2, 4).map(u => u.id)).toEqual(result.map(u => u.id));
});

test('test query all', async () => {
  const user = createUser();
  await connection.getRepository(User).save(user);
  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id) : {*}')
    .param('id', user.id)
    .getOne();
  expect(result!.id).toBe(user.id);
  expect(result!.firstName).toBe(user.firstName);
  expect(result!.lastName).toBe(user.lastName);
  expect(result!.isActive).toBe(user.isActive);
  expect(result!.profile).toBeUndefined();
});

test('test query all ignore', async () => {
  const user = createUser();
  await connection.getRepository(User).save(user);
  const result = await createTreeQueryBuilder<User>()
    .query('user(id = $id) : {*, !isActive}')
    .param('id', user.id)
    .getOne();
  expect(result!.isActive).toBeUndefined();
});