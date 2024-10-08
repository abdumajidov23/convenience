import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IMasterCreation {
  user_id: number;
  name: string;
  phone_number: string;
  service_name: string;
  address: string;
  target: string;
  location: string;
  start_time: string;
  end_time: string;
  avg_time: string;
  service_id: number;
  last_state: string;
}

@Table({ tableName: "masters" })
export class Master extends Model<Master, IMasterCreation> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @Column({ type: DataType.BIGINT })
  user_id: number;

  @Column({ type: DataType.STRING })
  name: string;

  @Column({ type: DataType.STRING })
  phone_number: string;

  @Column({ type: DataType.STRING })
  service_name: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.STRING })
  target: string;

  @Column({ type: DataType.STRING })
  location: string;

  @Column({ type: DataType.STRING })
  start_time: string;

  @Column({ type: DataType.STRING })
  end_time: string;

  @Column({ type: DataType.STRING })
  avg_time: string;

  @Column({ type: DataType.STRING })
  last_state: string;
}
