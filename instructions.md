# NutriTrace

## Documentation

- [NutriTrace guide](https://traceapps.github.io/docs/nutritrace/) ([source](https://github.com/TraceApps/docs/tree/main/docs/nutritrace)) — the diary, foods, goals, wellness sync, imports, MCP, the local food database and every Settings section
- [Accounts and sign-in](https://traceapps.github.io/docs/auth/local-users/) ([source](https://github.com/TraceApps/docs/tree/main/docs/auth)) — users, sessions and single sign-on providers such as Pocket ID
- [Integrations](https://traceapps.github.io/docs/integrations/notifications/) ([source](https://github.com/TraceApps/docs/tree/main/docs/integrations)) — ntfy and other notification services, email, and federation with the other Trace apps
- [Trace AI](https://traceapps.github.io/docs/trace/setup/) ([source](https://github.com/TraceApps/docs/tree/main/docs/trace)) — setting up the AI assistant and choosing a model
- [Android app](https://traceapps.github.io/docs/mobile/install/) ([source](https://github.com/TraceApps/docs/tree/main/docs/mobile)) — installing the app and connecting it to your server

## What you get on StartOS

- **Web UI** is the one address NutriTrace has. It serves the web app, the API the Android app signs in to, and the federation API the other Trace apps connect to.
- Sign-in is on from the start. StartOS creates the `admin` account for you, so nobody can claim your server by opening it first.
- Email, the address NutriTrace puts in its links, and access for AI assistants are set with StartOS actions.
- Your diary, foods, recipes, photos, accounts and settings are all in StartOS backups. NutriTrace's own backup archives, from **Settings > Backup & Restore**, stay on the server but are left out of StartOS backups.
- NutriTrace doesn't check GitHub for new releases. StartOS updates it.

## Getting set up

1. Run **Set Admin Password** when StartOS asks for it. Copy the username, `admin`, and the password it shows.
2. Start NutriTrace and open the **Web UI**.
3. Sign in as `admin`.
4. Set your units, body stats and calorie goal in **Settings > Regional & Units**, **Settings > Body Stats** and **Settings > Calorie Goals**.
5. To give someone else their own diary, open **Settings > Users** and invite them, or use **Add User Manually** to set their username and password yourself. Invitations need email, so run **Configure SMTP** first.

## Using NutriTrace

### The admin password

Run **Set Admin Password** again whenever you need a new admin password, for instance if you've lost it. Browsers and phones already signed in as `admin` stay signed in.

**Settings > Users > Disable User Management** deletes every account along with everything in it, and leaves NutriTrace open to anyone who can reach it. If it has been used, run **Set Admin Password** to turn sign-in back on.

### Email and links

Run **Configure SMTP** to let NutriTrace send password resets, invitations, sharing notices and weekly summaries. Choose **System Credentials** to use the SMTP server StartOS sends its own email with, or **Custom Credentials** to enter another. NutriTrace's **Settings > Email (SMTP)** then shows the settings read-only, without its **Send Test** button. To check email works, sign out and use **Forgot Password?** with an account that has an email address.

The links in those emails, and the invitation links **Settings > Users** gives you to copy, point at a public domain of the **Web UI** if it has one, otherwise at its `.local` address, which only works at home. To choose the address yourself, run **Set Primary URL**.

### Android app

The Android app connects to the **Web UI** address. It only uses HTTPS, so on your home network the phone has to trust your server's root certificate, just as your browser does.

### Connecting your other services

NutriTrace can reach other services on this server at the HTTPS addresses StartOS shows for them. Use the address with your server's IP in it, such as `https://192.168.1.10:51454`, or a private or public domain you've added to that service. NutriTrace can't look up `.local` names.

- **Notifications**: in **Settings > Notifications**, choose ntfy and enter your ntfy address and a topic. If your ntfy requires sign-in, create an access token in ntfy and paste it into **Access Token**.
- **Single sign-on**: in **Settings > Authentication**, add Pocket ID or another OpenID Connect provider. For Pocket ID, the issuer is the domain you chose with Pocket ID's **Set Primary URL**. In Pocket ID, add NutriTrace as a client with PKCE, and set its callback URL to the address you open NutriTrace at followed by `/api/auth/oidc/callback/` and the provider's number in NutriTrace. Your `admin` account has no email address, so link it to Pocket ID from your profile in NutriTrace. The upstream Pocket ID guide lists the other values to copy across.
- **Webhooks**: in **Settings > Webhooks**, an admin can send meal, water, body stat and goal events to Home Assistant, n8n or any other address, on your network or not.
- **CookTrace and LiftTrace**: create a token in **Settings > API Tokens**, then paste NutriTrace's **Web UI** address, again the one with your server's IP, and the token into the other app's settings.
- **Trace AI**: in **Settings > AI Assistant**, pick a provider and enter its key. A model on your own network has to be reachable from the browser you use NutriTrace in.

### AI assistants and your own scripts

NutriTrace can answer AI assistants such as Claude Desktop over MCP, at the **Web UI** address followed by `/api/mcp`, and your own scripts over its REST API at `/api/v1`. Both are off until you run **Configure API Access** and choose how much they may do: read, also log food, water and body stats, or also edit and delete diary entries through MCP. Then create a token in **Settings > API Tokens** with the matching `mcp:` scopes and give it to the assistant or script.

### Connections NutriTrace makes itself

NutriTrace looks foods up in Open Food Facts and USDA, and fetches from the wearable services you connect. Those services see your server's IP address. If you publish NutriTrace through a tunnel to keep your home IP private, send its outbound traffic through that tunnel too. If you use a tunnel for another reason, such as a port your router can't forward, there's nothing to change.

To keep barcode and food searches away from the public Open Food Facts API, the **Advanced** group has **Enable Local Food Database**. It downloads an 8 GB copy of Open Food Facts that NutriTrace searches first. **Disable Local Food Database** deletes it.
