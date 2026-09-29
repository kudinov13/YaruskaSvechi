#!/bin/bash
echo '== HTTP/2 =='
curl -s -o /dev/null --http2 -w 'proto:%{http_version}\n' https://yaruska.ru
echo '== gzip =='
curl -s -o /dev/null --compressed -w 'js:%{size_download}b\n' https://yaruska.ru/assets/index-DGY9WBPk.js
curl -s -o /dev/null --compressed -w 'css:%{size_download}b\n' https://yaruska.ru/assets/index-BzsUmYPB.css
curl -s -o /dev/null --compressed -w 'products-api:%{size_download}b\n' https://yaruska.ru/api/products
echo '== images =='
for f in Hero_desktop Shelk_Two Samovar_One; do
  curl -s -o /dev/null -w "$f: %{size_download}b %{http_code}\n" "https://yaruska.ru/Photos/$f.jpg"
done
echo '== fonts =='
curl -s -o /dev/null -w 'woff2:%{http_code}\n' https://yaruska.ru/fonts/xn7gYHE41ni1AdIRggexSg.woff2
echo '== robots/sitemap =='
curl -s -o /dev/null -w 'robots:%{http_code} %{content_type}\n' https://yaruska.ru/robots.txt
curl -s -o /dev/null -w 'sitemap:%{http_code} %{content_type}\n' https://yaruska.ru/sitemap.xml
echo '== meta in index =='
curl -s https://yaruska.ru | grep -oE '<title>[^<]+|og:[a-z]+" content="[^"]{0,40}' | head -10
echo '== leftover google fonts ref in bundle? =='
grep -c 'fonts.googleapis\|fonts.gstatic' /var/www/yaruska/assets/*.css || true
echo '== service =='
curl -s https://yaruska.ru/api/health
systemctl is-active yaruska-api
