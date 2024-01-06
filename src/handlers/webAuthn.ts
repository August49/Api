import type {
  GenerateAuthenticationOptionsOpts,
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import {
  // Authentication
  generateAuthenticationOptions,
  // Registration
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";

import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";
import { createToken } from "../auth";
import log from "../startup/logs";

const rpName = "SimpleWebAuthn Example";
// A unique identifier for your website
const rpID = "localhost";
// The URL at which registrations and authentications should occur
const origin = `http://${rpID}:3000`;
const rememberMe = true;

export const registrationOptions = async (req, res) => {
  const loggedInUserId = "18443cff-7d3d-4c33-b6d2-042042226601";

  // Retrieve the user from the database
  const user = await prisma.user.findUnique({
    where: { id: loggedInUserId },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const options = await generateRegistrationOptions({
    rpName: "SimpleWebAuthn Example",
    rpID: "localhost",
    userID: user.id.toString(),
    userName: user.username,
    attestationType: "none",
    excludeCredentials:
      user && user.authenticators
        ? user.authenticators.map((authenticator) => ({
            id: authenticator.credentialId,
            type: "public-key",
            transports: authenticator.transports as AuthenticatorTransport[],
          }))
        : [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  // Remember the challenge for this user
  await prisma.user.update({
    where: { id: loggedInUserId },
    data: { currentChallenge: options.challenge },
  });
  log.info("Registration options generated", options);

  res.json(options);
};

export const verifyRegistration = async (req, res) => {
  const loggedInUserId = "18443cff-7d3d-4c33-b6d2-042042226601";
  const body: RegistrationResponseJSON = req.body.data;

  // Retrieve the logged-in user
  const user = await prisma.user.findUnique({
    where: { id: loggedInUserId },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  log.info("Verifying registration response", req.body);

  const expectedChallenge = user.currentChallenge;
  const options = {
    response: {
      attestationObject: isoBase64URL.toBuffer(body.response.attestationObject),
      clientDataJSON: isoBase64URL.toBuffer(body.response.clientDataJSON),
      id: body.id,
      rawId: body.rawId,
      type: "public-key" as const,
      response: body.response,
      clientExtensionResults: body.clientExtensionResults,
    },
  };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      ...options,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: error.message });
  }

  const { verified } = verification;

  if (verified) {
    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo;

    await prisma.authenticator.create({
      data: {
        credentialBackedUp: false,
        credentialDeviceType: "platform",
        credentialId: Buffer.from(credentialID),
        transports: body.response.transports,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { webAuthenToken: true },
    });
  }

  res.json({ verified });
};

export const webauthloginOptions = async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: email },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials: user.authenticators.map((dev) => ({
      id: dev.credentialId,
      type: "public-key",
      transports: dev.transports as AuthenticatorTransport[],
    })),

    userVerification: "preferred",
    rpID,
  };

  const loginOpts = await generateAuthenticationOptions(opts);

  await prisma.user.update({
    where: { email: email },
    data: { currentChallenge: loginOpts.challenge },
  });

  res.send(loginOpts);
};

export const webauthLoginVerification = async (req, res) => {
  const body: AuthenticationResponseJSON = req.body.data;
  const email = req.body.data.email.email;

  const user = await prisma.user.findUnique({
    where: { email: email },
    include: { authenticators: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!body.id || !body.rawId) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const expectedChallenge = user.currentChallenge;

  let dbAuthenticator;
  const bodyCredIDBuffer = isoBase64URL.toBuffer(body.id);
  for (const dev of user.authenticators) {
    if (isoUint8Array.areEqual(dev.credentialId, bodyCredIDBuffer)) {
      dbAuthenticator = dev;
      break;
    }
  }

  if (!dbAuthenticator) {
    return res.status(400).send({
      error: "Authenticator is not registered with this site",
    });
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: dbAuthenticator,
      requireUserVerification: false,
    };
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Update the authenticator's counter in the DB to the newest count in the authentication
    dbAuthenticator.counter = authenticationInfo.newCounter;
  }

  const token = createToken(user, rememberMe);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });
  let cookieOptions: any = {};
  if (rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  res.status(200).send({ name: user.username });
};
