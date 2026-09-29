#!/bin/bash
JS=$(ls -t /var/www/yaruska/assets/index-*.js | head -1)
echo "bundle: $JS"
grep -oF 'minmax(140px' "$JS" | head -2
grep -oF 'В популярные' "$JS" | head -1
grep -oF 'moveImage' "$JS" | head -1 || echo "moveImage not found (minified)"
