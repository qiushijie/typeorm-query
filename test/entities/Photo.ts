import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import User from './User';

@Entity()
export default class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(type => User, user => user.photos)
  user: User;
}