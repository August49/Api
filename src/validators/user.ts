import Joi from "joi";

export function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().min(8).max(255).required(),
  });
  return schema.validate(user);
}

export function validateSignIn(user) {
  const schema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().min(8).max(255).required(),
    rememberMe: Joi.boolean(),
  });
  return schema.validate(user);
}

export const validateEmail = (email) => {
  const schema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
  });
  return schema.validate({ email });
};

export const validatePasswordReset = (password, confirmPassword) => {
  const schema = Joi.object({
    password: Joi.string().required(),
    confirmPassword: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
  });
  return schema.validate({ password, confirmPassword });
};
