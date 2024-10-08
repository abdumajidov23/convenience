import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { SequelizeModule } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { Client } from "./models/client.model";
import { Master } from "./models/master.model";
import { Service } from "./models/services.model";

@Module({
  imports: [SequelizeModule.forFeature([Bot, Client, Master, Service])],
  providers: [BotService, BotUpdate],
  exports: [BotService],
})
export class BotModule {}
