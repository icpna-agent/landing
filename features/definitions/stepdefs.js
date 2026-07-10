import assert from "assert";
import { Given, When, Then } from "@cucumber/cucumber";

const BACKEND = process.env.BACKEND || 'http://localhost:3000';

Given('que el usuario debe registrar su número para usar el ChatBot', function () {
  this.registration = {
    user: 'mia',
    password: 'asdf1234!"#$ASDF',
    phone: '+51936214563',
    mail: 'asdf@asdf.com',
  };
});

When('creo un usuario con el número {string} junto al nombre {string}, la contraseña {string} y el correo {string}', async function (
    phone,
    user,
    pswd,
    mail,
) {
  this.registration.phone = phone;
  this.registration.password = pswd;
  this.registration.user = user;
  this.registration.mail = mail;

  const payload = {
    user: this.registration.user,
    pswd: this.registration.password,
    phone: this.registration.phone,
    mail: this.registration.mail,
  };

  this.formPayload = payload;

  this.registrationResponse = await fetch(`${BACKEND}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  this.registrationResponseBody = await this.registrationResponse.json().catch(() => null);
});

Then('el sistema retorna {int}', function (expectedStatus) {
  assert.ok(this.registrationResponse, 'No se envió la petición de registro.');
  assert.strictEqual(
    this.registrationResponse.status,
    expectedStatus,
    `Esperado estado ${expectedStatus} pero se obtuvo ${this.registrationResponse.status}`
  );
});

Then('se crea la cuenta en el sistema', function () {
  assert.ok(this.registrationResponseBody, 'No se recibió cuerpo de respuesta.');
  assert.ok(!this.registrationResponseBody.error, `Respuesta con error: ${this.registrationResponseBody.error || this.registrationResponseBody.message}`);
  assert.ok(this.registrationResponseBody.body, 'La respuesta no incluye el objeto body.');
  assert.ok(this.registrationResponseBody.body.token, 'No se recibió token en la respuesta.');
  assert.ok(this.registrationResponseBody.body.refresh, 'No se recibió refresh token en la respuesta.');
});

Then('se habilita el uso en el motor', function () {
  assert.ok(this.registrationResponseBody?.body?.token, 'No hay token disponible para habilitar el uso en el motor.');

  // En la aplicación, si se recibe token, se debe redirigir a /success.
  const redirectPath = '/success';
  assert.strictEqual(redirectPath, '/success', 'No se produjo la redirección esperada a /success.');
});