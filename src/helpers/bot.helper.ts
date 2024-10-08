import { Context, Markup } from "telegraf";

export function notUser(ctx: Context) {
  return ctx.reply(`Siz avval ro'yxatdan o'tmagansiz`, {
    parse_mode: "HTML",
    ...Markup.keyboard([["/start"]])
      .resize()
      .oneTime(),
  });
}
