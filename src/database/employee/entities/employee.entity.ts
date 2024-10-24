import { Attendance } from 'src/database/attendance/entities/attendance.entity';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Employee extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  employeeIdentifier: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @BeforeInsert()
  async generateEmployeeIdentifier() {
    const randomNum = this.generateRandomNumber();
    this.employeeIdentifier = `${this.firstName.toLocaleLowerCase()}${randomNum}`;

    let existingEmployee = await Employee.findOne({
      where: { employeeIdentifier: this.employeeIdentifier },
    });
    if (existingEmployee) {
      const newRandomNum = this.generateRandomNumber();
      this.employeeIdentifier = `${this.firstName.toLocaleLowerCase()}${newRandomNum}`;
    }
  }

  private generateRandomNumber(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
  }
}
