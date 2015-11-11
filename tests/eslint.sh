#!/bin/bash

# Configuration
eslint_bin='eslint'
html_base='../index.html' # The html document referencing js files
js_out='/tmp/test.js' # Aggregation of js referenced in html
conf_file='/tmp/eslint.conf' # File to store eslint config

# Variables used indirectly (mainly by gui)
exports='action_auction
action_buy
action_construct
action_manage
action_pray
action_work
Case
center
construct
fundBuilding
guiAllowDropItem
guiBuyAuction
guiDropItem
guiDropItemAuction
guiPutAuction
guiStartDragItem
init
production'

# Computed values
root_dir="`dirname "$0"`/`dirname "$html_base"`"

# Put eslint options at the begining of the aggregated js file
rm -f "$js_out"
echo -e "/* === ESLint options === */\n" >> "$js_out"
for v in $exports; do
	echo "/* exported $v */" >> "$js_out"
done

# Generate an aggregated js file
for f in `grep 'script src=' "$html_base" | sed 's/\t<script src="\([^"]\+\)".\+/\1/'`; do
	echo -e "\n/* === $f === */\n" >> "$js_out"
	cat "$root_dir/$f" >> "$js_out"
done

# Generate config file
(cat <<EOF
{
    "rules": {
		"comma-dangle": [0],
        "indent": [2, "tab"],
        "linebreak-style": [2, "unix"],
		"no-undef": [2],
		"no-unused-vars": [2, {"vars": "all", "args": "none"}],
        "quotes": [2, "single"],
        "semi": [2, "always"]
    },
    "env": {
        "es6": true,
        "browser": true
    },
    "extends": "eslint:recommended"
}
EOF
) > "$conf_file"

# Run eslint
"$eslint_bin" --config "$conf_file" "$js_out"
