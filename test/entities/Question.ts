import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import Category  from "./Category";

@Entity()
export default class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @ManyToMany(type => Category)
  @JoinTable()  // 放在拥有方，生成question_categories_category
  categories: Category[];
}