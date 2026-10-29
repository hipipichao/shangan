import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = "hipipichao@qq.com";
const password = "Zz160617.";

async function main() {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpires: null,
    },
  });
  console.log(`已为用户 ${user.email} 设置密码 "${password}" 并标记邮箱已验证`);
  console.log("请登录后在个人中心修改密码");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });