#!/bin/bash
for f in Chuvstvo_Two Chudvstvo_One Carica_Two Carica_One Nastya_One Nastya_Two Anushka_One Anushka_Two Vasilisa_One Vasilisa_Two Samovar_One Samovar_four Samovar_Two Barina Elka_One Elka_Two Elka_Tree Elka_Four Shelk_Two Shelk_One Shelk_Tree Vesna_One Vesna_Two Hero_desktop Hero_Mobile.jpeg; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/Photos/$f.jpg")
  echo "$f: $code"
done
echo "--- homepage uploads ---"
curl -s http://127.0.0.1/api/homepage 2>/dev/null | head -c 2000
echo ""
echo "--- uploads listing referenced ---"
grep -o '/uploads/[^"]*' -r /var/www/yaruska/assets/*.js | head -20
