# Ilona Napopil Photography

A static portfolio in Polish with a home page, four portfolio galleries, session details, and a contact page.

## Local preview

Run this command from the repository root.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/). The HTML files can be served on any static host without a build step. Relative links also let you host the site in a subdirectory.

- `assets/photos/` contains 63 JPEGs at the largest size publicly available from the original site. Pages that use the same photo share a single file.
- `assets/previews/` contains smaller JPEGs for display on the site.
- `assets/site.css` and `assets/site.js` contain shared styles and interactions.
- The contact form sends inquiries to a Telegram channel through a Cloudflare Worker. It requires a phone number or an email address. Polish phone numbers can be entered without a country code. International numbers must start with `+` or `00`. The local copy of `libphonenumber-js` 1.13.16 in `assets/vendor/` validates phone numbers and formats them for the message. The complete message is limited to 512 characters, including field labels.
- The site uses Sofia Pro Light when it is installed on the visitor’s device. Otherwise, it uses Avenir Next or a system font. To make Sofia Pro available to all visitors, add a licensed web font using the `@font-face` declaration in `assets/site.css`.

## Contact form

The form sends JSON to a Cloudflare Worker, which validates each submission and forwards it to a Telegram channel. [Open the contact form](https://ilonanapopil.com/contact/).

### Cloudflare Worker setup

1. **Set up the bot and widget.** Add the bot to the target Telegram channel and grant it permission to post messages. If its token was previously exposed, revoke it with `/revoke` in `@BotFather`. In the Cloudflare dashboard, create a Turnstile widget in **Managed** mode and add the hostname of the page that hosts the form, such as `www.example.com`. [Turnstile widget setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/).
2. **Configure the deployment metadata.** In `_worker/metadata.json`, set `ALLOWED_ORIGINS` to the exact origin of the page that hosts the form, such as `https://www.example.com`, omitting the path and trailing slash. Separate multiple origins with commas. `CONTACT_RATE_LIMITER` allows five POST requests per 60 seconds per IP address at each Cloudflare location. Choose a numeric `namespace_id` for the rate limiter that is unique within the account. [Workers Rate Limiting setup](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
3. **Deploy the module.** Run the following command from the repository root. Replace the placeholders with the account ID and Worker name. Set `CLOUDFLARE_API_TOKEN` in your shell environment to a token with **Workers Scripts Write** permission for that account. The command creates or updates the Worker. The `keep_bindings` setting in the metadata preserves existing text secrets on subsequent deployments. [Worker deployment API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/).

   ```sh
   CF_ACCOUNT_ID='ACCOUNT_ID'
   CF_WORKER_NAME='WORKER_NAME'

   printf 'Authorization: Bearer %s\n' "${CLOUDFLARE_API_TOKEN:?}" |
     curl --disable --fail-with-body --silent --show-error \
       --request PUT --header @- \
       --form 'metadata=<_worker/metadata.json;type=application/json' \
       --form 'contact.mjs=@_worker/contact.mjs;type=application/javascript+module' \
       "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${CF_WORKER_NAME}"
   ```

4. **Add the secrets.** In the Worker dashboard, open **Settings → Variables and Secrets** and add each entry below with type **Secret**. Deploy the changes and keep the values in Cloudflare. [Worker secrets setup](https://developers.cloudflare.com/workers/configuration/secrets/).

   | Secret name | Value |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | Bot token from `@BotFather` |
   | `TELEGRAM_CHAT_ID` | Target Telegram channel ID |
   | `TURNSTILE_SECRET_KEY` | Turnstile widget secret key |

5. **Connect the form to the Worker.** Assign a custom domain such as `contact.example.com` to the Worker or enable its `workers.dev` address. In `contact/index.html`, set `data-endpoint` to the full HTTPS URL of the Worker, including the trailing `/`, and set `data-turnstile-sitekey` to the public sitekey for the same widget. Publish the changes to your static host. The Worker checks that the hostname returned by Siteverify matches the hostname in the form’s origin and that the action is `contact`. [Worker domain setup](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

### Post-deployment checks

Send a clearly labeled test submission from the live site. Confirm that the form displays a success message and that all fields appear in Telegram. A request from a disallowed `Origin` or without a valid Turnstile token should return `403`. A series of requests from one IP address should eventually return `429`. A request with the hidden `website` field filled in returns `200` and skips Telegram delivery. In your browser’s developer tools, verify that the form sends its request to the Worker and that the request contains neither the bot credentials nor the channel ID.

## Site behavior and localization

- The navigation, galleries, and form use Polish labels.
- The footer links to Instagram and includes a back-to-top arrow. The Pixieset credit refers to the original hosting platform.
- The home page displays photos in a carousel. The gallery lightbox uses a white background and supports the arrow keys and Escape.
