import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IServiceCreation {
  name: string;
}

@Table({ tableName: "services", timestamps: false })
export class Service extends Model<Service, IServiceCreation> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING })
  name: string;
}
