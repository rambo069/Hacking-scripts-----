#!/bin/sh

echo "==================================="
echo "      Password Strength Checker"
echo "==================================="

# Read password without displaying it
printf 'Enter your password: ' >&2
if command -v stty >/dev/null 2>&1; then
    stty -echo
fi
IFS= read -r password
if command -v stty >/dev/null 2>&1; then
    stty echo
fi
printf '\n'

if [ -z "$password" ]; then
    echo "Password cannot be empty."
    exit 1
fi

score=0

# Check length
password_length=$(printf '%s' "$password" | wc -c | tr -d ' ')
if [ "$password_length" -ge 8 ]; then
    echo "✔ Length: OK"
    score=$((score + 1))
else
    echo "✘ Password should be at least 8 characters."
fi

# Uppercase
case "$password" in
    *[A-Z]*)
        echo "✔ Contains uppercase letter"
        score=$((score + 1))
        ;;
    *)
        echo "✘ Missing uppercase letter"
        ;;
esac

# Lowercase
case "$password" in
    *[a-z]*)
        echo "✔ Contains lowercase letter"
        score=$((score + 1))
        ;;
    *)
        echo "✘ Missing lowercase letter"
        ;;
esac

# Number
case "$password" in
    *[0-9]*)
        echo "✔ Contains number"
        score=$((score + 1))
        ;;
    *)
        echo "✘ Missing number"
        ;;
esac

# Special character
case "$password" in
    *[!A-Za-z0-9]*)
        echo "✔ Contains special character"
        score=$((score + 1))
        ;;
    *)
        echo "✘ Missing special character"
        ;;
esac

echo
echo "Score: $score / 5"

if [ "$score" -le 2 ]; then
    echo "Password Strength: Weak"
elif [ "$score" -eq 3 ]; then
    echo "Password Strength: Medium"
elif [ "$score" -eq 4 ]; then
    echo "Password Strength: Strong"
else
    echo "Password Strength: Very Strong"
fi
