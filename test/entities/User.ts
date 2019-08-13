import {Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import Profile from './Profile';
import Photo from './Photo';

@Entity()
export default class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isActive: boolean;

  @OneToOne(type => Profile, profile => profile.user) // 指定另一面作为第二个参数，列在这里
  @JoinColumn()
  profile: Profile;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}