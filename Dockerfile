# Static front-end: no build step, nginx just serves the files.
FROM nginx:1.27-alpine

# Replace the default site with ours (SPA uses hash routes, so no rewrite rules needed).
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
