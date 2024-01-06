export default async function removeExpiredTokens() {
  const now = new Date();
  await prisma.blacklistedToken.deleteMany({
    where: {
      expiresAt: {
        lte: now,
      },
    },
  });
}
