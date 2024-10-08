import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "../app.constants";
import { Context, Markup, Telegraf } from "telegraf";
import { Service } from "./models/services.model";
import { Master } from "./models/master.model";
import { Client } from "./models/client.model";
import { notUser } from "../helpers/bot.helper";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private botModel: typeof Bot,
    @InjectModel(Service) private jobModel: typeof Service,
    @InjectModel(Master) private masterModel: typeof Master,
    @InjectModel(Client) private clientModel: typeof Client
    
  ) {}

  async onStart(ctx: Context) {
    await ctx.reply("Ro'yxatdan o'tish tugmasini bosing", {
      parse_mode: "HTML",
      ...Markup.keyboard([["Ro'yxatdan o'tish"]])
        .resize()
        .oneTime(),
    });
  }

  async onHeartAuth(ctx: Context) {
    await ctx.reply("Kim bo'lib ro'yxatdan o'tmoqchisiz", {
      parse_mode: "HTML",
      ...Markup.keyboard([["Usta", "Mijoz"]])
        .resize()
        .oneTime(),
    });
  }

  async onHearsMaster(ctx: Context) {
    const jobs = await this.jobModel.findAll();
    const inlineKeyboard = jobs.map((job) => [
      { text: `${job.name}`, callback_data: `job_${job.id}` },
    ]);
    await ctx.reply("Kasbingi: ", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  async onHearsClient(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.botModel.findByPk(userId);
    if (!user) {
      await this.botModel.create({
        user_id: userId,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        lang: ctx.from.language_code,
      });
    }
    await this.clientModel.create({
      user_id: userId,
      last_state: "client_name",
    });
    await ctx.reply("Ismingizni kiriting:", {
      parse_mode: "HTML",
      ...Markup.removeKeyboard(),
    });
  }

  async onClickJob(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.botModel.findByPk(userId);
    if (!user) {
      await this.botModel.create({
        user_id: userId,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        lang: ctx.from.language_code,
      });

      const callBackButtonText: String = ctx.callbackQuery["data"];
      const serviceId = Number(callBackButtonText.split("_")[1]);
      await this.masterModel.create({
        user_id: userId,
        service_id: serviceId,
        last_state: "master_name",
      });
      await ctx.reply("Ismingizni kiriting:", {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    } else {
      await ctx.reply(`Bitta master faqat bitta job tanlashi mumkun`, {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    }
  }

  async onText(ctx: Context) {
    if ("text" in ctx.message) {
      const userId = ctx.from.id;
      const user = await this.botModel.findByPk(userId);
      if (!user) {
        await ctx.reply(`Siz avval ro'yxatdan o'tmagansiz`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id: userId },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state !== "finish") {
          if (master.last_state == "master_name") {
            master.name = ctx.message.text;
            master.last_state = "master_phone_number";
            await master.save();
            await ctx.reply(`Telefon raqamingizni yuboring:`, {
              parse_mode: "HTML",
              ...Markup.keyboard([
                Markup.button.contactRequest("📞 Telefon raqamni yuboring"),
              ])
                .oneTime()
                .resize(),
            });
          } else if (master.last_state == "master_service_name") {
            master.service_name = ctx.message.text;
            master.last_state = "master_address";
            master.save();
            await ctx.reply("Ustaxona addressini kiriting:", {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            });
          } else if (master.last_state == "master_address") {
            master.address = ctx.message.text;
            master.last_state = "master_landmark";
            master.save();
            await ctx.reply("Mo'ljal: ", {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            });
          } else if (master.last_state == "master_landmark") {
            console.log(master.last_state);
            master.target = ctx.message.text;
            master.last_state = "master_location";
            master.save();
            await ctx.reply("Lokatsiyani jo'nating", {
              parse_mode: "HTML",
              ...Markup.keyboard([
                Markup.button.locationRequest("📍 Lokatsiyani yuboring"),
              ])
                .resize()
                .oneTime(),
            });
          } else if (master.last_state == "master_start_time") {
            console.log("Biz shu yerdamiz");
            master.start_time = ctx.message.text;
            master.last_state = "master_end_time";
            master.save();
            await ctx.reply("Ish tugash vaqtini kiriting:", {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            });
          } else if (master.last_state == "master_end_time") {
            master.end_time = ctx.message.text;
            master.last_state = "master_avg_time";
            master.save();
            await ctx.reply("Bitta mijozga o'rtacha qancha vaqt ketadi", {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            });
          } else if (master.last_state == "master_avg_time") {
            master.avg_time = ctx.message.text;
            master.last_state = "finish";
            master.save();
            await ctx.reply(
              "Tabriklayman siz ro'yxatdan muvaffaqiyatli o'tdingiz 😍",
              {
                parse_mode: "HTML",
                ...Markup.removeKeyboard(),
              }
            );
          }
        }
        const client = await this.clientModel.findOne({
          where: { user_id: userId },
          order: [["id", "DESC"]],
        });
        if (client && client.last_state !== "finish") {
          if (client.last_state == "client_name") {
            client.name = ctx.message.text;
            client.last_state = "client_phone_number";
            await client.save();
            await ctx.reply(`Telefon raqamingizni yuboring:`, {
              parse_mode: "HTML",
              ...Markup.keyboard([
                Markup.button.contactRequest("📞 Telefon raqamni yuboring!"),
              ])
                .oneTime()
                .resize(),
            });
          }
        }
      }
    }
  }

  async onContact(ctx: Context) {
    if ("contact" in ctx.message) {
      const userId = ctx.from.id;
      const user = await this.botModel.findByPk(userId);
      if (!user) {
        notUser(ctx);
      } else if (ctx.message.contact.user_id != userId) {
        await ctx.reply(`Telefon raqamingizni yuboring:`, {
          parse_mode: "HTML",
          ...Markup.keyboard([
            Markup.button.contactRequest("📞 Telefon raqamni yuboring!"),
          ])
            .oneTime()
            .resize(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id: userId },
          order: [["id", "DESC"]],
        });

        if (master && master.last_state == "master_phone_number") {
          master.phone_number = ctx.message.contact.phone_number;
          master.last_state = "master_service_name";
          master.save();
          await ctx.reply("Ustaxona nomini kiriting:", {
            parse_mode: "HTML",
            ...Markup.removeKeyboard(),
          });
        }

        const client = await this.clientModel.findOne({
          where: { user_id: userId },
          order: [["id", "DESC"]],
        });
        if (client && client.last_state == "client_phone_number") {
          console.log(ctx.message.contact.phone_number);
          client.phone_number = ctx.message.contact.phone_number;
          client.last_state = "finish";
          client.save();
          await ctx.reply(
            "Tabriklayman siz ro'yxatdan muvaffaqiyatli o'tdingiz 😍",
            {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            }
          );
        }
      }
    }
  }

  async onLocation(ctx: Context) {
    if ("location" in ctx.message) {
      const userId = ctx.from.id;
      const user = await this.botModel.findByPk(userId);
      if (!user) {
        await ctx.reply(`Siz avval ro'yxatdan o'tmagansiz!`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id: userId },
          order: [["id", "DESC"]],
        });
        if (master.last_state == "master_location") {
          master.location = `${ctx.message.location.latitude}, ${ctx.message.location.longitude}`;
          master.last_state = "master_start_time";
          master.save();
          await ctx.reply("Ish boshlanish vaqtini kiriting:", {
            parse_mode: "HTML",
            ...Markup.removeKeyboard(),
          });
        }
      }
    }
  }



///// 8-oktar

async admin_menu(ctx: Context, menu_text = `<b>Admin menusi</b>`){
  console.log("admin_menu")
  try{
    await ctx.reply(menu_text, {
      parse_mode:"HTML",
      ...Markup.keyboard([["Mijozlar", "Ustalar"]]).oneTime().resize()
    })
  }catch(error){
    console.log("Admin menu da xatolik",error);
    
  }
}



  // async start(ctx: Context) {
  //   await ctx.reply(`Iltimos,<b>"Ro'yxatdan o'tish"</b> tugmasini bosing!`, {
  //     parse_mode: "HTML",
  //     ...Markup.keyboard([["Ro'yxatdan o'tish"]])
  //       .resize()
  //       .oneTime(),
  //   });
  // }

  // async register(ctx: Context) {
  //   await ctx.reply(`Iltimos,<b>"Rolingizni tanlang!"</b>`, {
  //     parse_mode: "HTML",
  //     ...Markup.keyboard(["Mijoz", "Usta"]).resize().oneTime(),
  //   });
  //   const userId = ctx.from.id;
  //   const user = await this.botModel.findOne({ where: { user_id: userId } });
  //   if (!user) {
  //     await this.botModel.create({
  //       user_id: userId,
  //       username: ctx.from.username,
  //       first_name: ctx.from.first_name,
  //       last_name: ctx.from.last_name,
  //       lang: ctx.from.language_code,
  //     });
  //   } else if (!user.status) {
  //     await ctx.reply(`<b>Rolingizni tanlang!</b>`, {
  //       parse_mode: "HTML",
  //       ...Markup.keyboard(["Mijoz", "Usta"]).resize().oneTime(),
  //     });
  //   } else {
  //     await ctx.reply(
  //       `Bu bot maishiy xizmatlardan foydalanish uchun ishlatiladi!`,
  //       {
  //         parse_mode: "HTML",
  //         ...Markup.removeKeyboard(),
  //       }
  //     );
  //   }
  // }

  // async registerMijoz(ctx: Context) {
  //   await ctx.reply(`Siz <b>mijoz</b> rolini tanladingiz!`, {
  //     parse_mode: "HTML",
  //   });

  //   await ctx.reply(`Ismingizni kiriting`, {
  //     parse_mode: "HTML",
  //   });

  //   await ctx.reply(`Raqamingizni kiriting`, {
  //     parse_mode: "HTML",
  //     ...Markup.keyboard
  //   })
  // }
}
