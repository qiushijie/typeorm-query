import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import User from './User';

@Entity()
export default class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gender: string;

  @Column()
  photo: string;

  @OneToOne(type => User, user => user.profile) // 将另一面指定为第二个参数
  user: User;
}