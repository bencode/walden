# walden

**(λ () (study math) (practice code))**

Source of [(λ Qijun)](https://blog.qijun.io/), a personal blog built with Astro in `apps/web`.

## Deploy

```bash
./scripts/deploy.sh
```

The script builds `apps/web` and syncs `apps/web/dist/` to `/root/apps/qj-blog` on server `i`, which Caddy serves as `blog.qijun.io`. Set `DEPLOY_SERVER` or `DEPLOY_DIR` to deploy elsewhere.
