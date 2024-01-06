export const authorize = (roles) => {
  return async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.email },
    });

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
