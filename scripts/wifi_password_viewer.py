import subprocess
import re
import argparse
from pathlib import Path


def get_saved_wifi_profiles():
    proc = subprocess.run(["netsh", "wlan", "show", "profiles"], capture_output=True, text=True)
    output = proc.stdout or proc.stderr
    profiles = re.findall(r"All User Profile\s*:\s*(.+)", output)
    return [p.strip() for p in profiles]


def _try_profile_variant(name_variant: str):
    proc = subprocess.run(["netsh", "wlan", "show", "profile", name_variant, "key=clear"], capture_output=True, text=True)
    if proc.returncode != 0:
        return None, (proc.stderr or proc.stdout or '').strip()
    details = proc.stdout
    m = re.search(r"Key Content\s*:\s*(.+)", details, re.IGNORECASE)
    if m:
        return m.group(1).strip(), None
    snippet = details.strip().splitlines()[-6:]
    return None, "No password found (may require admin). Output snippet: " + " | ".join([s.strip() for s in snippet if s.strip()])


def get_wifi_password(profile_name):
    # Try a few common fixes for encoding/mojibake issues so netsh finds the profile
    import unicodedata
    variants = [profile_name]
    try:
        variants.append(profile_name.encode('latin-1').decode('utf-8'))
    except Exception:
        pass
    try:
        variants.append(profile_name.encode('cp1252').decode('utf-8'))
    except Exception:
        pass
    variants.append(profile_name.replace('\u2019', "'"))
    variants.append(unicodedata.normalize('NFKD', profile_name).encode('ascii', 'ignore').decode())
    # Try with a trailing space in case the stored profile name includes it
    variants.append(profile_name + " ")

    seen = set()
    last_err = None
    for v in variants:
        if not v or v in seen:
            continue
        seen.add(v)
        pwd, err = _try_profile_variant(v)
        if pwd is not None:
            return pwd
        last_err = err

    return f"Error running netsh (tried variants). Last error: {last_err}"


def main(output_file: str | None):
    profiles = get_saved_wifi_profiles()
    lines = []
    print("Saved Wi-Fi networks:")
    for profile in profiles:
        password = get_wifi_password(profile)
        line = f"SSID: {profile}\nPassword: {password}\n{'-'*40}"
        print(line)
        lines.append(line)

    if output_file:
        p = Path(output_file)
        p.write_text("\n".join(lines), encoding="utf-8")
        print(f"Results saved to: {p}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wi-Fi Password Viewer (Windows)")
    parser.add_argument("--output", "-o", help="Save results to a file")
    args = parser.parse_args()
    main(args.output)
