import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IClientCreation {
  user_id: number;
  name: string;
  phone_number: string;
  last_state: string;
}

@Table({ tableName: "clients" })
export class Client extends Model<Client, IClientCreation> {
  @Column({ type: DataType.BIGINT })
  user_id: number;

  @Column({ type: DataType.STRING })
  name: string;

  @Column({ type: DataType.STRING })
  phone_number: string;

  @Column({ type: DataType.STRING })
  last_state: string;
}
