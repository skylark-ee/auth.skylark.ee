# Skylark Auth (SSO)

## Technologies
- Trying on [nunjucks](https://github.com/mozilla/nunjucks) for templating. [docs](https://mozilla.github.io/nunjucks/templating.html)


## Endpoints

### `/auth`

Shows the log-in screen.

All data transferred is [public key encrypted](https://stackoverflow.com/a/31061352), using Auth's public key. User is requested to provide their login id (email address), and any extra_fields required by the client configuration. After that the user is sent an out-of-band password challenge, inputting which into the newly shown input box logs the user in. After successful authentication the session is saved into the registry and the user is redirected back to the originating client with the session id supplied to the page.

The session id is saved in a persistent cookie and used for future authentication. When the session id is first passed in a cookie to the server, the client app pings  the internal api of the Auth app and requests the session data to be sent over. Session data is then cached locally and used for faster authentication of user activity.


```json
{
  "id": "skylark-notes",
  "client_id": "n49d...",
  "enc_key": "bb8f...",
  "return_to": "https://notes.skylark.ee/auth"
}
```

### `/session`

Internal API for client apps to request session information.

```json
{
  "client_id": "ab48...",
  "session_id": "95fc...",
  "enc_key": "bb8f..."
}
```

## Encryption key

All requests contain a one-off encryption key to be used to encrypt responses from the Auth server. Since requests are encrypted (with the public key of the Auth server), the encryption key will be available for both parties. The Auth server uses AES-256 symmetric encryption on the response data, and posts it to the Auth server from the clientside. The client's result endpoint (specified in `return_to`) will process the post request and save the decrypted key in a local cookie on the Client App's origin, so it could be used by all requests.

Client app should be HTTPS to make sure the resulting long-lived cookie/auth key remains safe and invisible to the outside world.

_Update:_

Public-Private key encryption is slow and limited in byte-size of the payload it is capable of encrypting. Thus `ppc-messaging` now uses symmetric (AES-256) encryption on messages going both ways, and only encrypts the (randomly generated) AES key with the public key, after which it attaches the encrypted key to the encrypted payload. The Auth server is able to decrypt the symmetric key using its private key, and reply using the client's provided key embedded in the original message.
