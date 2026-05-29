#!/bin/bash
# Generate marketing site images via Recraft API (v4 — no style param)
API_KEY="Ze3IwrINY1WVlI8b54jjU3tqVH1iVDUdeQX1nytcgLKDJQQLSUhVieFkTymYobzY"
OUT_DIR="/Users/andrewsantamaria/dev/andy-projects/stand-marketing/images"

generate() {
  local name="$1"
  local prompt="$2"
  local size="${3:-1024x1024}"

  echo "Generating: $name..."

  RESPONSE=$(curl -s -X POST "https://external.api.recraft.ai/v1/images/generations" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"$prompt\",
      \"model\": \"recraftv4\",
      \"size\": \"$size\",
      \"n\": 1,
      \"response_format\": \"url\"
    }")

  URL=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['url'])" 2>/dev/null)

  if [ -n "$URL" ] && [ "$URL" != "None" ]; then
    curl -s -o "$OUT_DIR/$name.png" "$URL"
    echo "  Saved: $name.png"
  else
    echo "  FAILED: $name"
    echo "  Response: $RESPONSE"
  fi
}

# Hero illustration
generate "hero-main" \
  "Warm editorial illustration of a diverse group of kids ages 10-13 excitedly working at a colorful market stand. One kid designing a logo on a tablet, another arranging handmade products on a table with a branded banner. Warm craft paper texture background in cream and gold tones. Red accent color. Entrepreneurial energy, whimsical hand-drawn digital illustration style. No text or lettering anywhere in the image." \
  "1365x1024"

# Cookie business starter
generate "starter-cookies" \
  "Charming digital illustration of a kids cookie business: a small wooden stand with branded packaging, fresh cookies on display, a chalkboard sign, cute price tags. Warm cream background with subtle craft paper texture. Golden brown, warm red accents, cream palette. Cozy entrepreneurial hand-drawn illustration style. No text or lettering anywhere."

# Brand Threads starter
generate "starter-threads" \
  "Digital illustration of a kids custom clothing brand: colorful t-shirts hanging on a wooden rack with cool printed designs, a screen printing press, branded hang tags and tissue paper packaging. Creative urban energy. Warm cream background. Blue accents, cream, dark charcoal palette. Hand-drawn illustration style. No text or lettering."

# Charms & bracelets starter
generate "starter-charms" \
  "Digital illustration of a kids jewelry and charm business: colorful beaded bracelets, charm necklaces displayed on a small wooden craft stand, branded gift boxes. Warm cream background with craft paper texture. Green, gold, cream color palette. Playful crafty hand-drawn illustration style. No text or lettering."

# Brand identity flat lay
generate "brand-showcase" \
  "Flat lay editorial illustration showing a complete kids brand identity kit arranged on craft paper: a logo printed on business cards, branded stickers in a sheet, a small fabric banner, colorful product packaging with a custom logo mark, a certificate with a ribbon. Warm cream and red color palette. Clean editorial professional but whimsical. No readable text or lettering." \
  "1365x1024"

# Parent watching kid at market
generate "parent-moment" \
  "Warm editorial illustration of a proud parent watching their child age 11 confidently running their small business stand at a sunny neighborhood market. The kid stands behind a beautifully branded table setup. Golden afternoon sunlight, warm cream and red tones. Emotional, hopeful, editorial illustration style. No text or lettering." \
  "1365x1024"

echo ""
echo "Done!"
ls -la "$OUT_DIR"
