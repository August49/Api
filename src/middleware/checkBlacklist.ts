export async function checkBlacklisted(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  const blacklistedToken = await prisma.blacklistedToken.findUnique({
    where: {
      token: token,
    },
  });

  if (blacklistedToken) {
    return res.sendStatus(403);
  }

  next();
}
