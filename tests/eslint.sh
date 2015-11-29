#!/bin/bash

# Configuration
eslint_bin='eslint'
html_base='../index.html' # The html document referencing js files
js_out='/tmp/test.js' # Aggregation of js referenced in html
conf_file='/tmp/eslint.conf' # File to store eslint config

# Variables used indirectly (mainly by gui)
exports='Case
construct
guiHideGenericForm
init'

# Let override defaults
if [ -f ~/.influence-eslint.defaults ]; then
	. ~/.influence-eslint.defaults
fi

# Computed values
root_dir="`dirname "$0"`/`dirname "$html_base"`"
html_path="`basename $html_base`"

# Put eslint options at the begining of the aggregated js file
rm -f "$js_out"
echo -e "/* === ESLint options === */\n" >> "$js_out"
for v in $exports; do
	echo "/* exported $v */" >> "$js_out"
done

# Generate an aggregated js file
for f in `grep 'script src=' "$root_dir/$html_path" | sed 's/\t<script src="\([^"]\+\)".\+/\1/'`; do
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
        "browser": true,
		"es6": true
    },
    "extends": "eslint:recommended"
}
EOF
) > "$conf_file"

# Run eslint
"$eslint_bin" --config "$conf_file" "$js_out"
